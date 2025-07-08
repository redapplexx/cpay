import * as functions from 'firebase-functions';
import { UserService } from '../../services/userService';
import { PayoutService } from '../../services/payoutService';
import { WalletService } from '../../services/walletService';
import { AccessControlService } from '../../services/accessControlService';
import { formatErrorResponse, handleError } from '../../utils/errors';
import { MassPayoutStatus, MassPayoutRecipientStatus } from '../../types';

// Process a mass payout batch
export const processPayoutBatch = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) throw new Error('Authentication required');
    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'update', 'payouts');
    if (!hasPermission) throw new Error('Insufficient permissions');

    const { batchId, tenantId } = data;
    const batch = await PayoutService.getBatchStatus(batchId, tenantId);
    if (!batch) throw new Error('Payout batch not found');
    if (batch.status === MassPayoutStatus.COMPLETED) {
      return { success: true, message: 'Batch already completed' };
    }

    // Mark batch as processing
    await PayoutService.processBatch(batchId, context.auth.uid, tenantId);

    // Recipients are stored as a field in the batch document
    const recipients = (batch as any).recipients || [];
    let processedCount = 0, failedCount = 0;

    for (const recipient of recipients) {
      try {
        if (recipient.status === MassPayoutRecipientStatus.COMPLETED) {
          processedCount++;
          continue;
        }
        // Credit recipient wallet
        await WalletService.creditWallet(
          recipient.walletId,
          recipient.amount,
          batchId,
          'Mass payout',
          batchId,
          context.auth.uid
        );
        recipient.status = MassPayoutRecipientStatus.COMPLETED;
        processedCount++;
      } catch (err) {
        recipient.status = MassPayoutRecipientStatus.FAILED;
        recipient.errorMessage = (err as Error).message;
        failedCount++;
      }
    }

    // Update batch status
    const newStatus =
      failedCount === 0
        ? MassPayoutStatus.COMPLETED
        : processedCount > 0
        ? MassPayoutStatus.PROCESSING
        : MassPayoutStatus.FAILED;

    await PayoutService.updateBatchStatus(batchId, tenantId, {
      recipients,
      processedCount,
      failedCount,
      status: newStatus,
      updatedAt: new Date(),
      completedAt: newStatus === MassPayoutStatus.COMPLETED ? new Date() : undefined,
    });

    return {
      success: true,
      batchId,
      processedCount,
      failedCount,
      status: newStatus,
      recipients,
    };
  } catch (error) {
    console.error('processPayoutBatch error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// Retry failed payouts in a batch
export const retryPayoutBatch = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) throw new Error('Authentication required');
    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'update', 'payouts');
    if (!hasPermission) throw new Error('Insufficient permissions');

    const { batchId, tenantId } = data;
    const batch = await PayoutService.getBatchStatus(batchId, tenantId);
    if (!batch) throw new Error('Payout batch not found');

    const recipients = (batch as any).recipients || [];
    let retried = 0, failedCount = 0;

    for (const recipient of recipients) {
      if (recipient.status === MassPayoutRecipientStatus.FAILED) {
        try {
          await WalletService.creditWallet(
            recipient.walletId,
            recipient.amount,
            batchId,
            'Mass payout retry',
            batchId,
            context.auth.uid
          );
          recipient.status = MassPayoutRecipientStatus.COMPLETED;
          retried++;
        } catch (err) {
          recipient.errorMessage = (err as Error).message;
          failedCount++;
        }
      }
    }

    const allCompleted = recipients.every((r: any) => r.status === MassPayoutRecipientStatus.COMPLETED);
    const newStatus = allCompleted ? MassPayoutStatus.COMPLETED : MassPayoutStatus.PROCESSING;

    await PayoutService.updateBatchStatus(batchId, tenantId, {
      recipients,
      processedCount: recipients.filter((r: any) => r.status === MassPayoutRecipientStatus.COMPLETED).length,
      failedCount: recipients.filter((r: any) => r.status === MassPayoutRecipientStatus.FAILED).length,
      status: newStatus,
      updatedAt: new Date(),
      completedAt: allCompleted ? new Date() : undefined,
    });

    return {
      success: true,
      batchId,
      retried,
      failedCount,
      status: newStatus,
      recipients,
    };
  } catch (error) {
    console.error('retryPayoutBatch error:', error);
    return formatErrorResponse(handleError(error));
  }
}); 