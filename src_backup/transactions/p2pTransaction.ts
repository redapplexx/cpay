import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

const db = admin.firestore();

interface P2PTransactionRequest {
  senderUid: string;
  recipientUid: string;
  amount: number;
  sourceCurrency: string;
  destinationCurrency: string;
  message?: string;
  tenantId: string;
}

export const processP2PTransaction = functions.firestore
  .document('tenants/{tenantId}/p2p_transactions/{transactionId}')
  .onCreate(async (snap, context) => {
    try {
      const { tenantId, transactionId } = context.params;
      const transactionData = snap.data() as P2PTransactionRequest;
      const { senderUid, recipientUid, amount, sourceCurrency, destinationCurrency, message } = transactionData;

      console.log(`Processing P2P transaction ${transactionId} from ${senderUid} to ${recipientUid}`);

      // Get current FX rate
      const today = new Date().toISOString().split('T')[0];
      const fxRateDoc = await db.collection('fx_rates').doc(today).get();
      
      if (!fxRateDoc.exists) {
        throw new Error('FX rates not available for today');
      }

      const fxRates = fxRateDoc.data()?.rates;
      const fxRate = fxRates[destinationCurrency] / fxRates[sourceCurrency];
      const fxMarkupPercent = 2.5; // 2.5% markup
      const fees = amount * (fxMarkupPercent / 100);
      const netAmount = amount - fees;

      // Get sender and recipient user data
      const [senderDoc, recipientDoc] = await Promise.all([
        db.collection('tenants').doc(tenantId).collection('users').doc(senderUid).get(),
        db.collection('tenants').doc(tenantId).collection('users').doc(recipientUid).get()
      ]);

      if (!senderDoc.exists || !recipientDoc.exists) {
        throw new Error('Sender or recipient not found');
      }

      const senderData = senderDoc.data();
      const recipientData = recipientDoc.data();

      // Check sender balance
      const senderBalance = senderData?.balance?.[sourceCurrency] || 0;
      if (senderBalance < amount) {
        await snap.ref.update({
          status: 'failed',
          failureReason: 'Insufficient balance',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        throw new Error('Insufficient balance');
      }

      // Check daily and monthly limits
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const monthlyStart = new Date();
      monthlyStart.setDate(1);
      monthlyStart.setHours(0, 0, 0, 0);

      const [dailyTransactions, monthlyTransactions] = await Promise.all([
        db.collection('tenants').doc(tenantId).collection('transactions')
          .where('senderUid', '==', senderUid)
          .where('timestamp', '>=', todayStart)
          .where('status', '==', 'completed')
          .get(),
        db.collection('tenants').doc(tenantId).collection('transactions')
          .where('senderUid', '==', senderUid)
          .where('timestamp', '>=', monthlyStart)
          .where('status', '==', 'completed')
          .get()
      ]);

      const dailyTotal = dailyTransactions.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
      const monthlyTotal = monthlyTransactions.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

      if (dailyTotal + amount > senderData.dailyLimit) {
        await snap.ref.update({
          status: 'failed',
          failureReason: 'Daily limit exceeded',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        throw new Error('Daily limit exceeded');
      }

      if (monthlyTotal + amount > senderData.monthlyLimit) {
        await snap.ref.update({
          status: 'failed',
          failureReason: 'Monthly limit exceeded',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        throw new Error('Monthly limit exceeded');
      }

      // Update transaction with calculated values
      await snap.ref.update({
        fxRate,
        fxMarkupPercent,
        fees,
        netAmount,
        status: 'processing',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Perform balance updates in a transaction
      await db.runTransaction(async (transaction) => {
        // Deduct from sender
        const newSenderBalance = senderBalance - amount;
        transaction.update(senderDoc.ref, {
          [`balance.${sourceCurrency}`]: newSenderBalance,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Add to recipient
        const recipientBalance = recipientData?.balance?.[destinationCurrency] || 0;
        const newRecipientBalance = recipientBalance + netAmount;
        transaction.update(recipientDoc.ref, {
          [`balance.${destinationCurrency}`]: newRecipientBalance,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      // Create unified transaction record
      const unifiedTransaction = {
        id: transactionId,
        tenantId,
        type: 'p2p',
        senderUid,
        recipientUid,
        amount,
        sourceCurrency,
        destinationCurrency,
        fxRate,
        fxMarkupPercent,
        fees,
        netAmount,
        status: 'completed',
        referenceNumber: `P2P-${transactionId.slice(0, 8).toUpperCase()}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        message
      };

      await db.collection('tenants').doc(tenantId).collection('transactions').doc(transactionId).set(unifiedTransaction);

      // Update P2P transaction status
      await snap.ref.update({
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create user history records
      const historyData = {
        ...unifiedTransaction,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      };

      await Promise.all([
        db.collection('tenants').doc(tenantId).collection('users').doc(senderUid)
          .collection('history').doc(transactionId).set(historyData),
        db.collection('tenants').doc(tenantId).collection('users').doc(recipientUid)
          .collection('history').doc(transactionId).set(historyData)
      ]);

      // Send notifications
      const [senderNotification, recipientNotification] = [
        {
          userId: senderUid,
          tenantId,
          title: 'Transfer Sent',
          body: `Successfully sent ${amount} ${sourceCurrency} to ${recipientData?.fullName || recipientUid}`,
          type: 'transaction',
          data: { transactionId, amount, currency: sourceCurrency },
          read: false,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          fcmSent: false
        },
        {
          userId: recipientUid,
          tenantId,
          title: 'Transfer Received',
          body: `Received ${netAmount} ${destinationCurrency} from ${senderData?.fullName || senderUid}`,
          type: 'transaction',
          data: { transactionId, amount: netAmount, currency: destinationCurrency },
          read: false,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          fcmSent: false
        }
      ];

      await Promise.all([
        db.collection('tenants').doc(tenantId).collection('notifications').add(senderNotification),
        db.collection('tenants').doc(tenantId).collection('notifications').add(recipientNotification)
      ]);

      // Log access
      await db.collection('tenants').doc(tenantId).collection('access_logs').add({
        userId: senderUid,
        tenantId,
        action: 'transaction',
        ipAddress: 'unknown',
        userAgent: 'cloud_function',
        deviceFingerprint: 'unknown',
        success: true,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`P2P transaction ${transactionId} completed successfully`);

    } catch (error) {
      console.error('Error processing P2P transaction:', error);
      
      // Update transaction with error status
      await snap.ref.update({
        status: 'failed',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      throw error;
    }
  }); 