import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';

// Define the structure for biller details (example)
interface BillerDetails {
  billerId: string;
  accountNumber: string;
  // Add other fields as required by specific billers
}

export const processBillPayment = functions.https.onCall(async (data, context) => {
  // 1. Authenticate: Ensure context.auth is valid.
  const uid = context.auth.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const { billerDetails, amount } = data as { billerDetails: BillerDetails; amount: number };

  // 2. Validate Input Data
  if (!billerDetails || !billerDetails.billerId || !billerDetails.accountNumber || typeof amount !== 'number' || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid biller details or amount.');
  }

  // 3. Check User Balance (Placeholder)
  // In a real application, retrieve the user's balance from Firestore
  // const userRef = firestore().collection('users').doc(uid);
  // const userDoc = await userRef.get();
  // const currentBalance = userDoc.data()?.balance || 0;
  // if (currentBalance < amount) {
  //   throw new functions.https.HttpsError('failed-precondition', 'Insufficient balance.');
  // }
  functions.logger.info(`Simulating balance check for user ${uid}. Amount: ${amount}`);


  // 4. Simulate Interaction with External Biller API (Placeholder)
  functions.logger.info(`Simulating bill payment to biller ${billerDetails.billerId} for account ${billerDetails.accountNumber} with amount ${amount}`);

  // Simulate a delay for the external API call
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simulate a success or failure based on some condition (e.g., random chance, or specific input)
  const simulatedSuccess = Math.random() > 0.1; // 90% success rate for demo

  if (!simulatedSuccess) {
      functions.logger.error('Simulated external biller API failure.');
       throw new functions.https.HttpsError('internal', 'Failed to process bill payment with external biller.');
  }

  // 5. Perform Atomic Transaction (Update balance and create transaction record)
  // Use a Firestore transaction to ensure atomicity
   try {
      await firestore().runTransaction(async (transaction) => {
        // In a real application, read the user's document within the transaction
        // const userRef = firestore().collection('users').doc(uid);
        // const userDoc = await transaction.get(userRef);
        // const currentBalance = userDoc.data()?.balance || 0;

        // // Double-check balance in case it changed since the initial check (important for transactions)
        // if (currentBalance < amount) {
        //     throw new functions.https.HttpsError('failed-precondition', 'Insufficient balance during transaction.');
        // }

        // // Debit the user's balance
        // const newBalance = currentBalance - amount;
        // transaction.update(userRef, { balance: newBalance });

         // Create a new transaction document
        const newTransactionRef = firestore().collection('transactions').doc(); // Auto-generate ID
        const transactionData = {
          transactionId: newTransactionRef.id,
          type: 'bill-payment',
          amount: amount,
          currency: 'PHP', // Assuming PHP for Phase 1 bills payment
          timestamp: firestore.FieldValue.serverTimestamp(),
          description: `Payment to biller ${billerDetails.billerId} for account ${billerDetails.accountNumber}`,
          senderId: uid,
          recipientId: billerDetails.billerId, // Use biller ID as recipient for tracking
          status: 'completed', // Or 'pending' if external confirmation is async
          // Add other relevant fields
        };
        transaction.set(newTransactionRef, transactionData);
      });

      functions.logger.info(`Bill payment processed successfully for user ${uid}.`);
      return { status: 'success', message: 'Bill payment processed successfully.' };

   } catch (error: any) {
       functions.logger.error('Firestore transaction failed:', error);
        if (error.code === 'failed-precondition') {
             throw error; // Re-throw insufficient balance error
        }
       throw new functions.https.HttpsError('internal', 'An error occurred while processing the bill payment.');
   }
});