import { admin } from '../admin';
import { generateId, formatDate } from '../utils';

const db = admin.firestore();
const auditLogsCollection = db.collection('audit_logs');

export class AuditLogService {
  static async log({ actor, action, resource, resourceId, before, after }: {
    actor: string;
    action: string;
    resource: string;
    resourceId: string;
    before?: any;
    after?: any;
  }): Promise<void> {
    const now = new Date();
    await auditLogsCollection.add({
      id: generateId(),
      actor,
      action,
      resource,
      resourceId,
      before,
      after,
      timestamp: formatDate(now),
    });
  }

  static async getLogsByUser(userId: string, limit: number = 100): Promise<any[]> {
    const snapshot = await auditLogsCollection
      .where('actor', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  static async list(limit: number = 100): Promise<any[]> {
    const snapshot = await auditLogsCollection
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
} 