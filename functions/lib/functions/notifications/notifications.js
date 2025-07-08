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
exports.listNotifications = exports.markNotificationAsRead = exports.getNotifications = exports.sendNotification = void 0;
const functions = __importStar(require("firebase-functions"));
const userService_1 = require("../../services/userService");
const notificationService_1 = require("../../services/notificationService");
const accessControlService_1 = require("../../services/accessControlService");
const errors_1 = require("../../utils/errors");
// Send notification
exports.sendNotification = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'create', 'notifications');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        await notificationService_1.NotificationService.sendNotification(data, context.auth.uid);
        return {
            success: true,
            message: 'Notification sent'
        };
    }
    catch (error) {
        console.error('sendNotification error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// Get notifications by user
exports.getNotifications = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'read', 'notifications');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const notifications = await notificationService_1.NotificationService.getNotificationsByUser(data.userId, data.limit || 50);
        return {
            success: true,
            data: notifications
        };
    }
    catch (error) {
        console.error('getNotifications error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// Mark notification as read
exports.markNotificationAsRead = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'update', 'notifications');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        await notificationService_1.NotificationService.markAsRead(data.notificationId, context.auth.uid);
        return {
            success: true,
            message: 'Notification marked as read'
        };
    }
    catch (error) {
        console.error('markNotificationAsRead error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
// List all notifications (admin only)
exports.listNotifications = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Authentication required');
        }
        const user = await userService_1.UserService.getUserById(context.auth.uid);
        const hasPermission = await accessControlService_1.AccessControlService.checkPermission(user.role, 'read', 'notifications');
        if (!hasPermission) {
            throw new Error('Insufficient permissions');
        }
        const notifications = await notificationService_1.NotificationService.list(data.limit || 100);
        return {
            success: true,
            data: notifications
        };
    }
    catch (error) {
        console.error('listNotifications error:', error);
        return (0, errors_1.formatErrorResponse)((0, errors_1.handleError)(error));
    }
});
//# sourceMappingURL=notifications.js.map