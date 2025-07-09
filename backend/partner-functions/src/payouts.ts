// backend/partner-functions/src/payouts.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { customAlphabet } from 'nanoid';
import type { PayoutBatch, PayoutLog } from './types';

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
    // Simplified audit log helper
    await db.collection('partners').doc(partnerId).collection('auditLogs').add({
        partnerId, userId, action, details, timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
};

const PayoutFileSchema = z.object({
    fileName: z.string(),
    gcsFilePath: z.string(), // GCS path instead of file content
    payouts: z.array(z.object({
        payoutId: z.string(), // Partner's internal reference ID
        channel: z.string(),  // e.g., 'GCASH', 'BDO_BANK_TRANSFER'
        amount: z.number().positive(),
        currency: z.enum(['PHP']),
        recipient: z.object({
            name: z.string(),
            accountNumber: z.string(),
        }),
    })).min(1),
});

/**
 * Handles the upload of a payout file, validates it, and creates payout log entries.
 */
export const uploadPayoutBatch = functions.https.onCall(async (data, context) => {
    const { uid, partnerId } = await ensurePartnerAuth(context, ['OWNER', 'ADMIN', 'OPERATOR']);
    const validation = PayoutFileSchema.safeParse(data);

    if (!validation.success) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid payout file format.', validation.error.format());
    }

    const { fileName, gcsFilePath, payouts } = validation.data;
    const batchId = `batch_${customAlphabet('0123456789abcdef', 16)()}`;

    const batch: PayoutBatch = {
        batchId,
        partnerId,
        uploadedByUid: uid,
        fileName,
        gcsFilePath,
        status: 'PROCESSING',
        totalPayouts: payouts.length,
        totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0),
        currency: 'PHP',
        createdAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
    };

    const batchRef = db.collection('partners').doc(partnerId).collection('payoutBatches').doc(batchId);
    
    // Use a Firestore transaction to ensure all or nothing
    await db.runTransaction(async (transaction) => {
        transaction.set(batchRef, batch);

        payouts.forEach(payout => {
            const logRef = db.collection('partners').doc(partnerId).collection('payoutLogs').doc();
            const payoutLog: PayoutLog = {
                logId: logRef.id,
                batchId,
                partnerId,
                payoutId: payout.payoutId,
                status: 'PENDING', // Initial status
                channel: payout.channel,
                amount: payout.amount,
                currency: payout.currency,
                requestPayload: payout, // Store the initial request
                responsePayload: {},
                createdAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
                updatedAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
            };
            transaction.set(logRef, payoutLog);
        });
    });

    // TODO: Trigger a background function to process the payouts in this batch
    // This function would iterate through the 'payoutLogs', call the actual payout APIs,
    // update the status of each log, and send webhooks.

    await logAction(partnerId, uid, 'UPLOAD_PAYOUT_BATCH', { batchId, fileName, count: payouts.length });
    
    return { status: 'success', message: 'Payout batch uploaded and is being processed.', batchId };
});

/**
 * Retrieves payout logs for a partner, with optional filtering.
 */
export const getPayoutLogs = functions.https.onCall(async (data, context) => {
    const { partnerId } = await ensurePartnerAuth(context, ['OWNER', 'ADMIN', 'OPERATOR', 'VIEWER']);
    const { batchId } = z.object({ batchId: z.string().optional() }).parse(data || {});

    let query: admin.firestore.Query = db.collection('partners').doc(partnerId).collection('payoutLogs');

    if (batchId) {
        query = query.where('batchId', '==', batchId);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').limit(50).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});
