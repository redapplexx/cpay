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
exports.listAML = exports.getAMLFlagsByUser = exports.reviewAMLFlag = exports.flagTransaction = void 0;
const functions = __importStar(require("firebase-functions"));
const userService_1 = require("../../services/userService");
const amlService_1 = require("../../services/amlService");
const accessControlService_1 = require("../../services/accessControlService");
const errors_1 = require("../../utils/errors");
// Flag a transaction for AML review
exports.flagTransaction = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'create', 'aml_flags');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        await amlService_1.AMLService.flagTransaction(data, context.auth.uid);
        return {
            success: true,
            message: 'Transaction flagged for AML review'
        };
    }
    catch (error) {
        console.error('flagTransaction error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// Review an AML flag
exports.reviewAMLFlag = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'update', 'aml_flags');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        await amlService_1.AMLService.reviewFlag(data.flagId, context.auth.uid);
        return {
            success: true,
            message: 'AML flag reviewed'
        };
    }
    catch (error) {
        console.error('reviewAMLFlag error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// Get AML flags by user
exports.getAMLFlagsByUser = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'read', 'aml_flags');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const flags = await amlService_1.AMLService.getFlagsByUser(data.userId);
        return {
            success: true,
            data: flags
        };
    }
    catch (error) {
        console.error('getAMLFlagsByUser error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// List all AML flags (admin/compliance only)
exports.listAML = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'read', 'aml_flags');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const flags = await amlService_1.AMLService.list(data.limit || 100);
        return {
            success: true,
            data: flags
        };
    }
    catch (error) {
        console.error('listAML error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
//# sourceMappingURL=aml.js.map