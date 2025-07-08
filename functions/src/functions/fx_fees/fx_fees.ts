import * as functions from 'firebase-functions';
import { UserService } from '../../services/userService';
import { FXFeeService } from '../../services/fxFeeService';
import { AccessControlService } from '../../services/accessControlService';
import { formatErrorResponse, handleError } from '../../utils/errors';

// Get FX fee configuration
export const getFXFeeConfig = functions.https.onCall(async (data: { currency: string }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'read', 'fx_fees');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const config = await FXFeeService.getFeeConfig(data.currency);
    
    return {
      success: true,
      data: config
    };
  } catch (error) {
    console.error('getFXFeeConfig error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// Set FX fee configuration (admin only)
export const setFXFeeConfig = functions.https.onCall(async (data: { 
  currency: string; 
  config: { type: 'flat' | 'percent'; value: number } 
}, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'write', 'fx_fees');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    await FXFeeService.setFeeConfig(data.currency, data.config, context.auth.uid);
    
    return {
      success: true,
      message: 'FX fee configuration updated'
    };
  } catch (error) {
    console.error('setFXFeeConfig error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// Calculate FX fee
export const calculateFXFee = functions.https.onCall(async (data: { amount: number; currency: string }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'read', 'fx_fees');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const fee = await FXFeeService.calculateFXFee(data.amount, data.currency);
    
    return {
      success: true,
      data: {
        amount: data.amount,
        currency: data.currency,
        fee: fee
      }
    };
  } catch (error) {
    console.error('calculateFXFee error:', error);
    return formatErrorResponse(handleError(error));
  }
}); 