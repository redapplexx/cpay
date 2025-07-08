import { admin } from '../admin';
import { generateId, formatDate } from '../utils';
import { AuditLogService } from './auditLogService';

const db = admin.firestore();
const webhooksCollection = db.collection('webhooks');

export class WebhookService {
  static async receiveEvent(event: any, receivedBy: string): Promise<void> {
    const id = generateId();
    const now = new Date();
    const webhook = {
      id,
      ...event,
      status: 'pending',
      attempts: 0,
      createdAt: formatDate(now),
      updatedAt: formatDate(now),
    };
    await webhooksCollection.doc(id).set(webhook);
    await AuditLogService.log({
      actor: receivedBy,
      action: 'WEBHOOK_RECEIVED',
      resource: 'webhooks',
      resourceId: id,
      after: webhook,
    });
  }

  static async retryEvent(id: string, retriedBy: string): Promise<void> {
    await webhooksCollection.doc(id).update({ attempts: admin.firestore.FieldValue.increment(1), updatedAt: formatDate(new Date()) });
    await AuditLogService.log({
      actor: retriedBy,
      action: 'WEBHOOK_RETRY',
      resource: 'webhooks',
      resourceId: id,
      after: { retry: true },
    });
  }

  static async getEvent(id: string): Promise<any | null> {
    const doc = await webhooksCollection.doc(id).get();
    return doc.exists ? doc.data() : null;
  }

  static async list(limit = 100): Promise<any[]> {
    const snapshot = await webhooksCollection.orderBy('createdAt', 'desc').limit(limit).get();
    return snapshot.docs.map(doc => doc.data());
  }
} 