import { admin } from '../admin';
import { AuditLogService } from './auditLogService';

const db = admin.firestore();
const configCollection = db.collection('configurations');

export class ConfigService {
  static async getConfig(key: string): Promise<any> {
    const doc = await configCollection.doc(key).get();
    return doc.exists ? doc.data() : null;
  }

  static async setConfig(key: string, value: any, updatedBy: string): Promise<void> {
    await configCollection.doc(key).set({ value, updatedBy, updatedAt: new Date().toISOString() });
    await AuditLogService.log({
      actor: updatedBy,
      action: 'CONFIG_SET',
      resource: 'configurations',
      resourceId: key,
      after: { value },
    });
  }

  static async listConfigs(): Promise<any[]> {
    const snapshot = await configCollection.get();
    return snapshot.docs.map(doc => ({ key: doc.id, ...doc.data() }));
  }
} 