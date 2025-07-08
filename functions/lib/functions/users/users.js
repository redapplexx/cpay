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
exports.updateKYCStatus = exports.updateUserRole = exports.listUsers = exports.updateUser = exports.getUser = exports.createUser = void 0;
const functions = __importStar(require("firebase-functions"));
const userService_1 = require("../../services/userService");
const accessControlService_1 = require("../../services/accessControlService");
const errors_1 = require("../../utils/errors");
// Create user
exports.createUser = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'create', 'users');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const newUser = await userService_1.UserService.createUser(data, context.auth.uid);
        return {
            success: true,
            data: newUser
        };
    }
    catch (error) {
        console.error('createUser error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// Get user by ID
exports.getUser = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'read', 'users');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const targetUser = await userService_1.UserService.getUserById(data.userId);
        return {
            success: true,
            data: targetUser
        };
    }
    catch (error) {
        console.error('getUser error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// Update user
exports.updateUser = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'update', 'users');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const updatedUser = await userService_1.UserService.updateUser(data.userId, data.updates, context.auth.uid);
        return {
            success: true,
            data: updatedUser
        };
    }
    catch (error) {
        console.error('updateUser error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// List users
exports.listUsers = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'read', 'users');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const result = await userService_1.UserService.listUsers(data.filters || {});
        return {
            success: true,
            data: result
        };
    }
    catch (error) {
        console.error('listUsers error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// Update user role (admin only)
exports.updateUserRole = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'update', 'users');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const updatedUser = await userService_1.UserService.updateUserRole(data.userId, data.role, context.auth.uid);
        return {
            success: true,
            data: updatedUser
        };
    }
    catch (error) {
        console.error('updateUserRole error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// Update KYC status
exports.updateKYCStatus = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'update', 'users');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const updatedUser = await userService_1.UserService.updateKYCStatus(data.userId, data.kycStatus, context.auth.uid);
        return {
            success: true,
            data: updatedUser
        };
    }
    catch (error) {
        console.error('updateKYCStatus error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
//# sourceMappingURL=users.js.map