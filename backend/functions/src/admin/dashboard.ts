// backend/functions/src/admin/dashboard.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

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
 * Cloud Function to get high-level statistics for the admin dashboard.
 */
export const adminGetDashboardStats = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);

    try {
        // Get total users
        const userCountPromise = db.collection('users').count().get();
        
        // Get pending merchants
        const pendingMerchantsPromise = db.collection('merchants').where('status', '==', 'PENDING_REVIEW').count().get();

        // Get total transaction volume (Note: This is an expensive operation)
        // For production, this data should be aggregated daily into a separate document.
        const transactionsPromise = db.collection('transactions').where('status', '==', 'Completed').get();

        const [userCountResult, pendingMerchantsResult, transactionsSnapshot] = await Promise.all([
            userCountPromise,
            pendingMerchantsPromise,
            transactionsPromise
        ]);

        let totalVolume = 0;
        transactionsSnapshot.forEach(doc => {
            // Assuming amount is in a standard currency or needs conversion
            totalVolume += doc.data().amount || 0;
        });

        return {
            totalUsers: userCountResult.data().count,
            pendingMerchants: pendingMerchantsResult.data().count,
            totalTransactionVolume: totalVolume,
            totalTransactions: transactionsSnapshot.size,
        };

    } catch (error: any) {
        console.error("Error getting dashboard stats:", error);
        throw new functions.https.HttpsError('internal', 'Failed to retrieve dashboard statistics.');
    }
});
