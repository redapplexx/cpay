import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';

// Define the structure of a Transaction document
interface Transaction {
  transactionId: string;
  type: string; // e.g., 'p2p-transfer', 'cash-in', 'cash-out', 'bill-payment'
  amount: number;
  currency: string; // e.g., 'PHP', 'USD', 'KRW'
  timestamp: firestore.Timestamp;
  description: string;
  senderId: string; // UID of the sender
  recipientId: string; // UID of the recipient or merchant ID, biller ID, etc.
  // Additional fields can be added as needed, e.g., 'status', 'fee', 'metadata'
}

export const getTransactionHistory = functions.https.onCall(async (data, context) => {
  // 1. Authenticate: Ensure context.auth is valid.
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to view transaction history.');
  }

  // 2. Validate Input Data
  const { limit, startAfterDocId } = data;

  if (typeof limit !== 'number' || limit <= 0 || limit > 100) {
    throw new functions.https.HttpsError('invalid-argument', 'Limit must be a number between 1 and 100.');
  }

  if (startAfterDocId !== undefined && startAfterDocId !== null && typeof startAfterDocId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'startAfterDocId must be a string or null/undefined.');
  }

  const db = firestore();
  const transactionsRef = db.collection('transactions');

  let query = transactionsRef
    .where('senderId', '==', uid) // Query for transactions where the user is the sender
    .orderBy('timestamp', 'desc')
    .limit(limit);

  // For simplicity and as a starting point for Phase 1, we will perform
  // two queries and merge them server-side. A more scalable approach (as noted in the review)
  // would involve data denormalization or client-side merging for complex 'OR' conditions.

  let query2 = transactionsRef
    .where('recipientId', '==', uid) // Query for transactions where the user is the recipient
    .orderBy('timestamp', 'desc')
    .limit(limit);

  let startAfterDoc: firestore.DocumentSnapshot | undefined;

  if (startAfterDocId) {
    // To handle pagination across two queries, we need to rethink the startAfterDocId logic
    // for a simple server-side merge. A more robust solution would involve fetching more
    // documents and sorting/paginating *after* merging, or using the denormalization strategy.
    // For Phase 1, let's fetch 'limit * 2' documents to increase the chance of covering the next page.
    // This is not a perfect solution but works for basic pagination demo.
     try {
        // Attempt to get a document reference by ID for pagination cursor
         // This approach is flawed for merging two queries. Reverting to simpler fetch for demo.
         // A proper cursor for merged queries requires more sophisticated logic.
         // For this example, we'll just fetch the first 'limit' documents for simplicity
         // if startAfterDocId is provided, acknowledging this is not true pagination across merges.
        // Instead of using startAfterDocId directly on two queries, we'll fetch the first page for now.
        // A better approach is needed for proper pagination of merged results.
        // For now, if startAfterDocId exists, we won't apply it correctly to both queries simultaneously
        // with standard Firestore pagination methods for 'OR' logic.
        // We'll proceed by fetching without `startAfter` for now and note this limitation.

        // --- Revised approach for demo simplicity ---
        // We will fetch the first 'limit' items from BOTH queries if startAfterDocId is NOT used.
        // If startAfterDocId IS used, this simple merge + limit won't work correctly.
        // A real-world scenario with OR + pagination needs the denormalization approach.
        // For this demo, we'll only support fetching the first page.
        throw new functions.https.HttpsError('unimplemented', 'Pagination across sender/recipient queries is not fully implemented in this demo.');

     } catch (e) {
         throw new functions.https.HttpsError('internal', 'Error processing pagination cursor.');
     }
  }

   try {
        const [senderSnapshot, recipientSnapshot] = await Promise.all([query.get(), query2.get()]);

        const senderTransactions: Transaction[] = senderSnapshot.docs.map(doc => doc.data() as Transaction);
        const recipientTransactions: Transaction[] = recipientSnapshot.docs.map(doc => doc.data() as Transaction);

        // Merge and sort transactions by timestamp (descending)
        const allTransactions = [...senderTransactions, ...recipientTransactions];
        allTransactions.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

        // Apply the limit after merging and sorting
        const transactions = allTransactions.slice(0, limit);

        // Determine hasMore. This is tricky with the merge.
        // If either original query returned 'limit' documents, there might be more.
        // A more accurate check would require fetching one extra document in each original query.
        const hasMore = senderSnapshot.docs.length === limit || recipientSnapshot.docs.length === limit;


        // The lastDocId is also tricky with the merge.
        // For this simple demo, we won't return a meaningful lastDocId for pagination of merged results.
        const lastDocId = transactions.length > 0 ? transactions[transactions.length - 1].transactionId : null;


        return {
            status: 'success',
            transactions: transactions,
            lastDocId: hasMore ? lastDocId : null, // Only return lastDocId if there's a possibility of more
            hasMore: hasMore,
        };

   } catch (error: any) {
       functions.logger.error("Error fetching transaction history:", error);
       throw new functions.https.HttpsError('internal', 'Failed to fetch transaction history.', error);
   }
});