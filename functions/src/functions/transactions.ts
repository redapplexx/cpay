import * as functions from 'firebase-functions';
import { UserService } from '../services/userService';
import { TransactionService } from '../services/transactionService';
import { WalletService } from '../services/walletService';
import { AccessControlService } from '../services/accessControlService';
import { AMLService } from '../services/amlService';
import { formatErrorResponse, handleError } from '../utils/errors';
import { TransactionType, TransactionStatus, Transaction } from '../types';
import { z } from 'zod';
import * as admin from 'firebase-admin';

const db = admin.firestore();

const initiateP2PTransferSchema = z.object({
  recipientId: z.string().optional(),
  recipientMobile: z.string().optional(),
  amount: z.number().positive(),
  note: z.string().optional(),
});

const initiateCashOutSchema = z.object({
  amount: z.number().positive(),
  bankAccountNumber: z.string().min(5),
  bankCode: z.string().min(2),
  otp: z.string().min(4),
  note: z.string().optional(),
});

const processBillsPaymentSchema = z.object({
  billerId: z.string().min(1),
  accountNumber: z.string().min(1),
  amount: z.number().positive(),
  billDetails: z.record(z.any()).optional(),
  note: z.string().optional(),
});

const processIncomingDepositWebhookSchema = z.object({
  transactionId: z.string().min(1),
  userId: z.string().min(1),
  amount: z.number().positive(),
  reference: z.string().optional(),
  note: z.string().optional(),
});

const getTransactionHistorySchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});

