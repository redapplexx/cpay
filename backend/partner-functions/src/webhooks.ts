// backend/partner-functions/src/webhooks.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { PubSub } from '@google-cloud/pubsub';
import { WebhookLog } from './types'; // Assuming WebhookLog type is defined here or imported

try { admin.initializeApp(); } catch (e) { /* App already initialized */ }
const db = admin.firestore();
const pubsub = new PubSub();
const WEBHOOK_QUEUE_TOPIC = 'partner-webhook-queue'; // Matches topic used by processWebhookQueue

// --- Helper Functions ---
const ensurePartnerAuth = async (context: functions.https.CallableContext, allowedRoles: string[]) => {
  if (!context.auth || !context.auth.token.partnerId || !context.auth.token.role) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required. Please log in.');
  }
  const userRole = context.auth.token.role as string;
  if (!allowedRoles.includes(userRole)) {
    throw new functions.https.HttpsError('permission-denied', 'You do not have sufficient permissions to perform this action.');
  }
  return { uid: context.auth.uid, partnerId: context.auth.token.partnerId as string, role: userRole, email: context.auth.token.email || 'N/A' };
};

const logAction = async (partnerId: string, userId: string, userEmail: string, action: string, details: Record<string, any>) => {
    await db.collection('partners').doc(partnerId).collection('auditLogs').add({
        partnerId, userId, userEmail, action, details, timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
};

// --- Callable Functions for Webhooks ---

const WebhookConfigSchema = z.object({
    sandboxUrl: z.string().url().or(z.literal('')).optional(),
    liveUrl: z.string().url().or(z.literal('')).optional(),
});

/**
 * Updates a partner's webhook configuration.
 */
export const updateWebhookConfig = functions.https.onCall(async (data, context) => {
    const { uid, partnerId, email } = await ensurePartnerAuth(context, ['OWNER', 'ADMIN']);
    try {
        const config = WebhookConfigSchema.parse(data);
        const partnerRef = db.collection('partners').doc(partnerId);
        await partnerRef.update({
            'webhookConfig.sandboxUrl': config.sandboxUrl,
            'webhookConfig.liveUrl': config.liveUrl,
        });
        await logAction(partnerId, uid, email, 'UPDATE_WEBHOOK_CONFIG', { urls: config });
        return { status: 'success', message: 'Webhook configuration updated.' };
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid URL format.', error.errors);
        }
        console.error('Error updating webhook config:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update webhook configuration.');
    }
});

/**
 * Retrieves webhook delivery logs for a partner.
 */
export const getWebhookLogs = functions.https.onCall(async (data, context) => {
    const { partnerId } = await ensurePartnerAuth(context, ['OWNER', 'ADMIN', 'OPERATOR', 'VIEWER']);
    try {
        const snapshot = await db.collection('partners').doc(partnerId).collection('webhookLogs')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error: any) {
        console.error('Error getting webhook logs:', error);
        throw new functions.https.HttpsError('internal', 'Failed to retrieve webhook logs.');
    }
});

const ResendWebhookSchema = z.object({
    logId: z.string().min(1),
});

/**
 * Manually triggers a resend of a failed webhook.
 */
export const resendWebhook = functions.https.onCall(async (data, context) => {
    const { uid, partnerId, email } = await ensurePartnerAuth(context, ['OWNER', 'ADMIN']);

    try {
        const { logId } = ResendWebhookSchema.parse(data);

        // 1. Fetch the original webhook log
        const logRef = db.collection('partners').doc(partnerId).collection('webhookLogs').doc(logId);
        const logDoc = await logRef.get();

        if (!logDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Webhook log not found.');
        }
        const originalLog = logDoc.data() as WebhookLog;

        // Only allow resend for failed webhooks
        if (originalLog.deliveryStatus !== 'FAILED') {
            throw new functions.https.HttpsError('failed-precondition', 'Only failed webhooks can be resent manually.');
        }

        // 2. Extract original payload and event details
        const eventPayload = originalLog.requestPayload; // Assuming full payload was stored
        const eventType = originalLog.eventType;

        // 3. Publish to Pub/Sub topic to trigger re-send
        // The `processWebhookQueue` function subscribes to this topic.
        const pubsubMessage = Buffer.from(JSON.stringify({
            partnerId: originalLog.partnerId,
            eventType: eventType,
            payload: eventPayload,
            timestamp: new Date().toISOString(), // Use current timestamp for resend attempt
            resendAttempt: (originalLog.attempts || 0) + 1, // Track resend attempts
        }));

        await pubsub.topic(WEBHOOK_QUEUE_TOPIC).publishMessage({ data: pubsubMessage });

        // 4. Update the original log with retry information
        await logRef.update({
            deliveryStatus: 'PENDING', // Set back to pending
            attempts: admin.firestore.FieldValue.increment(1), // Increment attempt count
            lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await logAction(partnerId, uid, email, 'RESEND_WEBHOOK', { logId, eventType });
        return { status: 'success', message: `Webhook ${logId} has been queued for resending.` };

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid log ID provided.');
        }
        console.error(`Error resending webhook ${data.logId} for partner ${partnerId}:`, error);
        throw new functions.https.HttpsError('internal', 'Failed to resend webhook. Please try again.');
    }
});
