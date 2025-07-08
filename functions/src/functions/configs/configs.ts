import * as functions from 'firebase-functions';
import { UserService } from '../../services/userService';
import { ConfigService } from '../../services/configService';
import { AccessControlService } from '../../services/accessControlService';
import { formatErrorResponse, handleError } from '../../utils/errors';

// Get configuration
export const getConfig = functions.https.onCall(async (data: { key: string }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'read', 'configs');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const config = await ConfigService.getConfig(data.key);
    
    return {
      success: true,
      data: config
    };
  } catch (error) {
    console.error('getConfig error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// Set configuration (admin only)
export const setConfig = functions.https.onCall(async (data: { key: string; value: any }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'write', 'configs');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    await ConfigService.setConfig(data.key, data.value, context.auth.uid);
    
    return {
      success: true,
      message: 'Configuration updated'
    };
  } catch (error) {
    console.error('setConfig error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// List all configurations (admin only)
export const listConfigs = functions.https.onCall(async (data: { limit?: number }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'read', 'configs');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const configs = await ConfigService.listConfigs();
    
    return {
      success: true,
      data: configs
    };
  } catch (error) {
    console.error('listConfigs error:', error);
    return formatErrorResponse(handleError(error));
  }
}); 