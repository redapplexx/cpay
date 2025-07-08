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
exports.convertCurrency = exports.updateTransactionStatus = exports.listTransactions = exports.getTransaction = exports.sendPayment = void 0;
const functions = __importStar(require("firebase-functions"));
const userService_1 = require("../services/userService");
const transactionService_1 = require("../services/transactionService");
const walletService_1 = require("../services/walletService");
const accessControlService_1 = require("../services/accessControlService");
const amlService_1 = require("../services/amlService");
const errors_1 = require("../utils/errors");
const types_1 = require("../types");
// Send payment
exports.sendPayment = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'create', 'transactions');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        // Create transaction
        const transaction = await transactionService_1.TransactionService.createTransaction(Object.assign(Object.assign({}, data), { type: types_1.TransactionType.TRANSFER, fromUserId: context.auth.uid }), context.auth.uid);
        // Process the payment (debit from wallet, credit to wallet)
        if (data.fromWalletId && data.toWalletId) {
            // Debit from sender wallet
            await walletService_1.WalletService.debitWallet(data.fromWalletId, data.amount, transaction.id, `Payment to ${data.toUserId}`, transaction.reference || transaction.id, context.auth.uid);
            // Credit to receiver wallet
            await walletService_1.WalletService.creditWallet(data.toWalletId, data.amount, transaction.id, `Payment from ${data.fromUserId}`, transaction.reference || transaction.id, context.auth.uid);
            // Update transaction status to completed
            await transactionService_1.TransactionService.updateTransactionStatus(transaction.id, types_1.TransactionStatus.COMPLETED, context.auth.uid);
        }
        // Check for AML flags
        if (data.amount > 10000) { // Example threshold
            await amlService_1.AMLService.flagTransaction({
                transactionId: transaction.id,
                userId: context.auth.uid,
                riskScore: 75,
                reason: 'Large transaction amount',
                severity: 'medium'
            }, 'system');
        }
        return {
            success: true,
            data: transaction
        };
    }
    catch (error) {
        console.error('sendPayment error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// Get transaction by ID
exports.getTransaction = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'read', 'transactions');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const transaction = await transactionService_1.TransactionService.getTransaction(data.transactionId);
        return {
            success: true,
            data: transaction
        };
    }
    catch (error) {
        console.error('getTransaction error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// List transactions
exports.listTransactions = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'read', 'transactions');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const transactions = await transactionService_1.TransactionService.listTransactions(data.filters, data.limit);
        return {
            success: true,
            data: transactions
        };
    }
    catch (error) {
        console.error('listTransactions error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// Update transaction status (admin only)
exports.updateTransactionStatus = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'update', 'transactions');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        await transactionService_1.TransactionService.updateTransactionStatus(data.transactionId, data.status, context.auth.uid);
        return {
            success: true,
            message: 'Transaction status updated successfully'
        };
    }
    catch (error) {
        console.error('updateTransactionStatus error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// FX conversion
exports.convertCurrency = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'create', 'transactions');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        // Create FX transaction
        const transaction = await transactionService_1.TransactionService.createTransaction(Object.assign(Object.assign({}, data), { type: types_1.TransactionType.FX_CONVERSION, fromUserId: context.auth.uid }), context.auth.uid);
        // Process FX conversion
        if (data.fromWalletId && data.toWalletId) {
            // Debit from source wallet
            await walletService_1.WalletService.debitWallet(data.fromWalletId, data.amount, transaction.id, `FX conversion to ${data.toCurrency}`, transaction.reference || transaction.id, context.auth.uid);
            // Credit to destination wallet with converted amount
            const convertedAmount = data.amount * (data.fxRate || 1);
            await walletService_1.WalletService.creditWallet(data.toWalletId, convertedAmount, transaction.id, `FX conversion from ${data.fromCurrency}`, transaction.reference || transaction.id, context.auth.uid);
            // Update transaction status to completed
            await transactionService_1.TransactionService.updateTransactionStatus(transaction.id, types_1.TransactionStatus.COMPLETED, context.auth.uid);
        }
        return {
            success: true,
            data: transaction
        };
    }
    catch (error) {
        console.error('convertCurrency error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
//# sourceMappingURL=transactions.js.map