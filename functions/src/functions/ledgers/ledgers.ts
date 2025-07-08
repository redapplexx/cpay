import * as functions from 'firebase-functions';
import { UserService } from '../../services/userService';
import { LedgerService } from '../../services/ledgerService';
import { AccessControlService } from '../../services/accessControlService';
import { formatErrorResponse, handleError } from '../../utils/errors';

// Get ledger entries by wallet
export const getLedgerEntries = functions.https.onCall(async (data: { walletId: string; limit?: number }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'read', 'ledgers');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const entries = await LedgerService.getEntriesByWallet(data.walletId, data.limit || 100);
    
    return {
      success: true,
      data: entries
    };
  } catch (error) {
    console.error('getLedgerEntries error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// List all ledger entries (admin only)
export const listLedgers = functions.https.onCall(async (data: { limit?: number }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'read', 'ledgers');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const entries = await LedgerService.list(data.limit || 100);
    
    return {
      success: true,
      data: entries
    };
  } catch (error) {
    console.error('listLedgers error:', error);
    return formatErrorResponse(handleError(error));
  }
}); 