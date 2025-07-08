import * as functions from 'firebase-functions';
import { UserService } from '../services/userService';
import { WalletService } from '../services/walletService';
import { AccessControlService } from '../services/accessControlService';
import { formatErrorResponse, handleError } from '../utils/errors';

// Create wallet
export const createWallet = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'create', 'wallets');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const wallet = await WalletService.createWallet({
      ...data,
      userId: context.auth.uid
    }, context.auth.uid);
    
    return {
      success: true,
      data: wallet
    };
  } catch (error) {
    console.error('createWallet error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// Get wallet by ID
export const getWallet = functions.https.onCall(async (data: { walletId: string }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'read', 'wallets');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const wallet = await WalletService.getWallet(data.walletId);
    
    return {
      success: true,
      data: wallet
    };
  } catch (error) {
    console.error('getWallet error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// Get wallet balance
export const getWalletBalance = functions.https.onCall(async (data: { walletId: string }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'read', 'wallets');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const balance = await WalletService.getBalance(data.walletId);
    
    return {
      success: true,
      data: { walletId: data.walletId, balance }
    };
  } catch (error) {
    console.error('getWalletBalance error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// Get wallets by user
export const getWalletsByUser = functions.https.onCall(async (data: { userId?: string }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'read', 'wallets');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const userId = data.userId || context.auth.uid;
    const wallets = await WalletService.getWalletsByUserId(userId);
    
    return {
      success: true,
      data: wallets
    };
  } catch (error) {
    console.error('getWalletsByUser error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// Update wallet status
export const updateWalletStatus = functions.https.onCall(async (data: { walletId: string; status: string }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'update', 'wallets');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const wallet = await WalletService.updateWalletStatus(data.walletId, data.status as any, context.auth.uid);
    
    return {
      success: true,
      data: wallet
    };
  } catch (error) {
    console.error('updateWalletStatus error:', error);
    return formatErrorResponse(handleError(error));
  }
}); 