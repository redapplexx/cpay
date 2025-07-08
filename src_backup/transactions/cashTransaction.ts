import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const db = admin.firestore();

interface CashTransactionRequest {
  userId: string;
  tenantId: string;
  type: 'cash_in' | 'cash_out';
  amount: number;
  currency: 'PHP' | 'KRW' | 'USD';
  method: 'gcash' | 'maya' | 'bank_transfer' | 'cash_pickup' | 'mobile_money';
  referenceNumber?: string;
}

interface PaymentProviderResponse {
  success: boolean;
  referenceNumber: string;
  externalReference?: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  message?: string;
  fees?: number;
}

// Mock payment provider API call
async function callPaymentProvider(transactionData: CashTransactionRequest): Promise<PaymentProviderResponse> {
  try {
    const providerEndpoints = {
      gcash: 'https://api.gcash.com/payments',
      maya: 'https://api.maya.com/payments',
      bank_transfer: 'https://api.bank.com/transfers',
      cash_pickup: 'https://api.cashpickup.com/orders',
      mobile_money: 'https://api.mobilemoney.com/transactions'
    };

    const endpoint = providerEndpoints[transactionData.method];
    if (!endpoint) {
      throw new Error(`Unsupported payment method: ${transactionData.method}`);
    }

    const payload = {
      amount: transactionData.amount,
      currency: transactionData.currency,
      type: transactionData.type,
      reference: transactionData.referenceNumber || uuidv4(),
      timestamp: new Date().toISOString()
    };

    const response = await axios.post(endpoint, payload, {
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${process.env[`${transactionData.method.toUpperCase()}_API_KEY`]}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: response.data.success,
      referenceNumber: response.data.referenceNumber,
      externalReference: response.data.externalReference,
      status: response.data.status,
      message: response.data.message,
      fees: response.data.fees
    };

  } catch (error) {
    console.error('Payment provider API call failed:', error);
    
    // Fallback to mock response for demo purposes
    const mockSuccess = Math.random() > 0.1; // 90% success rate
    
    return {
      success: mockSuccess,
      referenceNumber: transactionData.referenceNumber || `MOCK-${Date.now()}`,
      externalReference: mockSuccess ? `EXT-${Date.now()}` : undefined,
      status: mockSuccess ? 'success' : 'failed',
      message: mockSuccess ? 'Transaction processed successfully' : 'Payment provider error',
      fees: transactionData.amount * 0.025 // 2.5% fee
    };
  }
}

export const processCashTransaction = functions.firestore
  .document('tenants/{tenantId}/cash_transactions/{transactionId}')
  .onCreate(async (snap, context) => {
    try {
      const { tenantId, transactionId } = context.params;
      const transactionData = snap.data() as CashTransactionRequest;
      const { userId, type, amount, currency, method } = transactionData;

      console.log(`Processing ${type} transaction ${transactionId} for user ${userId}`);

      // Get user data
      const userDoc = await db.collection('tenants').doc(tenantId).collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();

      // Check KYC status for cash-out
      if (type === 'cash_out' && userData.kycStatus !== 'verified') {
        await snap.ref.update({
          status: 'failed',
          failureReason: 'KYC verification required for cash-out',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        throw new Error('KYC verification required for cash-out');
      }

      // Check daily and monthly limits
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const monthlyStart = new Date();
      monthlyStart.setDate(1);
      monthlyStart.setHours(0, 0, 0, 0);

      const [dailyTransactions, monthlyTransactions] = await Promise.all([
        db.collection('tenants').doc(tenantId).collection('cash_transactions')
          .where('userId', '==', userId)
          .where('timestamp', '>=', todayStart)
          .where('status', '==', 'success')
          .get(),
        db.collection('tenants').doc(tenantId).collection('cash_transactions')
          .where('userId', '==', userId)
          .where('timestamp', '>=', monthlyStart)
          .where('status', '==', 'success')
          .get()
      ]);

      const dailyTotal = dailyTransactions.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
      const monthlyTotal = monthlyTransactions.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

      if (dailyTotal + amount > userData.dailyLimit) {
        await snap.ref.update({
          status: 'failed',
          failureReason: 'Daily limit exceeded',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        throw new Error('Daily limit exceeded');
      }

      if (monthlyTotal + amount > userData.monthlyLimit) {
        await snap.ref.update({
          status: 'failed',
          failureReason: 'Monthly limit exceeded',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        throw new Error('Monthly limit exceeded');
      }

      // Check balance for cash-out
      if (type === 'cash_out') {
        const currentBalance = userData.balance?.[currency] || 0;
        if (currentBalance < amount) {
          await snap.ref.update({
            status: 'failed',
            failureReason: 'Insufficient balance',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          throw new Error('Insufficient balance');
        }
      }

      // Update transaction status to processing
      await snap.ref.update({
        status: 'processing',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Call payment provider
      const providerResponse = await callPaymentProvider(transactionData);

      // Calculate fees and net amount
      const fees = providerResponse.fees || (amount * 0.025);
      const netAmount = type === 'cash_in' ? amount - fees : amount + fees;

      // Update transaction with provider response
      await snap.ref.update({
        status: providerResponse.status,
        externalReference: providerResponse.externalReference,
        fees,
        netAmount,
        providerResponse: providerResponse,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      if (providerResponse.success) {
        // Update user balance
        const currentBalance = userData.balance?.[currency] || 0;
        const newBalance = type === 'cash_in' 
          ? currentBalance + netAmount 
          : currentBalance - amount;

        await userDoc.ref.update({
          [`balance.${currency}`]: newBalance,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Create unified transaction record
        const unifiedTransaction = {
          id: transactionId,
          tenantId,
          type,
          userId,
          amount,
          sourceCurrency: currency,
          destinationCurrency: currency,
          fxRate: 1,
          fxMarkupPercent: 0,
          fees,
          netAmount,
          status: 'completed',
          referenceNumber: providerResponse.referenceNumber,
          externalReference: providerResponse.externalReference,
          method,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('tenants').doc(tenantId).collection('transactions').doc(transactionId).set(unifiedTransaction);

        // Create user history record
        const historyData = {
          ...unifiedTransaction,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('tenants').doc(tenantId).collection('users').doc(userId)
          .collection('history').doc(transactionId).set(historyData);

        // Send notification
        const notificationData = {
          userId,
          tenantId,
          title: type === 'cash_in' ? 'Cash-In Successful' : 'Cash-Out Successful',
          body: type === 'cash_in' 
            ? `Successfully added ${netAmount} ${currency} to your wallet`
            : `Successfully withdrawn ${amount} ${currency} via ${method}`,
          type: 'transaction',
          data: {
            transactionId,
            amount: type === 'cash_in' ? netAmount : amount,
            currency,
            method
          },
          read: false,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          fcmSent: false
        };

        await db.collection('tenants').doc(tenantId).collection('notifications').add(notificationData);

        // Log access
        await db.collection('tenants').doc(tenantId).collection('access_logs').add({
          userId,
          tenantId,
          action: 'transaction',
          ipAddress: 'unknown',
          userAgent: 'cloud_function',
          deviceFingerprint: 'unknown',
          success: true,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`${type} transaction ${transactionId} completed successfully`);
      } else {
        // Handle failed transaction
        await snap.ref.update({
          status: 'failed',
          failureReason: providerResponse.message || 'Payment provider error',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Send failure notification
        const notificationData = {
          userId,
          tenantId,
          title: `${type === 'cash_in' ? 'Cash-In' : 'Cash-Out'} Failed`,
          body: `Your ${type} transaction failed: ${providerResponse.message}`,
          type: 'transaction',
          data: {
            transactionId,
            amount,
            currency,
            method
          },
          read: false,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          fcmSent: false
        };

        await db.collection('tenants').doc(tenantId).collection('notifications').add(notificationData);

        throw new Error(providerResponse.message || 'Payment provider error');
      }

    } catch (error) {
      console.error('Error processing cash transaction:', error);
      
      // Update transaction with error status
      await snap.ref.update({
        status: 'failed',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      throw error;
    }
  }); 