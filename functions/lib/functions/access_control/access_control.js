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
exports.checkPermission = exports.setPermission = exports.getPermissionsByRole = void 0;
const functions = __importStar(require("firebase-functions"));
const userService_1 = require("../../services/userService");
const accessControlService_1 = require("../../services/accessControlService");
const errors_1 = require("../../utils/errors");
// Get permissions by role
exports.getPermissionsByRole = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'read', 'access_control');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const permissions = await accessControlService_1.AccessControlService.getPermissionsByRole(data.role);
        return {
            success: true,
            data: permissions
        };
    }
    catch (error) {
        console.error('getPermissionsByRole error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// Set permission (admin only)
exports.setPermission = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'write', 'access_control');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        await accessControlService_1.AccessControlService.setPermission(data, context.auth.uid);
        return {
            success: true,
            message: 'Permission updated'
        };
    }
    catch (error) {
        console.error('setPermission error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// Check permission
exports.checkPermission = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'read', 'access_control');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const allowed = await accessControlService_1.AccessControlService.checkPermission(data.role, data.action, data.resource);
        return {
            success: true,
            data: {
                role: data.role,
                action: data.action,
                resource: data.resource,
                allowed: allowed
            }
        };
    }
    catch (error) {
        console.error('checkPermission error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
//# sourceMappingURL=access_control.js.map