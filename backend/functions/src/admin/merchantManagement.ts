// backend/functions/src/admin/merchantManagement.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';

// Initialize admin if not already done
try { admin.initializeApp(); } catch (e) {}

const db = admin.firestore();

/**
 * Ensures the caller is an authenticated admin.
 */
const ensureAdmin = async (context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
  }
  const user = await admin.auth().getUser(context.auth.uid);
  if (user.customClaims?.role !== 'ADMIN') {
    throw new functions.https.HttpsError('permission-denied', 'You must be an administrator.');
  }
};

/**
 * Cloud Function for admins to list all merchant applications.
 */
export const adminListMerchants = functions.https.onCall(async (data, context) => {
  await ensureAdmin(context);

  try {
    const merchantsSnapshot = await db.collection('merchants').get();
    const merchants = merchantsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return merchants;
  } catch (error: any) {
    console.error('Error listing merchants:', error);
    throw new functions.https.HttpsError('internal', 'Failed to list merchants.', error.message);
  }
});

const updateStatusSchema = z.object({
    merchantId: z.string(),
    status: z.enum(['ACTIVE', 'REJECTED']),
    rejectionReason: z.string().optional(),
});

/**
 * Cloud Function for admins to approve or reject a merchant application.
 */
export const adminUpdateMerchantStatus = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);

    const { merchantId, status, rejectionReason } = updateStatusSchema.parse(data);

    try {
        const merchantRef = db.collection('merchants').doc(merchantId);
        await merchantRef.update({
            status: status,
            ...(status === 'REJECTED' && { rejectionReason }),
            ...(status === 'ACTIVE' && { approvedAt: admin.firestore.FieldValue.serverTimestamp() }),
        });
        // TODO: Send notification email to merchant owner
        return { status: 'success', message: `Merchant status updated to ${status}.` };
    } catch (error: any) {
        console.error('Error updating merchant status:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update merchant status.', error.message);
    }
});
