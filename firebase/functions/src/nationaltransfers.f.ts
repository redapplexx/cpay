import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import { getAuthenticatedUser } from './utils'; // Assuming a utility to get user data

// Define the structure for national transfer data
interface NationalTransferData {
  recipientBank: string;
  recipientAccountNumber: string;
  amount: number;
  notes?: string;
}

// Assume a function to safely debit user balance (implementation needed)
async function debitUserBalance(userId: string, amount: number): Promise<void> {
  // Placeholder: Implement actual balance update logic within a transaction
  // Check balance, then debit. Throw error if insufficient funds.
  console.log(`Simulating debit of ${amount} for user ${userId}`);
  // Example: await firestore().runTransaction(async (transaction) => { ... });
}

export const initiateInstaPayTransfer = functions.https.onCall(async (data: NationalTransferData, context) => {
  const user = await getAuthenticatedUser(context); // Get authenticated user UID

  const { recipientBank, recipientAccountNumber, amount, notes } = data;

  // 1. Validate Input Data
  if (typeof amount !== 'number' || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Amount must be a positive number.');
  }
  if (!recipientBank || !recipientAccountNumber) {
    throw new functions.https.HttpsError('invalid-argument', 'Recipient bank and account number are required.');
  }

  // 2. Check Sender Balance (Placeholder - implement actual check)
  // try {
  //   await checkUserBalance(user.uid, amount); // Assuming checkUserBalance exists
  // } catch (error: any) {
  //   throw new functions.https.HttpsError('failed-precondition', error.message);
  // }

  // 3. Simulate InstaPay Network Interaction
  console.log(`Simulating InstaPay transfer from ${user.uid} to ${recipientAccountNumber} at ${recipientBank} for ${amount}`);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

  // Simulate a potential failure (e.g., 10% chance)
  // if (Math.random() < 0.1) {
  //     await new Promise(reject => setTimeout(() => reject(new Error('Simulated InstaPay network error')), 500));
  // }


  // 4. Perform Atomic Operations (Debit and Record Transaction)
  try {
    // Debit sender's balance (Placeholder - integrate with actual balance logic)
    await debitUserBalance(user.uid, amount);

    // Record transaction
    const transactionRef = firestore().collection('transactions').doc();
    await transactionRef.set({
      transactionId: transactionRef.id,
      type: 'instapay',
      amount: amount,
      currency: 'PHP', // Assuming PHP for domestic transfers
      timestamp: firestore.FieldValue.serverTimestamp(),
      description: notes || `InstaPay transfer to ${recipientAccountNumber}`,
      senderId: user.uid,
      recipientId: `instapay:${recipientAccountNumber}`, // Identifier for external recipient
      status: 'completed', // Or 'pending', 'failed' based on simulation/API response
      // Add specific fields for national transfers if needed
      recipientBank: recipientBank,
      recipientAccountNumber: recipientAccountNumber,
    });

    return { status: 'success', message: 'InstaPay transfer initiated successfully.' };

  } catch (error: any) {
    console.error('InstaPay transfer failed:', error);
    // If debit fails, rollback or handle consistency (this needs careful implementation)
    // If transaction record fails after debit, a compensation/reversal is needed.
    throw new functions.https.HttpsError('internal', 'InstaPay transfer processing failed.', error.message);
  }
});

export const initiatePesoNETTransfer = functions.https.onCall(async (data: NationalTransferData, context) => {
    const user = await getAuthenticatedUser(context); // Get authenticated user UID

    const { recipientBank, recipientAccountNumber, amount, notes } = data;

    // 1. Validate Input Data
    if (typeof amount !== 'number' || amount <= 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Amount must be a positive number.');
    }
     if (!recipientBank || !recipientAccountNumber) {
        throw new functions.https.HttpsError('invalid-argument', 'Recipient bank and account number are required.');
    }

    // 2. Check Sender Balance (Placeholder - implement actual check)
    // try {
    //   await checkUserBalance(user.uid, amount); // Assuming checkUserBalance exists
    // } catch (error: any) {
    //   throw new functions.https.HttpsError('failed-precondition', error.message);
    // }

    // 3. Simulate PesoNET Network Interaction
    // PesoNET is typically batch-processed, so simulation might be different (e.g., status 'pending')
    console.log(`Simulating PesoNET transfer from ${user.uid} to ${recipientAccountNumber} at ${recipientBank} for ${amount}`);
     await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate batch processing delay


    // 4. Perform Atomic Operations (Debit and Record Transaction)
    try {
        // Debit sender's balance (Placeholder - integrate with actual balance logic)
        await debitUserBalance(user.uid, amount);

        // Record transaction
        const transactionRef = firestore().collection('transactions').doc();
        await transactionRef.set({
            transactionId: transactionRef.id,
            type: 'pesonet',
            amount: amount,
            currency: 'PHP', // Assuming PHP for domestic transfers
            timestamp: firestore.FieldValue.serverTimestamp(),
            description: notes || `PesoNET transfer to ${recipientAccountNumber}`,
            senderId: user.uid,
            recipientId: `pesonet:${recipientAccountNumber}`, // Identifier for external recipient
            status: 'pending', // PesoNET is often pending until batch settlement
            // Add specific fields for national transfers if needed
            recipientBank: recipientBank,
            recipientAccountNumber: recipientAccountNumber,
        });

        return { status: 'pending', message: 'PesoNET transfer initiated. Processing in batch.' };

    } catch (error: any) {
        console.error('PesoNET transfer failed:', error);
         // If debit fails, rollback or handle consistency
        // If transaction record fails after debit, compensation/reversal needed.
        throw new functions.https.HttpsError('internal', 'PesoNET transfer processing failed.', error.message);
    }
});

// Placeholder utility (replace with your actual user fetching logic)
async function getAuthenticatedUser(context: functions.https.CallableContext): Promise<{ uid: string }> {
    if (!context.auth || !context.auth.uid) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    // In a real app, you might fetch more user details from Firestore here
    // const userDoc = await firestore().collection('users').doc(context.auth.uid).get();
    // if (!userDoc.exists) {
    //     throw new functions.https.HttpsError('not-found', 'Authenticated user not found in database.');
    // }
    // return { uid: context.auth.uid, ...userDoc.data() as any }; // Return user details
     return { uid: context.auth.uid }; // Return just UID for now
}