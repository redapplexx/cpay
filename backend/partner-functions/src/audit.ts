// backend/partner-functions/src/audit.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

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

/**
 * Retrieves audit logs for the authenticated partner.
 */
export const getAuditLogs = functions.https.onCall(async (data, context) => {
    const { partnerId } = await ensurePartnerAuth(context, ['OWNER', 'ADMIN']); // Only admin/owner can see logs

    const snapshot = await db.collection('partners').doc(partnerId).collection('auditLogs')
        .orderBy('timestamp', 'desc')
        .limit(100) // Get the latest 100 actions
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});
