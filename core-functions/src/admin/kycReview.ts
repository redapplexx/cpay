// core-functions/src/admin/kycReview.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';

try { admin.initializeApp(); } catch (e) { /* App already initialized */ }
const db = admin.firestore();

// --- Helper Function ---
const ensureCPayAdmin = async (context: functions.https.CallableContext) => {
  if (!context.auth || context.auth.token.role !== 'ADMIN') {
    throw new functions.https.HttpsError('permission-denied', 'Access denied. Only CPAY administrators can perform this action.');
  }
};

/**
 * Cloud Function for CPAY Admins to retrieve a list of KYC submissions.
 * Can be filtered by status.
 */
export const getKycSubmissionsAdmin = functions.https.onCall(async (data, context) => {
  await ensureCPayAdmin(context);

  const { status } = z.object({ status: z.enum(['PENDING_REVIEW', 'APPROVED', 'REJECTED']).optional() }).parse(data);

  try {
    let query: admin.firestore.Query = db.collection('kycSubmissions');

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('submittedAt', 'desc').limit(100).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  } catch (error: any) {
    console.error('Error getting KYC submissions for admin:', error);
    throw new functions.https.HttpsError('internal', 'Failed to retrieve KYC submissions.', error.message);
  }
});

const updateKycStatusSchema = z.object({
  submissionId: z.string(),
  userId: z.string(), // The UID of the user who submitted KYC
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
});

/**
 * Cloud Function for CPAY Admins to approve or reject a KYC submission.
 */
export const updateKycStatus = functions.https.onCall(async (data, context) => {
  await ensureCPayAdmin(context);

  const { submissionId, userId, status, rejectionReason } = updateKycStatusSchema.parse(data);

  try {
    // Use a Firestore transaction for atomicity
    await db.runTransaction(async (transaction) => {
      const submissionRef = db.collection('kycSubmissions').doc(submissionId);
      const userRef = db.collection('users').doc(userId);

      const submissionDoc = await transaction.get(submissionRef);
      if (!submissionDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'KYC submission not found.');
      }

      // Update submission status
      transaction.update(submissionRef, {
        status,
        reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        reviewerUid: context.auth?.uid,
        ...(status === 'REJECTED' && { rejectionReason }),
      });

      // Update user's main KYC status
      transaction.update(userRef, { kycStatus: status });
    });

    // TODO: Send notification to user (e.g., email or in-app notification) about status change

    return { success: true, message: `KYC submission ${submissionId} ${status.toLowerCase()}.` };
  } catch (error: any) {
    console.error(`Error updating KYC status for submission ${submissionId}:`, error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to update KYC status.', error.message);
  }
});
