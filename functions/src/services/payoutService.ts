import { admin } from '../admin';
import { MassPayout, MassPayoutStatus, MassPayoutRequest } from '../types';
import { generateBatchId, formatDate } from '../utils';
import { DatabaseError } from '../utils/errors';
import { AuditLogService } from './auditLogService';

const db = admin.firestore();
const payoutsCollection = db.collection('payouts');

export class PayoutService {
  static async createBatch(data: MassPayoutRequest, createdBy: string): Promise<MassPayout> {
    const now = new Date();
    const batchId = generateBatchId();
    const payout: MassPayout = {
      id: batchId,
      batchId,
      status: MassPayoutStatus.PENDING,
      totalAmount: data.recipients.reduce((sum, r) => sum + r.amount, 0),
      totalFee: 0,
      currency: data.currency,
      recipientCount: data.recipients.length,
      processedCount: 0,
      failedCount: 0,
      createdAt: now,
      updatedAt: now,
      metadata: data.metadata || {},
    };
    try {
      await payoutsCollection.doc(batchId).set({ ...payout, createdAt: formatDate(now), updatedAt: formatDate(now) });
      await AuditLogService.log({
        actor: createdBy,
        action: 'PAYOUT_BATCH_CREATED',
        resource: 'payouts',
        resourceId: batchId,
        after: payout,
      });
      return payout;
    } catch (error) {
      throw new DatabaseError(`Failed to create payout batch: ${error}`);
    }
  }

  static async processBatch(batchId: string, processedBy: string, tenantId: string): Promise<void> {
    await this.updateBatchStatus(batchId, tenantId, {
      status: MassPayoutStatus.PROCESSING,
      updatedAt: new Date(),
      processedBy,
    });
  }

  static async retryBatch(batchId: string, retriedBy: string): Promise<void> {
    await payoutsCollection.doc(batchId).update({ retryCount: admin.firestore.FieldValue.increment(1), updatedAt: formatDate(new Date()) });
    await AuditLogService.log({
      actor: retriedBy,
      action: 'PAYOUT_BATCH_RETRY',
      resource: 'payouts',
      resourceId: batchId,
      after: { retry: true },
    });
  }

  static async getBatchStatus(batchId: string, tenantId: string): Promise<MassPayout | null> {
    const snapshot = await payoutsCollection
      .where('id', '==', batchId)
      .where('tenantId', '==', tenantId)
      .limit(1)
      .get();
    return snapshot.empty ? null : (snapshot.docs[0].data() as MassPayout);
  }

  static async updateBatchStatus(batchId: string, tenantId: string, updates: any): Promise<void> {
    const snapshot = await payoutsCollection
      .where('id', '==', batchId)
      .where('tenantId', '==', tenantId)
      .limit(1)
      .get();
    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update(updates);
    }
  }
} 