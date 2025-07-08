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
exports.listConfigs = exports.setConfig = exports.getConfig = void 0;
const functions = __importStar(require("firebase-functions"));
const userService_1 = require("../../services/userService");
const configService_1 = require("../../services/configService");
const accessControlService_1 = require("../../services/accessControlService");
const errors_1 = require("../../utils/errors");
// Get configuration
exports.getConfig = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'read', 'configs');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const config = await configService_1.ConfigService.getConfig(data.key);
        return {
            success: true,
            data: config
        };
    }
    catch (error) {
        console.error('getConfig error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// Set configuration (admin only)
exports.setConfig = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'write', 'configs');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        await configService_1.ConfigService.setConfig(data.key, data.value, context.auth.uid);
        return {
            success: true,
            message: 'Configuration updated'
        };
    }
    catch (error) {
        console.error('setConfig error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// List all configurations (admin only)
exports.listConfigs = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'read', 'configs');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const configs = await configService_1.ConfigService.listConfigs();
        return {
            success: true,
            data: configs
        };
    }
    catch (error) {
        console.error('listConfigs error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
//# sourceMappingURL=configs.js.map