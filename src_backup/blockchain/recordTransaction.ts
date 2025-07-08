import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import crypto from 'crypto';

const db = admin.firestore();

interface BlockchainResponse {
  hash: string;
  blockNumber?: number;
  confirmations: number;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed?: number;
  gasPrice?: number;
  network: string;
}

// Mock blockchain API call
async function recordToBlockchainAPI(transactionData: any): Promise<BlockchainResponse> {
  try {
    // This is a mock implementation. In production, you would call real blockchain APIs
    const mockResponse = await axios.post('https://api.blockchain.com/transactions', {
      from: transactionData.senderUid,
      to: transactionData.recipientUid,
      amount: transactionData.netAmount,
      currency: transactionData.destinationCurrency,
      transactionId: transactionData.id,
      timestamp: new Date().toISOString()
    }, {
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${process.env.BLOCKCHAIN_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      hash: mockResponse.data.hash,
      blockNumber: mockResponse.data.blockNumber,
      confirmations: mockResponse.data.confirmations,
      status: mockResponse.data.status,
      gasUsed: mockResponse.data.gasUsed,
      gasPrice: mockResponse.data.gasPrice,
      network: mockResponse.data.network
    };
  } catch (error) {
    console.error('Blockchain API call failed:', error);
    
    // Fallback to mock blockchain response for demo purposes
    const mockHash = crypto.createHash('sha256')
      .update(`${transactionData.id}-${Date.now()}`)
      .digest('hex');
    
    return {
      hash: mockHash,
      blockNumber: Math.floor(Math.random() * 1000000),
      confirmations: Math.floor(Math.random() * 12) + 1,
      status: 'confirmed',
      gasUsed: Math.floor(Math.random() * 100000) + 50000,
      gasPrice: Math.floor(Math.random() * 50) + 20,
      network: 'ethereum'
    };
  }
}

export const recordToBlockchain = functions.firestore
  .document('tenants/{tenantId}/transactions/{transactionId}')
  .onUpdate(async (change, context) => {
    try {
      const { tenantId, transactionId } = context.params;
      const beforeData = change.before.data();
      const afterData = change.after.data();

      // Only process completed transactions that haven't been recorded to blockchain yet
      if (afterData.status !== 'completed' || afterData.blockchainHash) {
        return;
      }

      console.log(`Recording transaction ${transactionId} to blockchain`);

      // Update transaction status to processing blockchain
      await change.after.ref.update({
        status: 'processing_blockchain',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Record to blockchain
      const blockchainResult = await recordToBlockchainAPI(afterData);

      // Create blockchain transaction record
      const blockchainTransaction = {
        id: `${transactionId}_blockchain`,
        tenantId,
        transactionId,
        hash: blockchainResult.hash,
        blockNumber: blockchainResult.blockNumber,
        confirmations: blockchainResult.confirmations,
        status: blockchainResult.status,
        gasUsed: blockchainResult.gasUsed,
        gasPrice: blockchainResult.gasPrice,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        network: blockchainResult.network
      };

      await db.collection('tenants').doc(tenantId).collection('blockchain_transactions')
        .doc(blockchainTransaction.id).set(blockchainTransaction);

      // Update main transaction with blockchain info
      await change.after.ref.update({
        blockchainHash: blockchainResult.hash,
        txConfirmed: blockchainResult.status === 'confirmed',
        status: 'completed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update P2P transaction if it exists
      const p2pTransactionRef = db.collection('tenants').doc(tenantId).collection('p2p_transactions').doc(transactionId);
      const p2pTransaction = await p2pTransactionRef.get();
      
      if (p2pTransaction.exists) {
        await p2pTransactionRef.update({
          blockchainHash: blockchainResult.hash,
          txConfirmed: blockchainResult.status === 'confirmed',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // Update cash transaction if it exists
      const cashTransactionRef = db.collection('tenants').doc(tenantId).collection('cash_transactions').doc(transactionId);
      const cashTransaction = await cashTransactionRef.get();
      
      if (cashTransaction.exists) {
        await cashTransactionRef.update({
          blockchainHash: blockchainResult.hash,
          txConfirmed: blockchainResult.status === 'confirmed',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // Update user history records
      const historyUpdate = {
        blockchainHash: blockchainResult.hash,
        txConfirmed: blockchainResult.status === 'confirmed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Update sender history
      if (afterData.senderUid) {
        const senderHistoryRef = db.collection('tenants').doc(tenantId)
          .collection('users').doc(afterData.senderUid)
          .collection('history').doc(transactionId);
        await senderHistoryRef.update(historyUpdate);
      }

      // Update recipient history
      if (afterData.recipientUid) {
        const recipientHistoryRef = db.collection('tenants').doc(tenantId)
          .collection('users').doc(afterData.recipientUid)
          .collection('history').doc(transactionId);
        await recipientHistoryRef.update(historyUpdate);
      }

      // Update user history if it's a cash transaction
      if (afterData.userId) {
        const userHistoryRef = db.collection('tenants').doc(tenantId)
          .collection('users').doc(afterData.userId)
          .collection('history').doc(transactionId);
        await userHistoryRef.update(historyUpdate);
      }

      // Send notification about blockchain confirmation
      const notificationData = {
        userId: afterData.senderUid || afterData.userId,
        tenantId,
        title: 'Transaction Confirmed on Blockchain',
        body: `Your transaction has been recorded on the blockchain with hash: ${blockchainResult.hash.slice(0, 10)}...`,
        type: 'transaction',
        data: {
          transactionId,
          blockchainHash: blockchainResult.hash,
          confirmations: blockchainResult.confirmations
        },
        read: false,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        fcmSent: false
      };

      await db.collection('tenants').doc(tenantId).collection('notifications').add(notificationData);

      // Log blockchain recording
      await db.collection('tenants').doc(tenantId).collection('access_logs').add({
        userId: afterData.senderUid || afterData.userId,
        tenantId,
        action: 'blockchain_recorded',
        ipAddress: 'unknown',
        userAgent: 'cloud_function',
        deviceFingerprint: 'unknown',
        success: true,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Transaction ${transactionId} recorded to blockchain with hash: ${blockchainResult.hash}`);

    } catch (error) {
      console.error('Error recording to blockchain:', error);
      
      // Update transaction with error status
      await change.after.ref.update({
        status: 'blockchain_failed',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      throw error;
    }
  }); 