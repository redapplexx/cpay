import * as functions from 'firebase-functions';
import { UserService } from '../../services/userService';
import { AuditLogService } from '../../services/auditLogService';
import { AccessControlService } from '../../services/accessControlService';
import { formatErrorResponse, handleError } from '../../utils/errors';

// Get audit logs by user
export const getAuditLogs = functions.https.onCall(async (data: { userId: string; limit?: number }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'read', 'audit_logs');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const logs = await AuditLogService.getLogsByUser(data.userId, data.limit || 100);
    
    return {
      success: true,
      data: logs
    };
  } catch (error) {
    console.error('getAuditLogs error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// List all audit logs (admin only)
export const listAuditLogs = functions.https.onCall(async (data: { limit?: number }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'read', 'audit_logs');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const logs = await AuditLogService.list(data.limit || 100);
    
    return {
      success: true,
      data: logs
    };
  } catch (error) {
    console.error('listAuditLogs error:', error);
    return formatErrorResponse(handleError(error));
  }
}); 