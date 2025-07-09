import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import { z } from 'zod';

// Assuming merchant balances are stored in the 'users' collection for now, linked by UID.
// In a real system, merchants might have a separate collection or more complex balance management.
const usersCollection = firestore().collection('users');
const transactionsCollection = firestore().collection('transactions');

const processStaticMerchantQR PaymentSchema = z.object({
  qrCodeData: z.string().min(1, 'QR code data is required.'), // Assuming QR data is a string
  amount: z.number().positive('Amount must be positive.'),
});

export const processStaticMerchantQR Payment = functions.https.onCall(async (data, context) => {
  // 1. Authenticate: Ensure context.auth is valid.
  const payerUid = context.auth.uid;
  if (!payerUid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to make a payment.');
  }

  // 2. Validate Input Data
  try {
    processStaticMerchantQR PaymentSchema.parse(data);
  } catch (error: any) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid input data.', error.errors);
  }

  const { qrCodeData, amount } = data;

  // 3. Parse QR Code Data (Placeholder Logic)
  let merchantId: string;
  try {
    // In a real scenario, parse the QR code data format (e.g., JSON, URL)
    // and extract the merchant ID.
    // For this placeholder, assume the qrCodeData is directly the merchantId string.
    merchantId = qrCodeData.trim();
    if (!merchantId) {
        throw new Error("Merchant ID not found in QR data.");
    }
     // Basic check: Merchant ID shouldn't be the same as payer ID
     if (merchantId === payerUid) {
        throw new functions.https.HttpsError('invalid-argument', 'Cannot pay yourself.');
     }
  } catch (error: any) {
      throw new functions.https.HttpsError('invalid-argument', `Failed to parse QR code data: ${error.message}`);
  }


  // 4. Validate Merchant Exists
  const merchantRef = usersCollection.doc(merchantId);
  const merchantDoc = await merchantRef.get();
  if (!merchantDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Merchant not found.');
  }

  // 5. Perform Transaction Atomically
  try {
    await firestore().runTransaction(async (transaction) => {
      const payerRef = usersCollection.doc(payerUid);
      const payerDoc = await transaction.get(payerRef);

      if (!payerDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Payer user document not found during transaction.');
      }

      const payerData = payerDoc.data();
      const payerBalance = payerData?.balance || 0; // Assuming balance field exists

      if (payerBalance < amount) {
        throw new functions.https.HttpsError('failed-precondition', 'Insufficient balance.');
      }

      // Debit payer
      transaction.update(payerRef, { balance: payerBalance - amount });

      // Credit merchant
      const merchantData = merchantDoc.data();
      const merchantBalance = merchantData?.balance || 0; // Assuming balance field exists
      transaction.update(merchantRef, { balance: merchantBalance + amount });

      // Create transaction record
      const newTransactionRef = transactionsCollection.doc(); // Firestore generates a unique ID
      const newTransaction: Omit<Transaction, 'transactionId'> = { // Use Omit if Transaction interface includes transactionId
        type: 'qr-merchant-static',
        amount: amount,
        currency: 'PHP', // Assuming PHP for Phase 1 as per BRD
        timestamp: firestore.FieldValue.serverTimestamp() as Timestamp,
        description: `Payment to merchant ${merchantId}`, // More descriptive later
        senderId: payerUid,
        recipientId: merchantId,
        // Add any other relevant fields from Transaction interface
        // e.g., status: 'completed'
      };
       transaction.set(newTransactionRef, newTransaction);
    });

    return { status: 'success', message: 'Payment to merchant successful.' };

  } catch (error: any) {
    functions.logger.error("Merchant QR Payment Transaction Failed:", error);
    if (error.code) {
         // If it's an HttpsError already, re-throw it
        throw error;
    }
    // Otherwise, throw a generic internal error
    throw new functions.https.HttpsError('internal', 'An error occurred while processing the payment.', error);
  }
});

// Basic Transaction Interface (should ideally be in a shared types file)
// Defined here to avoid dependency issues in this single file creation
interface Transaction {
  transactionId: string; // Assuming transactionId is part of the document data
  type: string;
  amount: number;
  currency: string;
  timestamp: firestore.Timestamp;
  description: string;
  senderId: string;
  recipientId: string;
  // Add other potential transaction fields as per your schema
  // status: 'pending' | 'completed' | 'failed';
  // fee?: number;
}