const BILLER_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Send payment
export const sendPayment = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'create', 'transactions');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    // Create transaction
    const transaction = await TransactionService.createTransaction({
      ...data,
      type: TransactionType.TRANSFER,
      fromUserId: context.auth.uid
    }, context.auth.uid);

    // Process the payment (debit from wallet, credit to wallet)
    if (data.fromWalletId && data.toWalletId) {
      // Debit from sender wallet
      await WalletService.debitWallet(
        data.fromWalletId,
        data.amount,
        transaction.id,
        `Payment to ${data.toUserId}`,
        transaction.reference || transaction.id,
        context.auth.uid
      );

      // Credit to receiver wallet
      await WalletService.creditWallet(
        data.toWalletId,
        data.amount,
        transaction.id,
        `Payment from ${data.fromUserId}`,
        transaction.reference || transaction.id,
        context.auth.uid
      );

      // Update transaction status to completed
      await TransactionService.updateTransactionStatus(transaction.id, TransactionStatus.COMPLETED, context.auth.uid);
    }

    // Check for AML flags
    if (data.amount > 10000) { // Example threshold
      await AMLService.flagTransaction({
        transactionId: transaction.id,
        userId: context.auth.uid,
        riskScore: 75,
        reason: 'Large transaction amount',
        severity: 'medium'
      }, 'system');
    }
    
    return {
      success: true,
      data: transaction
    };
  } catch (error) {
    console.error('sendPayment error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// Get transaction by ID
export const getTransaction = functions.https.onCall(async (data: { transactionId: string }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'read', 'transactions');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const transaction = await TransactionService.getTransaction(data.transactionId);
    
    return {
      success: true,
      data: transaction
    };
  } catch (error) {
    console.error('getTransaction error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// List transactions
export const listTransactions = functions.https.onCall(async (data: { filters?: any; limit?: number }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'read', 'transactions');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const transactions = await TransactionService.listTransactions(data.filters, data.limit);
    
    return {
      success: true,
      data: transactions
    };
  } catch (error) {
    console.error('listTransactions error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// Update transaction status (admin only)
export const updateTransactionStatus = functions.https.onCall(async (data: { transactionId: string; status: string }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'update', 'transactions');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    await TransactionService.updateTransactionStatus(data.transactionId, data.status as TransactionStatus, context.auth.uid);
    
    return {
      success: true,
      message: 'Transaction status updated successfully'
    };
  } catch (error) {
    console.error('updateTransactionStatus error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// FX conversion
export const convertCurrency = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'create', 'transactions');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    // Create FX transaction
    const transaction = await TransactionService.createTransaction({
      ...data,
      type: TransactionType.FX_CONVERSION,
      fromUserId: context.auth.uid
    }, context.auth.uid);

    // Process FX conversion
    if (data.fromWalletId && data.toWalletId) {
      // Debit from source wallet
      await WalletService.debitWallet(
        data.fromWalletId,
        data.amount,
        transaction.id,
        `FX conversion to ${data.toCurrency}`,
        transaction.reference || transaction.id,
        context.auth.uid
      );

      // Credit to destination wallet with converted amount
      const convertedAmount = data.amount * (data.fxRate || 1);
      await WalletService.creditWallet(
        data.toWalletId,
        convertedAmount,
        transaction.id,
        `FX conversion from ${data.fromCurrency}`,
        transaction.reference || transaction.id,
        context.auth.uid
      );

      // Update transaction status to completed
      await TransactionService.updateTransactionStatus(transaction.id, TransactionStatus.COMPLETED, context.auth.uid);
    }
    
    return {
      success: true,
      data: transaction
    };
  } catch (error) {
    console.error('convertCurrency error:', error);
    return formatErrorResponse(handleError(error));
  }
});

export const initiateP2PTransfer = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const senderId = context.auth.uid;
    const parseResult = initiateP2PTransferSchema.safeParse(data);
    if (!parseResult.success) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid input', parseResult.error.flatten());
    }
    const { recipientId, recipientMobile, amount, note } = parseResult.data;

    // Resolve recipient by userId or mobile number
    let recipientDoc;
    if (recipientId) {
      recipientDoc = await db.collection('users').doc(recipientId).get();
    } else if (recipientMobile) {
      const snap = await db.collection('users').where('mobileNumber', '==', recipientMobile).limit(1).get();
      recipientDoc = snap.docs[0];
    } else {
      throw new functions.https.HttpsError('invalid-argument', 'Recipient not specified');
    }
    if (!recipientDoc || !recipientDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Recipient not found');
    }
    const recipientData = recipientDoc.data();
    if (recipientData.kycStatus !== 'verified') {
      throw new functions.https.HttpsError('failed-precondition', 'Recipient is not KYC verified');
    }
    const recipientUserId = recipientDoc.id;

    // Firestore transaction for atomicity
    await db.runTransaction(async (t) => {
      const senderWalletRef = db.collection('users').doc(senderId).collection('wallets').doc('main');
      const recipientWalletRef = db.collection('users').doc(recipientUserId).collection('wallets').doc('main');
      const senderWalletSnap = await t.get(senderWalletRef);
      const recipientWalletSnap = await t.get(recipientWalletRef);
      if (!senderWalletSnap.exists || !recipientWalletSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Sender or recipient wallet not found');
      }
      const senderWallet = senderWalletSnap.data();
      const recipientWallet = recipientWalletSnap.data();
      if (senderWallet.balance < amount) {
        throw new functions.https.HttpsError('failed-precondition', 'Insufficient balance');
      }
      // Update balances
      t.update(senderWalletRef, { balance: senderWallet.balance - amount });
      t.update(recipientWalletRef, { balance: recipientWallet.balance + amount });
      // Create transaction document
      const txRef = db.collection('transactions').doc();
      const transaction: Transaction = {
        transactionId: txRef.id,
        type: 'p2p',
        status: 'completed',
        amount,
        currency: 'PHP',
        senderId,
        recipientId: recipientUserId,
        timestamp: admin.firestore.Timestamp.now(),
        description: note || '',
      };
      t.set(txRef, transaction);
    });
    return { success: true };
  } catch (error) {
    handleError({
      functionName: 'initiateP2PTransfer',
      userId: context?.auth?.uid,
      error,
      message: 'Failed to initiate P2P transfer',
    });
    throw new functions.https.HttpsError('internal', 'Failed to initiate P2P transfer');
  }
});

