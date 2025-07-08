import { admin } from '../admin';
import { generateId, formatDate } from '../utils';
import { AuditLogService } from './auditLogService';

const db = admin.firestore();
const notificationsCollection = db.collection('notifications');

export class NotificationService {
  static async sendNotification({ userId, type, message }: { userId: string; type: string; message: string }, sentBy: string): Promise<void> {
    const id = generateId();
    const now = new Date();
    const notification = {
      id,
      userId,
      type,
      message,
      status: 'pending',
      sentAt: formatDate(now),
    };
    await notificationsCollection.doc(id).set(notification);
    await AuditLogService.log({
      actor: sentBy,
      action: 'NOTIFICATION_SENT',
      resource: 'notifications',
      resourceId: id,
      after: notification,
    });
    // TODO: Integrate with push/SMS/email providers
  }

  static async getNotificationsByUser(userId: string, limit = 50): Promise<any[]> {
    const snapshot = await notificationsCollection.where('userId', '==', userId).orderBy('sentAt', 'desc').limit(limit).get();
    return snapshot.docs.map(doc => doc.data());
  }

  static async list(limit = 100): Promise<any[]> {
    const snapshot = await notificationsCollection.orderBy('sentAt', 'desc').limit(limit).get();
    return snapshot.docs.map(doc => doc.data());
  }

  static async markAsRead(notificationId: string, markedBy: string): Promise<void> {
    await notificationsCollection.doc(notificationId).update({
      status: 'read',
      readAt: formatDate(new Date()),
    });
    await AuditLogService.log({
      actor: markedBy,
      action: 'NOTIFICATION_READ',
      resource: 'notifications',
      resourceId: notificationId,
    });
  }
} 