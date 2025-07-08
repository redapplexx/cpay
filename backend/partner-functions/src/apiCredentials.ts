// backend/partner-functions/src/apiCredentials.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { Partner } from './types';
import { customAlphabet } from 'nanoid'; // For generating secure keys

// Initialize admin if not already done
try { admin.initializeApp(); } catch (e) {}

const db = admin.firestore();

// Helper to ensure the caller is authenticated and belongs to a partner
const ensurePartnerAuth = (context: functions.https.CallableContext) => {
  if (!context.auth || !context.auth.token.partnerId || !context.auth.token.role) {
    throw new functions.https.HttpsError('unauthenticated', 'Not authenticated as a partner user.');
  }
  return { uid: context.auth.uid, partnerId: context.auth.token.partnerId as string, role: context.auth.token.role as string };
};

/**
 * Cloud Function to get a partner's API credentials.
 * Only accessible by partner users, scoped to their partnerId.
 * SHA256 keys are returned masked.
 */
export const getPartnerApiCredentials = functions.https.onCall(async (data, context) => {
  const { partnerId } = ensurePartnerAuth(context);

  try {
    const partnerDoc = await db.collection('partners').doc(partnerId).get();
    if (!partnerDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Partner not found.');
    }

    const partnerData = partnerDoc.data() as Partner;

    // Return masked keys for security
    const maskKey = (key: string | undefined) => key ? `***${key.slice(-4)}` : 'N/A';

    return {
      status: 'success',
      apiCredentials: {
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
      },
      environment: partnerData.environment,
    };
  } catch (error: any) {
    console.error('Error getting partner API credentials:', error);
    throw new functions.https.HttpsError('internal', 'Failed to retrieve API credentials.', error.message);
  }
});

const generateSha256KeySchema = z.object({
  env: z.enum(['test', 'production']),
});

/**
 * Cloud Function to regenerate a partner's SHA256 key.
 * Only accessible by 'OWNER' or 'ADMIN' roles.
 */
export const regeneratePartnerSha256Key = functions.https.onCall(async (data, context) => {
  const { partnerId, role } = ensurePartnerAuth(context);

  if (role !== 'OWNER' && role !== 'ADMIN') {
    throw new functions.https.HttpsError('permission-denied', 'Only owners or admins can regenerate API keys.');
  }

  const { env } = generateSha256KeySchema.parse(data);
  const newKey = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 32)(); // Generate a new 32-char alphanumeric key
  const lastGeneratedField = env === 'test' ? 'lastTestKeyGeneratedAt' : 'lastProdKeyGeneratedAt';

  try {
    const partnerRef = db.collection('partners').doc(partnerId);
    await partnerRef.update({
      [`apiCredentials.${env}.sha256Key`]: newKey,
      [`apiCredentials.${lastGeneratedField}`]: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Audit Log the action (FR-PAC-007)
    await db.collection('auditLogs').add({
      partnerId: partnerId,
      userId: context.auth!.uid,
      userEmail: context.auth!.token.email || 'N/A',
      action: `REGENERATE_API_KEY_${env.toUpperCase()}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: { env },
    });

    return { status: 'success', message: `New ${env} SHA256 key generated.`, newKey: newKey };
  } catch (error: any) {
    console.error(`Error regenerating ${env} SHA256 key:`, error);
    throw new functions.https.HttpsError('internal', `Failed to regenerate ${env} SHA256 key.`, error.message);
  }
});

const setPartnerEnvironmentSchema = z.object({
  environment: z.enum(['SANDBOX', 'LIVE']),
});

/**
 * Cloud Function to toggle a partner's environment (Sandbox/Live).
 * Only accessible by 'OWNER' or 'ADMIN' roles.
 */
export const setPartnerEnvironment = functions.https.onCall(async (data, context) => {
  const { partnerId, role } = ensurePartnerAuth(context);

  if (role !== 'OWNER' && role !== 'ADMIN') {
    throw new functions.https.HttpsError('permission-denied', 'Only owners or admins can change the environment.');
  }

  const { environment } = setPartnerEnvironmentSchema.parse(data);

  try {
    const partnerRef = db.collection('partners').doc(partnerId);
    await partnerRef.update({
      environment: environment,
    });

    // Audit Log the action (FR-PAC-007)
    await db.collection('auditLogs').add({
      partnerId: partnerId,
      userId: context.auth!.uid,
      userEmail: context.auth!.token.email || 'N/A',
      action: `SET_ENVIRONMENT_TO_${environment.toUpperCase()}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: { environment },
    });

    return { status: 'success', message: `Environment set to ${environment}.` };
  } catch (error: any) {
    console.error(`Error setting environment to ${environment}:`, error);
    throw new functions.https.HttpsError('internal', `Failed to set environment to ${environment}.`, error.message);
  }
});
