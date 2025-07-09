// backend/partner-functions/src/kyc.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';

try { admin.initializeApp(); } catch (e) { /* App already initialized */ }
const db = admin.firestore();

// Helper Functions
const ensurePartnerAuth = async (context: functions.https.CallableContext, allowedRoles: string[]) => {
  if (!context.auth || !context.auth.token.partnerId || !context.auth.token.role) {
    throw new functions.https.HttpsError('unauthenticated', 'Not authenticated as a partner user.');
  }
  if (!allowedRoles.includes(context.auth.token.role as string)) {
    throw new functions.https.HttpsError('permission-denied', 'You do not have permission to perform this action.');
  }
  return { uid: context.auth.uid, partnerId: context.auth.token.partnerId as string };
};

const logAction = async (partnerId: string, userId: string, action: string, details: Record<string, any>) => {
    await db.collection('partners').doc(partnerId).collection('auditLogs').add({
        partnerId, userId, action, details, timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
};

// Schema for submitting KYC for a merchant onboarded by a partner
const KycSubmissionSchema = z.object({
    merchantReferenceId: z.string(), // The partner's internal ID for their merchant
    type: z.enum(['INDIVIDUAL', 'BUSINESS']),
    details: z.record(z.any()), // Flexible object for KYC details
    documentUrls: z.array(z.object({
        type: z.string(), // e.g., 'ID_FRONT', 'BUSINESS_PERMIT'
        url: z.string().startsWith('gs://'), // GCS URL
    })),
});

/**
 * Allows a partner to submit KYC/KYB information for one of their merchants.
 */
export const submitKycForMerchant = functions.https.onCall(async (data, context) => {
    const { uid, partnerId } = await ensurePartnerAuth(context, ['OWNER', 'ADMIN', 'OPERATOR']);
    const validation = KycSubmissionSchema.safeParse(data);

    if (!validation.success) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid KYC submission data.', validation.error.format());
    }
    const kycData = validation.data;
    
    // In a real system, you would store this in a dedicated `kycSubmissions` collection,
    // linking it to the partner and their merchant reference ID.
    const submissionRef = db.collection('partners').doc(partnerId).collection('kycSubmissions').doc();

    await submissionRef.set({
        ...kycData,
        partnerId,
        submittedByUid: uid,
        status: 'PENDING', // Initial status for CPAY admin to review
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // TODO: Trigger internal notification for CPay compliance team to review this submission.

    await logAction(partnerId, uid, 'SUBMIT_KYC', { merchantReferenceId: kycData.merchantReferenceId });
    return { status: 'success', message: 'KYC submission received and is pending review.', submissionId: submissionRef.id };
});

/**
 * Retrieves the status of KYC submissions for a partner.
 */
export const getKycSubmissions = functions.https.onCall(async (data, context) => {
    const { partnerId } = await ensurePartnerAuth(context, ['OWNER', 'ADMIN', 'OPERATOR', 'VIEWER']);
    
    const snapshot = await db.collection('partners').doc(partnerId).collection('kycSubmissions')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});
