import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import { z } from 'zod';

// Define the expected structure of QR code data (for a closed-loop system)
const qrCodeDataSchema = z.object({
  recipientId: z.string().min(1, 'Recipient ID is required in QR code data.'),
  amount: z.number().positive('Amount must be a positive number.'),
  // Add other potential fields from your QR data if necessary
});

export const processClosedLoopQRPayment = functions.https.onCall(async (data, context) => {
  // 1. Authenticate the payer
  const payerId = context.auth?.uid;
  if (!payerId) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to process QR payment.');
  }

  // 2. Validate input QR code data
  let qrData;
  try {
    qrData = qrCodeDataSchema.parse(data.qrCodeData);
  } catch (error: any) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid QR code data provided.', error.errors);
  }

  const { recipientId, amount } = qrData;

  // Prevent sending money to self
  if (payerId === recipientId) {
      throw new functions.https.HttpsError('invalid-argument', 'Cannot send money to yourself.');
  }

  const db = firestore();
  const payerRef = db.collection('users').doc(payerId);
  const recipientRef = db.collection('users').doc(recipientId);

  // Use a transaction to ensure atomicity of balance updates and transaction record
  try {
    await db.runTransaction(async (transaction) => {
      const payerDoc = await transaction.get(payerRef);
      const recipientDoc = await transaction.get(recipientRef);

      // 3. Check if recipient exists
      if (!recipientDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Recipient user not found.');
      }

      const payerData = payerDoc.data();
      // Assuming balance is stored in the user document. Adjust path if necessary.
      const payerBalance = payerData?.balance || 0;

      // 4. Check payer's balance
      if (payerBalance < amount) {
        throw new functions.https.HttpsError('failed-precondition', 'Insufficient balance.');
      }

      // 5. Perform balance updates and create transaction record within the transaction
      const newPayerBalance = payerBalance - amount;
      const recipientBalance = recipientDoc.data()?.balance || 0; // Assuming recipient also has a balance field
      const newRecipientBalance = recipientBalance + amount;

      transaction.update(payerRef, { balance: newPayerBalance });
      transaction.update(recipientRef, { balance: newRecipientBalance });

      // Create transaction ledger entry
      const newTransactionRef = db.collection('transactions').doc(); // Let Firestore auto-generate ID
      transaction.set(newTransactionRef, {
        transactionId: newTransactionRef.id,
        type: 'qr-closed-loop',
        amount: amount,
        currency: 'PHP', // Assuming PHP as primary currency for Phase 1
        timestamp: firestore.FieldValue.serverTimestamp(),
        description: `QR Payment to ${recipientDoc.data()?.profile?.fullName || 'User'}`, // Customize description
        senderId: payerId,
        recipientId: recipientId,
        status: 'completed', // Or 'pending'/'processing' depending on complexity
      });
    });

    // Transaction completed successfully
    return { status: 'success', message: 'QR payment processed successfully.' };

  } catch (error: any) {
    // Handle errors from the transaction (insufficient balance, recipient not found, etc.)
    if (error.code) {
       throw error; // Re-throw HttpsError
    }
    console.error('Error processing QR payment:', error);
    throw new functions.https.HttpsError('internal', 'Failed to process QR payment.', error);
  }
});