import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface TransactionHistoryRequest {
  limit?: number;
  offset?: number;
  type?: 'p2p' | 'cash_in' | 'cash_out';
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  startDate?: Date;
  endDate?: Date;
  currency?: string;
}

export const getTransactionHistory = functions.https.onCall(async (data: TransactionHistoryRequest, context) => {
  try {
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { uid } = context.auth;
    const { limit = 20, offset = 0, type, status, startDate, endDate, currency } = data;

    // Validate limit
    if (limit > 100) {
      throw new functions.https.HttpsError('invalid-argument', 'Limit cannot exceed 100');
    }

    // Get user data
    const userSnapshot = await db.collectionGroup('users').where('uid', '==', uid).get();
    if (userSnapshot.empty) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userSnapshot.docs[0].data();
    const tenantId = userData.tenantId;

    // Build query for transactions where user is sender
    let senderQuery = db.collection('tenants').doc(tenantId).collection('transactions')
      .where('senderUid', '==', uid)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .offset(offset);

    // Build query for transactions where user is recipient
    let recipientQuery = db.collection('tenants').doc(tenantId).collection('transactions')
      .where('recipientUid', '==', uid)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .offset(offset);

    // Build query for cash transactions where user is the user
    let cashQuery = db.collection('tenants').doc(tenantId).collection('transactions')
      .where('userId', '==', uid)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .offset(offset);

    // Apply filters
    if (type) {
      senderQuery = senderQuery.where('type', '==', type);
      recipientQuery = recipientQuery.where('type', '==', type);
      cashQuery = cashQuery.where('type', '==', type);
    }

    if (status) {
      senderQuery = senderQuery.where('status', '==', status);
      recipientQuery = recipientQuery.where('status', '==', status);
      cashQuery = cashQuery.where('status', '==', status);
    }

    if (startDate && endDate) {
      senderQuery = senderQuery.where('timestamp', '>=', startDate).where('timestamp', '<=', endDate);
      recipientQuery = recipientQuery.where('timestamp', '>=', startDate).where('timestamp', '<=', endDate);
      cashQuery = cashQuery.where('timestamp', '>=', startDate).where('timestamp', '<=', endDate);
    }

    if (currency) {
      senderQuery = senderQuery.where('sourceCurrency', '==', currency);
      recipientQuery = recipientQuery.where('destinationCurrency', '==', currency);
      cashQuery = cashQuery.where('sourceCurrency', '==', currency);
    }

    // Execute queries
    const [senderSnapshot, recipientSnapshot, cashSnapshot] = await Promise.all([
      senderQuery.get(),
      recipientQuery.get(),
      cashQuery.get()
    ]);

    // Combine and sort results
    const allTransactions = [
      ...senderSnapshot.docs.map(doc => ({ ...doc.data(), role: 'sender' })),
      ...recipientSnapshot.docs.map(doc => ({ ...doc.data(), role: 'recipient' })),
      ...cashSnapshot.docs.map(doc => ({ ...doc.data(), role: 'user' }))
    ];

    // Sort by timestamp (most recent first)
    allTransactions.sort((a, b) => {
      const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp);
      const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp);
      return bTime.getTime() - aTime.getTime();
    });

    // Apply pagination
    const paginatedTransactions = allTransactions.slice(offset, offset + limit);

    // Calculate summary statistics
    const summary = {
      total: allTransactions.length,
      totalAmount: 0,
      totalFees: 0,
      byType: {
        p2p: { count: 0, amount: 0 },
        cash_in: { count: 0, amount: 0 },
        cash_out: { count: 0, amount: 0 }
      },
      byStatus: {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        cancelled: 0
      }
    };

    allTransactions.forEach(txn => {
      summary.totalAmount += txn.amount || 0;
      summary.totalFees += txn.fees || 0;

      // Count by type
      if (txn.type && summary.byType[txn.type as keyof typeof summary.byType]) {
        summary.byType[txn.type as keyof typeof summary.byType].count++;
        summary.byType[txn.type as keyof typeof summary.byType].amount += txn.amount || 0;
      }

      // Count by status
      if (txn.status && summary.byStatus[txn.status as keyof typeof summary.byStatus] !== undefined) {
        summary.byStatus[txn.status as keyof typeof summary.byStatus]++;
      }
    });

    return {
      success: true,
      transactions: paginatedTransactions,
      summary,
      pagination: {
        limit,
        offset,
        total: allTransactions.length,
        hasMore: offset + limit < allTransactions.length
      }
    };

  } catch (error) {
    console.error('Error fetching transaction history:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Error fetching transaction history');
  }
}); 