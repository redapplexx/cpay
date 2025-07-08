"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutService = void 0;
const admin_1 = require("../admin");
const types_1 = require("../types");
const utils_1 = require("../utils");
const errors_1 = require("../utils/errors");
const auditLogService_1 = require("./auditLogService");
const db = admin_1.admin.firestore();
const payoutsCollection = db.collection('payouts');
class PayoutService {
    static async createBatch(data, createdBy) {
        const now = new Date();
        const batchId = (0, utils_1.generateBatchId)();
        const payout = {
            id: batchId,
            batchId,
            status: types_1.MassPayoutStatus.PENDING,
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
            await payoutsCollection.doc(batchId).set(Object.assign(Object.assign({}, payout), { createdAt: (0, utils_1.formatDate)(now), updatedAt: (0, utils_1.formatDate)(now) }));
            await auditLogService_1.AuditLogService.log({
                actor: createdBy,
                action: 'PAYOUT_BATCH_CREATED',
                resource: 'payouts',
                resourceId: batchId,
                after: payout,
            });
            return payout;
        }
        catch (error) {
            throw new errors_1.DatabaseError(`Failed to create payout batch: ${error}`);
        }
    }
    static async processBatch(batchId, processedBy, tenantId) {
        await this.updateBatchStatus(batchId, tenantId, {
            status: types_1.MassPayoutStatus.PROCESSING,
            updatedAt: new Date(),
            processedBy,
        });
    }
    static async retryBatch(batchId, retriedBy) {
        await payoutsCollection.doc(batchId).update({ retryCount: admin_1.admin.firestore.FieldValue.increment(1), updatedAt: (0, utils_1.formatDate)(new Date()) });
        await auditLogService_1.AuditLogService.log({
            actor: retriedBy,
            action: 'PAYOUT_BATCH_RETRY',
            resource: 'payouts',
            resourceId: batchId,
            after: { retry: true },
        });
    }
    static async getBatchStatus(batchId, tenantId) {
        const snapshot = await payoutsCollection
            .where('id', '==', batchId)
            .where('tenantId', '==', tenantId)
            .limit(1)
            .get();
        return snapshot.empty ? null : snapshot.docs[0].data();
    }
    static async updateBatchStatus(batchId, tenantId, updates) {
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
exports.PayoutService = PayoutService;
//# sourceMappingURL=payoutService.js.map