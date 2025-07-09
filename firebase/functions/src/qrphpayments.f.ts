import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import { auth } from 'firebase-admin'; // Assuming admin auth is initialized elsewhere

// Placeholder interface for QRPh data - replace with actual structure
interface QRPhData {
  recipientIdentifier: string; // Could be mobile number, account number, etc.
  amount: number;
  // Add other relevant fields from QRPh standard
}

export const processQRPhPayment = functions.https.onCall(async (data: QRPhData, context) => {
  // 1. Authenticate: Ensure context.auth is valid (payer is logged in).
  const payerUid = context.auth?.uid;
  if (!payerUid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to initiate QRPh payment.');
  }

  // 2. Validate Input Data
  if (!data.recipientIdentifier || typeof data.amount !== 'number' || data.amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid QRPh data provided.');
  }

  const amount = data.amount;
  const recipientIdentifier = data.recipientIdentifier;

  const db = firestore();
  const payerRef = db.collection('users').doc(payerUid);

  // 3. Check Payer's Balance (Placeholder - Requires integration with a wallet/balance system)
  // In a real app, you would fetch the payer's balance securely here
  // and check if balance >= amount.
  // For this simulation, we assume sufficient balance.
  console.log(`Simulating balance check for user ${payerUid}. Assuming sufficient funds for amount ${amount}.`);

  // 4. Simulate Interaction with National QRPh System
  // This is a placeholder. In a real implementation, you would
  // call the actual QRPh payment gateway API here.
  console.log(`Simulating QRPh payment initiation to recipient ${recipientIdentifier} for amount ${amount}.`);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

  // Simulate success response from QRPh system
  const simulatedExternalTransactionId = `qrph_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  console.log(`Simulated QRPh payment successful. External ID: ${simulatedExternalTransactionId}`);

  let recipientUid: string | null = null;

  // Attempt to find the recipient UID if the identifier is a known type (e.g., mobile number)
  try {
      // This part depends on how recipientIdentifier is structured and if the recipient
      // is also a CPay user. If it's an external merchant, you'd record their external ID.
      // Assuming recipientIdentifier might be a mobile number for internal CPay users for now.
      const recipientQuerySnapshot = await db.collection('users').where('mobileNumber', '==', recipientIdentifier).limit(1).get();
      if (!recipientQuerySnapshot.empty) {
          recipientUid = recipientQuerySnapshot.docs[0].id;
      } else {
        // Recipient not found in CPay users - likely an external merchant/account
        console.log(`Recipient identifier ${recipientIdentifier} not found as CPay user. Treating as external.`);
        // You might store external recipient info in the transaction record
      }
  } catch (error) {
      console.error("Error looking up recipient by identifier:", error);
      // Continue, as it might be an external recipient
  }


  // 5. Perform Atomic Operations (Debit Payer, Create Transaction)
  // Note: Crediting the recipient might not be an internal balance update
  // if the recipient is an external entity via QRPh.
  // This transaction focuses on the payer's side and the transaction record.
  try {
    await db.runTransaction(async t => {
      // Re-fetch payer to ensure we have the latest data for balance update
      const currentPayerDoc = await t.get(payerRef);
      if (!currentPayerDoc.exists) {
           throw new functions.https.HttpsError('not-found', 'Payer user document not found.');
      }

      const currentBalance = (currentPayerDoc.data() as any)?.balance || 0; // Assuming a 'balance' field

      if (currentBalance < amount) {
         throw new functions.https.HttpsError('failed-precondition', 'Insufficient balance.');
      }

      // Debit payer's balance (Placeholder - assumes balance field exists and is a number)
      t.update(payerRef, { balance: currentBalance - amount });

      // Create transaction record
      const transactionRef = db.collection('transactions').doc();
      t.set(transactionRef, {
        transactionId: transactionRef.id,
        type: 'qrph',
        amount: amount,
        currency: 'PHP', // Assuming PHP for QRPh based on BRD
        timestamp: firestore.FieldValue.serverTimestamp(),
        description: `QRPh Payment to ${recipientIdentifier}`,
        senderId: payerUid,
        recipientId: recipientUid || 'external', // Link to internal UID or mark as external
        externalRefId: simulatedExternalTransactionId, // Store external transaction ID
        status: 'completed', // Or 'pending' if confirmation is async
      });
    });

    return { status: 'success', message: 'QRPh payment processed successfully.' };

  } catch (error: any) {
    console.error("Firestore transaction failed:", error);

    // Depending on the error and the QRPh system, you might need to
    // handle compensation or update transaction status (e.g., 'failed').

    if (error.code === 'failed-precondition') {
         throw error; // Re-throw insufficient balance error
    }

    throw new functions.https.HttpsError('internal', 'An error occurred while processing the payment.', error.message);
  }
});