export const initiateCashOut = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const userId = context.auth.uid;
    const parseResult = initiateCashOutSchema.safeParse(data);
    if (!parseResult.success) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid input', parseResult.error.flatten());
    }
    const { amount, bankAccountNumber, bankCode, otp, note } = parseResult.data;

    // Validate OTP (assume OTPs are stored in a collection 'otps' with docId = userId)
    const otpDoc = await db.collection('otps').doc(userId).get();
    if (!otpDoc.exists || otpDoc.data().code !== otp || otpDoc.data().expiresAt < Date.now()) {
      throw new functions.https.HttpsError('failed-precondition', 'Invalid or expired OTP');
    }

    // Firestore transaction for atomicity
    await db.runTransaction(async (t) => {
      const walletRef = db.collection('users').doc(userId).collection('wallets').doc('main');
      const walletSnap = await t.get(walletRef);
      if (!walletSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Wallet not found');
      }
      const wallet = walletSnap.data();
      if (wallet.balance < amount) {
        throw new functions.https.HttpsError('failed-precondition', 'Insufficient balance');
      }
      // Deduct balance
      t.update(walletRef, { balance: wallet.balance - amount });
      // Create transaction document
      const txRef = db.collection('transactions').doc();
      const transaction: Transaction = {
        transactionId: txRef.id,
        type: 'cash-out',
        status: 'pending',
        amount,
        currency: 'PHP',
        senderId: userId,
        recipientId: bankAccountNumber, // For cash-out, recipient is the bank account
        timestamp: admin.firestore.Timestamp.now(),
        description: note || '',
        referenceNumber: bankCode,
        otpVerified: true,
      };
      t.set(txRef, transaction);
    });

    // Optionally, mark OTP as used
    await db.collection('otps').doc(userId).delete();

    return { success: true };
  } catch (error) {
    handleError({
      functionName: 'initiateCashOut',
      userId: context?.auth?.uid,
      error,
      message: 'Failed to initiate cash out',
    });
    throw new functions.https.HttpsError('internal', 'Failed to initiate cash out');
  }
});

export const processBillsPayment = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const userId = context.auth.uid;
    const parseResult = processBillsPaymentSchema.safeParse(data);
    if (!parseResult.success) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid input', parseResult.error.flatten());
    }
    const { billerId, accountNumber, amount, billDetails, note } = parseResult.data;

    // Validate biller (assume billers are cached in 'biller_list' collection)
    const billerDoc = await db.collection('biller_list').doc(billerId).get();
    if (!billerDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Biller not found');
    }

    // Firestore transaction for atomicity
    let transactionId = '';
    await db.runTransaction(async (t) => {
      const walletRef = db.collection('users').doc(userId).collection('wallets').doc('main');
      const walletSnap = await t.get(walletRef);
      if (!walletSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Wallet not found');
      }
      const wallet = walletSnap.data();
      if (wallet.balance < amount) {
        throw new functions.https.HttpsError('failed-precondition', 'Insufficient balance');
      }
      // Deduct balance
      t.update(walletRef, { balance: wallet.balance - amount });
      // Create transaction document
      const txRef = db.collection('transactions').doc();
      transactionId = txRef.id;
      const transaction: Transaction = {
        transactionId: txRef.id,
        type: 'bill-payment',
        status: 'pending',
        amount,
        currency: 'PHP',
        senderId: userId,
        recipientId: billerId,
        timestamp: admin.firestore.Timestamp.now(),
        description: note || '',
        referenceNumber: accountNumber,
      };
      t.set(txRef, transaction);
    });

    // Call aggregator API (pseudo-code, replace with real API call)
    let aggregatorResult;
    try {
      // aggregatorResult = await callAggregatorApi({ billerId, accountNumber, amount, billDetails });
      aggregatorResult = { success: true, reference: 'AGG123456' };
    } catch (apiError) {
      // Optionally, update transaction status to failed
      await db.collection('transactions').doc(transactionId).update({ status: 'failed' });
      throw new functions.https.HttpsError('internal', 'Aggregator API call failed');
    }

    // Update transaction status to completed and add aggregator reference
    await db.collection('transactions').doc(transactionId).update({
      status: 'completed',
      referenceNumber: aggregatorResult.reference,
    });

    return { success: true };
  } catch (error) {
    handleError({
      functionName: 'processBillsPayment',
      userId: context?.auth?.uid,
      error,
      message: 'Failed to process bills payment',
    });
    throw new functions.https.HttpsError('internal', 'Failed to process bills payment');
  }
});

