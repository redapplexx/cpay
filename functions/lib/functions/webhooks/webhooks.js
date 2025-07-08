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
exports.listWebhooks = exports.getWebhookEvent = exports.retryWebhookEvent = exports.receiveWebhookEvent = void 0;
const functions = __importStar(require("firebase-functions"));
const userService_1 = require("../../services/userService");
const webhookService_1 = require("../../services/webhookService");
const accessControlService_1 = require("../../services/accessControlService");
const errors_1 = require("../../utils/errors");
// Receive webhook event
exports.receiveWebhookEvent = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'create', 'webhooks');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        await webhookService_1.WebhookService.receiveEvent(data.event, context.auth.uid);
        return {
            success: true,
            message: 'Webhook event received'
        };
    }
    catch (error) {
        console.error('receiveWebhookEvent error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// Retry webhook event
exports.retryWebhookEvent = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'update', 'webhooks');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        await webhookService_1.WebhookService.retryEvent(data.eventId, context.auth.uid);
        return {
            success: true,
            message: 'Webhook event retry initiated'
        };
    }
    catch (error) {
        console.error('retryWebhookEvent error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// Get webhook event
exports.getWebhookEvent = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'read', 'webhooks');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const event = await webhookService_1.WebhookService.getEvent(data.eventId);
        return {
            success: true,
            data: event
        };
    }
    catch (error) {
        console.error('getWebhookEvent error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// List webhook events (admin only)
exports.listWebhooks = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'read', 'webhooks');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const events = await webhookService_1.WebhookService.list(data.limit || 100);
        return {
            success: true,
            data: events
        };
    }
    catch (error) {
        console.error('listWebhooks error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
//# sourceMappingURL=webhooks.js.map