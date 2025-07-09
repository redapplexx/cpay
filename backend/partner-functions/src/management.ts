// backend/partner-functions/src/management.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { customAlphabet } from 'nanoid';
import type { Partner } from './types';

try { admin.initializeApp(); } catch (e) { /* App already initialized */ }
const db = admin.firestore();

// --- Helper Functions ---
const ensurePartnerAuth = (context: functions.https.CallableContext, allowedRoles: string[]) => {
  if (!context.auth || !context.auth.token.partnerId || !context.auth.token.role) {
    throw new functions.https.HttpsError('unauthenticated', 'Not authenticated as a partner user.');
  }
  if (!allowedRoles.includes(context.auth.token.role)) {
    throw new functions.https.HttpsError('permission-denied', 'You do not have permission to perform this action.');
  }
  return { uid: context.auth.uid, partnerId: context.auth.token.partnerId as string, role: context.auth.token.role as string };
};

const logAction = async (partnerId: string, userId: string, userEmail: string, action: string, details: Record<string, any>) => {
    const auditLog = {
        partnerId,
        userId,
        userEmail,
        action,
        details,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        // ipAddress: context.rawRequest.ip // Requires function to be deployed with this option
    };
    await db.collection('partners').doc(partnerId).collection('auditLogs').add(auditLog);
};

// --- Callable Functions ---

/**
 * Gets a partner's API credentials. Masks the SHA256 keys for security.
 */
export const getApiCredentials = functions.https.onCall(async (_, context) => {
  const { partnerId } = ensurePartnerAuth(context, ['OWNER', 'ADMIN', 'OPERATOR', 'VIEWER']);

  const partnerDoc = await db.collection('partners').doc(partnerId).get();
  if (!partnerDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Partner data not found.');
  }
  const partnerData = partnerDoc.data() as Partner;
  
  const maskKey = (key: string) => `****************************${key.slice(-4)}`;

  return {
    test: {
      merchantId: partnerData.apiCredentials.test.merchantId,
      sha256Key: maskKey(partnerData.apiCredentials.test.sha256Key),
    },
    production: {
      merchantId: partnerData.apiCredentials.production.merchantId,
      sha256Key: maskKey(partnerData.apiCredentials.production.sha256Key),
    },
    apiDocsUrl: partnerData.apiDocsUrl,
    postmanCollectionUrl: partnerData.postmanCollectionUrl,
    environment: partnerData.environment,
  };
});

/**
 * Regenerates a partner's SHA256 key for either test or production.
 */
export const regenerateApiKey = functions.https.onCall(async (data, context) => {
  const { partnerId, uid, role } = ensurePartnerAuth(context, ['OWNER', 'ADMIN']);
  const { env } = z.object({ env: z.enum(['test', 'production']) }).parse(data);
  
  const newKey = `cpay_sk_${env}_${customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 32)()}`;
  const keyPath = `apiCredentials.${env}.sha256Key`;

  await db.collection('partners').doc(partnerId).update({ [keyPath]: newKey });

  await logAction(partnerId, uid, context.auth?.token.email || '', `REGENERATE_${env.toUpperCase()}_API_KEY`, { environment: env });

  // Return the new key ONCE for the user to copy. It will be masked on subsequent fetches.
  return { newKey };
});

/**
 * Sets the partner's active environment (Sandbox or Live).
 */
export const setPartnerEnvironment = functions.https.onCall(async (data, context) => {
  const { partnerId, uid, role } = ensurePartnerAuth(context, ['OWNER', 'ADMIN']);
  const { environment } = z.object({ environment: z.enum(['SANDBOX', 'LIVE']) }).parse(data);

  await db.collection('partners').doc(partnerId).update({ environment });
  
  await logAction(partnerId, uid, context.auth?.token.email || '', `SET_ENVIRONMENT`, { environment });

  return { status: 'success', message: `Environment switched to ${environment}.` };
});