export const processIncomingDepositWebhook = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }
    const parseResult = processIncomingDepositWebhookSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid input', details: parseResult.error.flatten() });
      return;
    }
    const { transactionId, userId, amount, reference, note } = parseResult.data;

    // Idempotency: check if transaction already exists
    const txDoc = await db.collection('transactions').doc(transactionId).get();
    if (txDoc.exists) {
      res.status(200).json({ success: true, message: 'Already processed' });
      return;
    }

    // Validate user
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Firestore transaction for atomicity
    await db.runTransaction(async (t) => {
      const walletRef = db.collection('users').doc(userId).collection('wallets').doc('main');
      const walletSnap = await t.get(walletRef);
      if (!walletSnap.exists) {
        throw new Error('Wallet not found');
      }
      const wallet = walletSnap.data();
      // Add amount to wallet
      t.update(walletRef, { balance: wallet.balance + amount });
      // Create transaction document
      const transaction: Transaction = {
        transactionId,
        type: 'cash-in',
        status: 'completed',
        amount,
        currency: 'PHP',
        senderId: reference || 'gateway',
        recipientId: userId,
        timestamp: admin.firestore.Timestamp.now(),
        description: note || '',
        referenceNumber: reference,
      };
      t.set(db.collection('transactions').doc(transactionId), transaction);
    });

    res.status(200).json({ success: true });
  } catch (error) {
    handleError({
      functionName: 'processIncomingDepositWebhook',
      error,
      message: 'Failed to process incoming deposit webhook',
    });
    res.status(500).json({ error: 'Failed to process incoming deposit webhook' });
  }
});

export const getBillerList = functions.https.onCall(async (_data, _context) => {
  try {
    const cacheDoc = await db.collection('biller_list_cache').doc('latest').get();
    const now = Date.now();
    if (cacheDoc.exists) {
      const cache = cacheDoc.data();
      if (cache && cache.fetchedAt && now - cache.fetchedAt.toMillis() < BILLER_CACHE_TTL_MS) {
        return { success: true, billers: cache.billers };
      }
    }
    // Fetch from external API (pseudo-code)
    // const billers = await fetchExternalBillerApi();
    const billers = [
      { id: 'biller1', name: 'Electric Co.' },
      { id: 'biller2', name: 'Water Utility' },
    ];
    await db.collection('biller_list_cache').doc('latest').set({
      billers,
      fetchedAt: admin.firestore.Timestamp.now(),
    });
    return { success: true, billers };
  } catch (error) {
    handleError({
      functionName: 'getBillerList',
      error,
      message: 'Failed to get biller list',
    });
    throw new functions.https.HttpsError('internal', 'Failed to get biller list');
  }
});

export const getTransactionHistory = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const userId = context.auth.uid;
    const parseResult = getTransactionHistorySchema.safeParse(data);
    if (!parseResult.success) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid input', parseResult.error.flatten());
    }
    const { page, pageSize } = parseResult.data;
    const offset = (page - 1) * pageSize;
    // Query transactions where user is sender or recipient
    const txSnap = await db.collection('transactions')
      .where('senderId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(pageSize + offset)
      .get();
    const txs = txSnap.docs.slice(offset, offset + pageSize).map(doc => doc.data());
    // Also get transactions where user is recipient
    const rxSnap = await db.collection('transactions')
      .where('recipientId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(pageSize + offset)
      .get();
    const rxs = rxSnap.docs.slice(offset, offset + pageSize).map(doc => doc.data());
    // Merge and sort by timestamp desc
    const allTxs = [...txs, ...rxs].sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
    return { success: true, transactions: allTxs.slice(0, pageSize) };
  } catch (error) {
    handleError({
      functionName: 'getTransactionHistory',
      userId: context?.auth?.uid,
      error,
      message: 'Failed to get transaction history',
    });
    throw new functions.https.HttpsError('internal', 'Failed to get transaction history');
  }
}); 