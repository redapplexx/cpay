"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const admin_1 = require("../admin");
const types_1 = require("../types");
const utils_1 = require("../utils");
const validation_1 = require("../utils/validation");
const errors_1 = require("../utils/errors");
const fxFeeService_1 = require("./fxFeeService");
const auditLogService_1 = require("./auditLogService");
const db = admin_1.admin.firestore();
const transactionsCollection = db.collection('transactions');
class TransactionService {
    static async createTransaction(data, createdBy) {
        const validation = (0, validation_1.validateTransaction)(data);
        if (!validation.isValid)
            throw validation.errors[0];
        const now = new Date();
        const id = (0, utils_1.generateId)();
        let fxFee = 0;
        if (data.type === types_1.TransactionType.FX_CONVERSION) {
            fxFee = await fxFeeService_1.FXFeeService.calculateFXFee(data.amount, data.currency);
        }
        const transaction = {
            id,
            type: data.type,
            status: types_1.TransactionStatus.PENDING,
            fromWalletId: data.fromWalletId,
            toWalletId: data.toWalletId,
            fromUserId: data.fromUserId,
            toUserId: data.toUserId,
            amount: data.amount,
            currency: data.currency,
            fee: data.fee || 0,
            fxRate: data.fxRate,
            fxFee,
            description: data.description || '',
            reference: data.reference || '',
            externalReference: data.externalReference,
            metadata: data.metadata,
            createdAt: now,
            updatedAt: now,
            auditTrail: [],
        };
        try {
            await transactionsCollection.doc(id).set(Object.assign(Object.assign({}, transaction), { createdAt: (0, utils_1.formatDate)(now), updatedAt: (0, utils_1.formatDate)(now) }));
            await auditLogService_1.AuditLogService.log({
                actor: createdBy,
                action: 'TRANSACTION_CREATED',
                resource: 'transactions',
                resourceId: id,
                after: transaction,
            });
            return transaction;
        }
        catch (error) {
            throw new errors_1.DatabaseError(`Failed to create transaction: ${error}`);
        }
    }
    static async getTransaction(id) {
        const doc = await transactionsCollection.doc(id).get();
        if (!doc.exists)
            throw new errors_1.NotFoundError('Transaction', id);
        return doc.data();
    }
    static async updateTransactionStatus(id, status, updatedBy) {
        const doc = await transactionsCollection.doc(id).get();
        if (!doc.exists)
            throw new errors_1.NotFoundError('Transaction', id);
        await transactionsCollection.doc(id).update({ status, updatedAt: (0, utils_1.formatDate)(new Date()) });
        await auditLogService_1.AuditLogService.log({
            actor: updatedBy,
            action: 'TRANSACTION_STATUS_UPDATED',
            resource: 'transactions',
            resourceId: id,
            after: { status },
        });
    }
    static async listTransactions(filters = {}, limit = 50) {
        let query = transactionsCollection;
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined)
                query = query.where(key, '==', value);
        });
        const snapshot = await query.limit(limit).get();
        return snapshot.docs.map(doc => doc.data());
    }
}
exports.TransactionService = TransactionService;
//# sourceMappingURL=transactionService.js.map