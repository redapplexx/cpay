import * as functions from 'firebase-functions';
import { UserService } from '../../services/userService';
import { AMLService } from '../../services/amlService';
import { AccessControlService } from '../../services/accessControlService';
import { formatErrorResponse, handleError } from '../../utils/errors';

// Flag a transaction for AML review
export const flagTransaction = functions.https.onCall(async (data: {
  transactionId: string;
  userId: string;
  riskScore: number;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'create', 'aml_flags');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    await AMLService.flagTransaction(data, context.auth.uid);
    
    return {
      success: true,
      message: 'Transaction flagged for AML review'
    };
  } catch (error) {
    console.error('flagTransaction error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// Review an AML flag
export const reviewAMLFlag = functions.https.onCall(async (data: { flagId: string }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'update', 'aml_flags');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    await AMLService.reviewFlag(data.flagId, context.auth.uid);
    
    return {
      success: true,
      message: 'AML flag reviewed'
    };
  } catch (error) {
    console.error('reviewAMLFlag error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// Get AML flags by user
export const getAMLFlagsByUser = functions.https.onCall(async (data: { userId: string }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'read', 'aml_flags');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const flags = await AMLService.getFlagsByUser(data.userId);
    
    return {
      success: true,
      data: flags
    };
  } catch (error) {
    console.error('getAMLFlagsByUser error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// List all AML flags (admin/compliance only)
export const listAML = functions.https.onCall(async (data: { limit?: number }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'read', 'aml_flags');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const flags = await AMLService.list(data.limit || 100);
    
    return {
      success: true,
      data: flags
    };
  } catch (error) {
    console.error('listAML error:', error);
    return formatErrorResponse(handleError(error));
  }
}); 