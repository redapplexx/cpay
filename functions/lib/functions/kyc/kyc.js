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
exports.listKYC = exports.getKYCRecords = exports.verifyKYCDocument = exports.uploadKYCDocument = void 0;
const functions = __importStar(require("firebase-functions"));
const userService_1 = require("../../services/userService");
const kycService_1 = require("../../services/kycService");
const accessControlService_1 = require("../../services/accessControlService");
const errors_1 = require("../../utils/errors");
// Upload KYC document
exports.uploadKYCDocument = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'create', 'kyc_records');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const { userId, fileBuffer, fileName, docType } = data;
        // Convert base64 to buffer if needed
        const buffer = typeof fileBuffer === 'string'
            ? Buffer.from(fileBuffer, 'base64')
            : Buffer.from(fileBuffer);
        const document = await kycService_1.KYCService.uploadDocument(userId, buffer, fileName, docType, context.auth.uid);
        return {
            success: true,
            data: document
        };
    }
    catch (error) {
        console.error('uploadKYCDocument error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// Verify KYC document
exports.verifyKYCDocument = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'update', 'kyc_records');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        await kycService_1.KYCService.verifyDocument(data.documentId, data.status, context.auth.uid, data.rejectionReason);
        return {
            success: true,
            message: 'Document verification status updated'
        };
    }
    catch (error) {
        console.error('verifyKYCDocument error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// Get KYC records by user
exports.getKYCRecords = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'read', 'kyc_records');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const records = await kycService_1.KYCService.getRecordsByUser(data.userId);
        return {
            success: true,
            data: records
        };
    }
    catch (error) {
        console.error('getKYCRecords error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// List all KYC records (admin/compliance only)
exports.listKYC = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'read', 'kyc_records');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const records = await kycService_1.KYCService.list(data.limit || 100);
        return {
            success: true,
            data: records
        };
    }
    catch (error) {
        console.error('listKYC error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
//# sourceMappingURL=kyc.js.map