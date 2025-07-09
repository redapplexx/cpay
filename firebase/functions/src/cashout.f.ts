import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import { auth } from 'firebase-admin';
import * as z from 'zod';

// Define the expected data structure for the request
const CashOutRequestSchema = z.object({
  amount: z.number().positive('Amount must be positive.'),
  destinationMethod: z.enum(['ewallet', 'bank'], {
    errorMap: () => ({ message: 'Invalid destination method.' }),
  }),
  destinationDetails: z.any(), // More specific schema needed based on method
});

const ExpandedCashOutRequestSchema = CashOutRequestSchema.extend({
  destinationMethod: z.enum(['ewallet', 'bank', 'payout-outlet', 'cryptocurrency']),
});

export const initiateCashOut = functions.https.onCall(async (data, context) => {
  // 1. Authenticate: Ensure context.auth is valid.
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  // 2. Validate Input Data
  const validationResult = ExpandedCashOutRequestSchema.safeParse(data);
  if (!validationResult.success) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid input data.', validationResult.error.errors);
  }
  const { amount, destinationMethod, destinationDetails } = validationResult.data;

  const db = firestore();
  const userRef = db.collection('users').doc(uid);

  try {
    // Use a transaction to ensure atomicity for balance check and update
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User document not found.');
      }

      const userData = userDoc.data();
      const currentBalance = userData?.balance || 0; // Assume 'balance' field exists

      // 3. Check for sufficient funds
      if (currentBalance < amount) {
        throw new functions.https.HttpsError('failed-precondition', 'Insufficient funds.');
      }

      // 4. Implement placeholder logic for external payout
      functions.logger.info(`Simulating payout of ${amount} to ${destinationMethod} for user ${uid}`);
      functions.logger.info('Destination Details:', destinationDetails);

      // --- Placeholder logic for expanded cash-out methods ---
      switch (destinationMethod) {
        case 'payout-outlet':
          // Simulate sending instruction to payout outlet network API
          functions.logger.info(`Simulating instruction sent to payout outlet for user ${uid}, amount ${amount}.`);
          break;
        case 'cryptocurrency':
          // Simulate interaction with a crypto exchange/gateway API for withdrawal
          functions.logger.info(`Simulating crypto withdrawal initiated for user ${uid}, amount ${amount}.`);
          break;
        // 'ewallet' and 'bank' handled by previous logic
      }

      // Simulate success or failure of external call (for demo)
      // const externalPayoutSuccess = Math.random() > 0.1; // 90% success rate
      // if (!externalPayoutSuccess) {
      //     throw new functions.https.HttpsError('unavailable', 'External payout service failed.');
      // }

      // 5. Debit user's balance and create transaction record (within the transaction)
      const newBalance = currentBalance - amount;
      transaction.update(userRef, { balance: newBalance });

      const newTransactionRef = db.collection('transactions').doc(); // Let Firestore generate ID
      transaction.set(newTransactionRef, {
        transactionId: newTransactionRef.id,
        type: 'cash-out',
        amount: amount,
        currency: 'PHP', // Assuming PHP based on BRD Phase 1
        timestamp: firestore.FieldValue.serverTimestamp(),
        description: `Cash out to ${destinationMethod}`,
        senderId: uid,
        recipientId: null, // Or a marker indicating external destination
        destinationMethod: destinationMethod,
        destinationDetails: destinationDetails, // Store details for record-keeping
        status: 'completed', // Or 'pending' if confirmation webhook is needed
      });

      functions.logger.info(`Cash out of ${amount} initiated successfully for user ${uid}. New balance: ${newBalance}`);

      return { status: 'success', message: 'Cash out initiated successfully.' };
    });

    return { status: 'success', message: 'Cash out initiated successfully.' };

  } catch (error: any) {
    functions.logger.error('Cash out failed:', error);

    if (error instanceof functions.https.HttpsError) {
        throw error; // Re-throw known HttpsErrors
    }

    // Catch any unexpected errors
    throw new functions.https.HttpsError('internal', 'An unexpected error occurred during cash out.', error.message);
  }
});