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
exports.updateWalletStatus = exports.getWalletsByUser = exports.getWalletBalance = exports.getWallet = exports.createWallet = void 0;
const functions = __importStar(require("firebase-functions"));
const userService_1 = require("../services/userService");
const walletService_1 = require("../services/walletService");
const accessControlService_1 = require("../services/accessControlService");
const errors_1 = require("../utils/errors");
// Create wallet
exports.createWallet = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'create', 'wallets');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const wallet = await walletService_1.WalletService.createWallet(Object.assign(Object.assign({}, data), { userId: context.auth.uid }), context.auth.uid);
        return {
            success: true,
            data: wallet
        };
    }
    catch (error) {
        console.error('createWallet error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// Get wallet by ID
exports.getWallet = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'read', 'wallets');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const wallet = await walletService_1.WalletService.getWallet(data.walletId);
        return {
            success: true,
            data: wallet
        };
    }
    catch (error) {
        console.error('getWallet error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// Get wallet balance
exports.getWalletBalance = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'read', 'wallets');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const balance = await walletService_1.WalletService.getBalance(data.walletId);
        return {
            success: true,
            data: { walletId: data.walletId, balance }
        };
    }
    catch (error) {
        console.error('getWalletBalance error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// Get wallets by user
exports.getWalletsByUser = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'read', 'wallets');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const userId = data.userId || context.auth.uid;
        const wallets = await walletService_1.WalletService.getWalletsByUserId(userId);
        return {
            success: true,
            data: wallets
        };
    }
    catch (error) {
        console.error('getWalletsByUser error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// Update wallet status
exports.updateWalletStatus = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'update', 'wallets');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const wallet = await walletService_1.WalletService.updateWalletStatus(data.walletId, data.status, context.auth.uid);
        return {
            success: true,
            data: wallet
        };
    }
    catch (error) {
        console.error('updateWalletStatus error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
//# sourceMappingURL=wallets.js.map