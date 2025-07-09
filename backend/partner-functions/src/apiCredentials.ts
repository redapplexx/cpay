// backend/partner-functions/src/apiCredentials.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { customAlphabet } from 'nanoid';
import { Partner } from './types'; // Assuming types are in a shared file

try { admin.initializeApp(); } catch (e) {}
const db = admin.firestore();

// Helper to ensure the caller is an authenticated partner with the right role
const ensurePartnerAuth = async (context: functions.https.CallableContext, allowedRoles: string[]) => {
  if (!context.auth || !context.auth.token.partnerId || !context.auth.token.role) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required. Please log in.');
  }
  const userRole = context.auth.token.role as string;
  if (!allowedRoles.includes(userRole)) {
    throw new functions.https.HttpsError('permission-denied', `You do not have permission. Required role: ${allowedRoles.join(' or ')}.`);
  }
  return { uid: context.auth.uid, partnerId: context.auth.token.partnerId as string, role: userRole, email: context.auth.token.email || 'N/A' };
};

// Helper to log partner actions for auditing
const logAction = async (partnerId: string, userId: string, userEmail: string, action: string, details: Record<string, any>) => {
    await db.collection('partners').doc(partnerId).collection('auditLogs').add({
        partnerId, userId, userEmail, action, details, timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
};

/**
 * Cloud Function to get a partner's API credentials.
 * Keys are masked for security.
 */
export const getApiCredentials = functions.https.onCall(async (data, context) => {
  const { partnerId } = await ensurePartnerAuth(context, ['OWNER', 'ADMIN', 'OPERATOR', 'VIEWER']);
  const partnerDoc = await db.collection('partners').doc(partnerId).get();
  if (!partnerDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Your partner data could not be found.');
  }
  const partnerData = partnerDoc.data() as Partner;
  const maskKey = (key: string | undefined) => key ? `****************************${key.slice(-4)}` : 'N/A';
  return {
    test: {
      merchantId: partnerData.apiCredentials?.test?.merchantId || 'N/A',
      sha256Key: maskKey(partnerData.apiCredentials?.test?.sha256Key),
    },
    production: {
      merchantId: partnerData.apiCredentials?.production?.merchantId || 'N/A',
      sha256Key: maskKey(partnerData.apiCredentials?.production?.sha256Key),
    },
    apiDocsUrl: partnerData.apiDocsUrl,
    postmanCollectionUrl: partnerData.postmanCollectionUrl,
    environment: partnerData.environment,
    webhookConfig: partnerData.webhookConfig,
  };
});

const regenerateKeySchema = z.object({ env: z.enum(['test', 'production']) });
/**
 * Regenerates a partner's SHA256 key and returns it once.
 */
export const regenerateApiKey = functions.https.onCall(async (data, context) => {
  const { partnerId, uid, email } = await ensurePartnerAuth(context, ['OWNER', 'ADMIN']);
  const { env } = regenerateKeySchema.parse(data);
  
  const newKey = `cpay_sk_${env}_${customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 32)()}`;
  const keyPath = `apiCredentials.${env}.sha256Key`;
  const timestampPath = `apiCredentials.${env}.lastGeneratedAt`;

  await db.collection('partners').doc(partnerId).update({ 
      [keyPath]: newKey,
      [timestampPath]: admin.firestore.FieldValue.serverTimestamp()
  });

  await logAction(partnerId, uid, email, `REGENERATE_${env.toUpperCase()}_API_KEY`, { environment: env });
  return { newKey };
});

const setEnvironmentSchema = z.object({ environment: z.enum(['SANDBOX', 'LIVE']) });
/**
 * Sets the partner's active environment (Sandbox or Live).
 */
export const setPartnerEnvironment = functions.https.onCall(async (data, context) => {
  const { partnerId, uid, email } = await ensurePartnerAuth(context, ['OWNER', 'ADMIN']);
  const { environment } = setEnvironmentSchema.parse(data);
  await db.collection('partners').doc(partnerId).update({ environment });
  await logAction(partnerId, uid, email, `SET_ENVIRONMENT`, { newEnvironment: environment });
  return { status: 'success', message: `Environment switched to ${environment}.` };
});
