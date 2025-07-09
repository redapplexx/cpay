// backend/partner-functions/src/dashboard.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

try { admin.initializeApp(); } catch (e) { /* App already initialized */ }
const db = admin.firestore();

// Helper Function
const ensurePartnerAuth = async (context: functions.https.CallableContext, allowedRoles: string[]) => {
  if (!context.auth || !context.auth.token.partnerId || !context.auth.token.role) {
    throw new functions.https.HttpsError('unauthenticated', 'Not authenticated as a partner user.');
  }
  if (!allowedRoles.includes(context.auth.token.role as string)) {
    throw new functions.https.HttpsError('permission-denied', 'You do not have permission to perform this action.');
  }
  return { uid: context.auth.uid, partnerId: context.auth.token.partnerId as string };
};

/**
 * Retrieves dashboard statistics for the authenticated partner.
 */
export const getPartnerDashboardStats = functions.https.onCall(async (data, context) => {
  const { partnerId } = await ensurePartnerAuth(context, ['OWNER', 'ADMIN', 'OPERATOR', 'VIEWER']);

  try {
    // Get total payout volume and count for this partner
    const payoutLogsSnapshot = await db.collection('partners').doc(partnerId).collection('payoutLogs')
                                     .where('status', '==', 'SUCCESS')
                                     .get();
    
    let totalPayoutVolume = 0;
    payoutLogsSnapshot.forEach(doc => {
      totalPayoutVolume += doc.data().amount || 0;
    });
    const totalPayouts = payoutLogsSnapshot.size;

    // Get active merchants associated with this partner
    const activeMerchantsSnapshot = await db.collection('partners').doc(partnerId).collection('kycSubmissions')
                                           .where('status', '==', 'APPROVED')
                                           .count().get();
    const activeMerchants = activeMerchantsSnapshot.data().count;

    // Placeholder for last 7 days payouts - would need more complex querying or aggregated data
    const last7DaysPayouts = 0; // TODO: Implement actual calculation

    return {
      totalPayoutVolume,
      totalPayouts,
      activeMerchants,
      last7DaysPayouts,
      lastUpdateTimestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
  } catch (error: any) {
    console.error(`Error getting dashboard stats for partner ${partnerId}:`, error);
    throw new functions.https.HttpsError('internal', 'Failed to retrieve dashboard statistics.', error.message);
  }
});
