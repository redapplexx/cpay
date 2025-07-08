import * as functions from 'firebase-functions';
import { UserService } from '../../services/userService';
import { AccessControlService } from '../../services/accessControlService';
import { formatErrorResponse, handleError } from '../../utils/errors';

// Get permissions by role
export const getPermissionsByRole = functions.https.onCall(async (data: { role: string }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'read', 'access_control');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const permissions = await AccessControlService.getPermissionsByRole(data.role);
    
    return {
      success: true,
      data: permissions
    };
  } catch (error) {
    console.error('getPermissionsByRole error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// Set permission (admin only)
export const setPermission = functions.https.onCall(async (data: {
  role: string;
  action: string;
  resource: string;
  allowed: boolean;
}, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'write', 'access_control');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    await AccessControlService.setPermission(data, context.auth.uid);
    
    return {
      success: true,
      message: 'Permission updated'
    };
  } catch (error) {
    console.error('setPermission error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// Check permission
export const checkPermission = functions.https.onCall(async (data: {
  role: string;
  action: string;
  resource: string;
}, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'read', 'access_control');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const allowed = await AccessControlService.checkPermission(data.role, data.action, data.resource);
    
    return {
      success: true,
      data: {
        role: data.role,
        action: data.action,
        resource: data.resource,
        allowed: allowed
      }
    };
  } catch (error) {
    console.error('checkPermission error:', error);
    return formatErrorResponse(handleError(error));
  }
}); 