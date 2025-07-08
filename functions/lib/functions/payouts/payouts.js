"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryPayoutBatch = exports.processPayoutBatch = void 0;
const functions = __importStar(require("firebase-functions"));
const userService_1 = require("../../services/userService");
const payoutService_1 = require("../../services/payoutService");
const walletService_1 = require("../../services/walletService");
const accessControlService_1 = require("../../services/accessControlService");
const errors_1 = require("../../utils/errors");
const types_1 = require("../../types");
// Process a mass payout batch
exports.processPayoutBatch = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth)
            throw new Error('Authentication required');
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'update', 'payouts');
        if (!hasPermission)
            throw new Error('Insufficient permissions');
        const { batchId, tenantId } = data;
        const batch = await payoutService_1.PayoutService.getBatchStatus(batchId, tenantId);
        if (!batch)
            throw new Error('Payout batch not found');
        if (batch.status === types_1.MassPayoutStatus.COMPLETED) {
            return { success: true, message: 'Batch already completed' };
        }
        // Mark batch as processing
        await payoutService_1.PayoutService.processBatch(batchId, context.auth.uid, tenantId);
        // Recipients are stored as a field in the batch document
        const recipients = batch.recipients || [];
        let processedCount = 0, failedCount = 0;
        for (const recipient of recipients) {
            try {
                if (recipient.status === types_1.MassPayoutRecipientStatus.COMPLETED) {
                    processedCount++;
                    continue;
                }
                // Credit recipient wallet
                await walletService_1.WalletService.creditWallet(recipient.walletId, recipient.amount, batchId, 'Mass payout', batchId, context.auth.uid);
                recipient.status = types_1.MassPayoutRecipientStatus.COMPLETED;
                processedCount++;
            }
            catch (err) {
                recipient.status = types_1.MassPayoutRecipientStatus.FAILED;
                recipient.errorMessage = err.message;
                failedCount++;
            }
        }
        // Update batch status
        const newStatus = failedCount === 0
            ? types_1.MassPayoutStatus.COMPLETED
            : processedCount > 0
                ? types_1.MassPayoutStatus.PROCESSING
                : types_1.MassPayoutStatus.FAILED;
        await payoutService_1.PayoutService.updateBatchStatus(batchId, tenantId, {
            recipients,
            processedCount,
            failedCount,
            status: newStatus,
            updatedAt: new Date(),
            completedAt: newStatus === types_1.MassPayoutStatus.COMPLETED ? new Date() : undefined,
        });
        return {
            success: true,
            batchId,
            processedCount,
            failedCount,
            status: newStatus,
            recipients,
        };
    }
    catch (error) {
        console.error('processPayoutBatch error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// Retry failed payouts in a batch
exports.retryPayoutBatch = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth)
            throw new Error('Authentication required');
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'update', 'payouts');
        if (!hasPermission)
            throw new Error('Insufficient permissions');
        const { batchId, tenantId } = data;
        const batch = await payoutService_1.PayoutService.getBatchStatus(batchId, tenantId);
        if (!batch)
            throw new Error('Payout batch not found');
        const recipients = batch.recipients || [];
        let retried = 0, failedCount = 0;
        for (const recipient of recipients) {
            if (recipient.status === types_1.MassPayoutRecipientStatus.FAILED) {
                try {
                    await walletService_1.WalletService.creditWallet(recipient.walletId, recipient.amount, batchId, 'Mass payout retry', batchId, context.auth.uid);
                    recipient.status = types_1.MassPayoutRecipientStatus.COMPLETED;
                    retried++;
                }
                catch (err) {
                    recipient.errorMessage = err.message;
                    failedCount++;
                }
            }
        }
        const allCompleted = recipients.every((r) => r.status === types_1.MassPayoutRecipientStatus.COMPLETED);
        const newStatus = allCompleted ? types_1.MassPayoutStatus.COMPLETED : types_1.MassPayoutStatus.PROCESSING;
        await payoutService_1.PayoutService.updateBatchStatus(batchId, tenantId, {
            recipients,
            processedCount: recipients.filter((r) => r.status === types_1.MassPayoutRecipientStatus.COMPLETED).length,
            failedCount: recipients.filter((r) => r.status === types_1.MassPayoutRecipientStatus.FAILED).length,
            status: newStatus,
            updatedAt: new Date(),
            completedAt: allCompleted ? new Date() : undefined,
        });
        return {
            success: true,
            batchId,
            retried,
            failedCount,
            status: newStatus,
            recipients,
        };
    }
    catch (error) {
        console.error('retryPayoutBatch error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
//# sourceMappingURL=payouts.js.map