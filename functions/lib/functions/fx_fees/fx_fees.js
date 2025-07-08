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
exports.calculateFXFee = exports.setFXFeeConfig = exports.getFXFeeConfig = void 0;
const functions = __importStar(require("firebase-functions"));
const userService_1 = require("../../services/userService");
const fxFeeService_1 = require("../../services/fxFeeService");
const accessControlService_1 = require("../../services/accessControlService");
const errors_1 = require("../../utils/errors");
// Get FX fee configuration
exports.getFXFeeConfig = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'read', 'fx_fees');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const config = await fxFeeService_1.FXFeeService.getFeeConfig(data.currency);
        return {
            success: true,
            data: config
        };
    }
    catch (error) {
        console.error('getFXFeeConfig error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// Set FX fee configuration (admin only)
exports.setFXFeeConfig = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'write', 'fx_fees');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        await fxFeeService_1.FXFeeService.setFeeConfig(data.currency, data.config, context.auth.uid);
        return {
            success: true,
            message: 'FX fee configuration updated'
        };
    }
    catch (error) {
        console.error('setFXFeeConfig error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// Calculate FX fee
exports.calculateFXFee = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'read', 'fx_fees');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const fee = await fxFeeService_1.FXFeeService.calculateFXFee(data.amount, data.currency);
        return {
            success: true,
            data: {
                amount: data.amount,
                currency: data.currency,
                fee: fee
            }
        };
    }
    catch (error) {
        console.error('calculateFXFee error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
//# sourceMappingURL=fx_fees.js.map