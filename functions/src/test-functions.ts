import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Create Wallet - Simplified test version
export const createWallet = functions.https.onCall(async (data, context) => {
  try {
    const userId = data.userId;
    
    if (!userId) {
      throw new functions.https.HttpsError('invalid-argument', 'userId is required');
    }

    const walletRef = db.collection('wallets').doc();
    await walletRef.set({
      userId: userId,
      balance: 0,
      currency: 'PHP',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update user with wallet ID
    await db.collection('users').doc(userId).update({ 
      walletId: walletRef.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { 
      success: true,
      message: 'Wallet created', 
      walletId: walletRef.id 
    };
  } catch (error) {
    console.error('createWallet error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create wallet');
  }
});

// Post Transaction - Simplified test version
export const postTransaction = functions.https.onCall(async (data, context) => {
  try {
    const { fromWallet, toWallet, amount } = data;
    
    if (!fromWallet || !toWallet || !amount) {
      throw new functions.https.HttpsError('invalid-argument', 'fromWallet, toWallet, and amount are required');
    }

    if (amount <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Amount must be greater than 0');
    }

    const txRef = db.collection('transactions').doc();
    const fromRef = db.collection('wallets').doc(fromWallet);
    const toRef = db.collection('wallets').doc(toWallet);

    // Check if sender wallet exists and has sufficient balance
    const fromDoc = await fromRef.get();
    if (!fromDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Sender wallet not found');
    }

    if (fromDoc.data()!.balance < amount) {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient balance');
    }

    // Process transaction atomically
    await db.runTransaction(async (t) => {
      // Debit from sender
      t.update(fromRef, { 
        balance: fromDoc.data()!.balance - amount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Credit to receiver
      const toDoc = await t.get(toRef);
      if (!toDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Receiver wallet not found');
      }
      
      t.update(toRef, { 
        balance: (toDoc.data()!.balance || 0) + amount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Create transaction record
      t.set(txRef, {
        fromWallet,
        toWallet,
        amount,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        type: 'transfer',
        status: 'completed'
      });
    });

    return { 
      success: true,
      message: 'Transaction complete', 
      transactionId: txRef.id 
    };
  } catch (error) {
    console.error('postTransaction error:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to process transaction');
  }
});

// Get wallet balance
export const getWalletBalance = functions.https.onCall(async (data, context) => {
  try {
    const { walletId } = data;
    
    if (!walletId) {
      throw new functions.https.HttpsError('invalid-argument', 'walletId is required');
    }

    const walletDoc = await db.collection('wallets').doc(walletId).get();
    
    if (!walletDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Wallet not found');
    }

    const walletData = walletDoc.data()!;
    
    return {
      success: true,
      data: {
        walletId,
        balance: walletData.balance,
        currency: walletData.currency,
        status: walletData.status
      }
    };
  } catch (error) {
    console.error('getWalletBalance error:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to get wallet balance');
  }
});

// List wallets by user
export const listWalletsByUser = functions.https.onCall(async (data, context) => {
  try {
    const { userId } = data;
    
    if (!userId) {
      throw new functions.https.HttpsError('invalid-argument', 'userId is required');
    }

    const walletsSnapshot = await db.collection('wallets')
      .where('userId', '==', userId)
      .get();

    const wallets = walletsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      data: wallets
    };
  } catch (error) {
    console.error('listWalletsByUser error:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to list wallets');
  }
}); 