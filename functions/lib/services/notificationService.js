"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const admin_1 = require("../admin");
const utils_1 = require("../utils");
const auditLogService_1 = require("./auditLogService");
const db = admin_1.admin.firestore();
const notificationsCollection = db.collection('notifications');
class NotificationService {
    static async sendNotification({ userId, type, message }, sentBy) {
        const id = (0, utils_1.generateId)();
        const now = new Date();
        const notification = {
            id,
            userId,
            type,
            message,
            status: 'pending',
            sentAt: (0, utils_1.formatDate)(now),
        };
        await notificationsCollection.doc(id).set(notification);
        await auditLogService_1.AuditLogService.log({
            actor: sentBy,
            action: 'NOTIFICATION_SENT',
            resource: 'notifications',
            resourceId: id,
            after: notification,
        });
        // TODO: Integrate with push/SMS/email providers
    }
    static async getNotificationsByUser(userId, limit = 50) {
        const snapshot = await notificationsCollection.where('userId', '==', userId).orderBy('sentAt', 'desc').limit(limit).get();
        return snapshot.docs.map(doc => doc.data());
    }
    static async list(limit = 100) {
        const snapshot = await notificationsCollection.orderBy('sentAt', 'desc').limit(limit).get();
        return snapshot.docs.map(doc => doc.data());
    }
    static async markAsRead(notificationId, markedBy) {
        await notificationsCollection.doc(notificationId).update({
            status: 'read',
            readAt: (0, utils_1.formatDate)(new Date()),
        });
        await auditLogService_1.AuditLogService.log({
            actor: markedBy,
            action: 'NOTIFICATION_READ',
            resource: 'notifications',
            resourceId: notificationId,
        });
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notificationService.js.map