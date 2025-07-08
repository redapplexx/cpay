// backend/functions/src/admin/transactionManagement.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';

// Initialize admin if not already done
try { admin.initializeApp(); } catch (e) {}

const db = admin.firestore();

/**
 * Ensures the caller is an authenticated admin.
 */
const ensureAdmin = async (context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
  }
  const user = await admin.auth().getUser(context.auth.uid);
  if (user.customClaims?.role !== 'ADMIN') {
    throw new functions.https.HttpsError('permission-denied', 'You must be an administrator.');
  }
};

const transactionListSchema = z.object({
    // Add optional filters for searching
    userId: z.string().optional(),
    transactionId: z.string().optional(),
    status: z.string().optional(),
    // We could add date ranges, transaction types etc.
});

/**
 * Cloud Function for admins to list and filter all platform transactions.
 */
export const adminListTransactions = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    
    const filters = transactionListSchema.parse(data);
    
    try {
        let query: admin.firestore.Query = db.collection('transactions');

        // Apply filters to the query
        if (filters.userId) {
            // This is complex because a user can be a sender or a receiver.
            // For a robust solution, you might need a different data structure 
            // (like an array of participants) or to query both fields, which is complex.
            // For this example, we'll assume a 'participants' array field exists on the doc.
            // e.g., query = query.where('participants', 'array-contains', filters.userId);
            // As a simpler fallback, let's just log this limitation.
            console.log(`Searching by userId is complex and not fully implemented in this example. Consider searching by senderId or recipientId, or denormalizing data.`);
        }
        if (filters.status) {
            query = query.where('status', '==', filters.status);
        }

        // Always order by date for consistent results
        query = query.orderBy('date', 'desc').limit(50); // Add pagination later

        const snapshot = await query.get();
        const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return transactions;
    } catch (error: any) {
        console.error('Error listing transactions:', error);
        throw new functions.https.HttpsError('internal', 'Failed to list transactions.', error.message);
    }
});
