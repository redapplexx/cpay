import { admin } from '../admin';
import { generateId, formatDate } from '../utils';
import { AuditLogService } from './auditLogService';

const db = admin.firestore();
const amlFlagsCollection = db.collection('aml_flags');

export class AMLService {
  static async flagTransaction({ transactionId, userId, riskScore, reason, severity }: {
    transactionId: string;
    userId: string;
    riskScore: number;
    reason: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }, flaggedBy: string): Promise<void> {
    const id = generateId();
    const now = new Date();
    const flag = {
      id,
      transactionId,
      userId,
      riskScore,
      reason,
      severity,
      reviewed: false,
      createdAt: formatDate(now),
      updatedAt: formatDate(now),
    };
    await amlFlagsCollection.doc(id).set(flag);
    await AuditLogService.log({
      actor: flaggedBy,
      action: 'AML_FLAG_CREATED',
      resource: 'aml_flags',
      resourceId: id,
      after: flag,
    });
  }

  static async reviewFlag(id: string, reviewedBy: string): Promise<void> {
    await amlFlagsCollection.doc(id).update({ reviewed: true, updatedAt: formatDate(new Date()) });
    await AuditLogService.log({
      actor: reviewedBy,
      action: 'AML_FLAG_REVIEWED',
      resource: 'aml_flags',
      resourceId: id,
      after: { reviewed: true },
    });
  }

  static async getFlagsByUser(userId: string): Promise<any[]> {
    const snapshot = await amlFlagsCollection.where('userId', '==', userId).get();
    return snapshot.docs.map(doc => doc.data());
  }

  static async list(limit = 100): Promise<any[]> {
    const snapshot = await amlFlagsCollection.orderBy('createdAt', 'desc').limit(limit).get();
    return snapshot.docs.map(doc => doc.data());
  }
} 