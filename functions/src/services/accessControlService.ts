import { admin } from '../admin';
import { AuditLogService } from './auditLogService';

const db = admin.firestore();
const accessControlCollection = db.collection('access_control');

export class AccessControlService {
  static async getPermissionsByRole(role: string): Promise<any[]> {
    const snapshot = await accessControlCollection.where('role', '==', role).get();
    return snapshot.docs.map(doc => doc.data());
  }

  static async setPermission(permission: { role: string; action: string; resource: string; allowed: boolean }, updatedBy: string): Promise<void> {
    const id = `${permission.role}_${permission.action}_${permission.resource}`;
    await accessControlCollection.doc(id).set(permission);
    await AuditLogService.log({
      actor: updatedBy,
      action: 'ACCESS_CONTROL_PERMISSION_SET',
      resource: 'access_control',
      resourceId: id,
      after: permission,
    });
  }

  static async checkPermission(role: string, action: string, resource: string): Promise<boolean> {
    const id = `${role}_${action}_${resource}`;
    const doc = await accessControlCollection.doc(id).get();
    if (doc.exists) return doc.data()?.allowed;
    // fallback to default permission table
    const { checkAccess } = await import('../utils/accessControl');
    return checkAccess(role as any, action, resource);
  }
} 