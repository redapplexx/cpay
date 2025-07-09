import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';

// Assume a mechanism for updating user balances exists and is secure
// For example, a helper function called creditUserBalance
async function creditUserBalance(userId: string, amount: number): Promise<void> {
  // Placeholder for actual balance update logic
  // In a real app, this would involve a Firestore transaction
  // to safely increment the user's balance field.
  console.log(`Simulating crediting ${amount} to user ${userId}'s balance.`);
  const userRef = firestore().collection('users').doc(userId);
  // Example: await userRef.update({ balance: firestore.FieldValue.increment(amount) });
}

export const initiateCashIn = functions.https.onCall(async (data, context) => {
  // 1. Authenticate: Ensure context.auth is valid.
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to initiate cash-in.');
  }

  // 2. Validate Input Data
  const { amount, sourceMethod, ...otherDetails } = data;

  if (typeof amount !== 'number' || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Amount must be a positive number.');
  }
  if (typeof sourceMethod !== 'string' || ![
    'ewallet',
    'bank',
    'payout-outlet',
    'voucher',
    'cryptocurrency' // Covers both C-CASH and USDT for now
  ].includes(sourceMethod)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid source method specified.');
  }
  // Add more specific validation based on sourceMethod if needed

  try {
    // 3. Simulate Interaction with External API (e.g., eWallet, Bank Gateway)
    console.log(`Initiating cash-in of ${amount} via ${sourceMethod} for user ${uid}. Details:`, otherDetails);

    // --- Placeholder for External API Interaction ---
    // In a real application, you would call the external payment gateway here.
    // This might involve sending a request and receiving a response or a callback URL.
    // The actual crediting of the user's balance would typically happen
    // asynchronously upon receiving a successful confirmation from the external provider.
    // For this simulation, we'll immediately simulate success and credit the balance.
    switch (sourceMethod) {
      case 'ewallet':
      case 'bank':
        // Simulate interaction with eWallet/Bank gateway API
        await new Promise(resolve => setTimeout(resolve, 1000));
        break;
      case 'payout-outlet':
        // Simulate interaction with payout outlet network API
        await new Promise(resolve => setTimeout(resolve, 1500));
        break;
      case 'voucher':
        // Simulate validation of voucher code and interaction with voucher system
        if (!otherDetails.voucherCode) throw new functions.https.HttpsError('invalid-argument', 'Voucher code is required for voucher cash-in.');
        await new Promise(resolve => setTimeout(resolve, 800));
        break;
      case 'cryptocurrency': // C-CASH, USDT
        // Simulate interaction with cryptocurrency exchange or wallet service
        if (!otherDetails.cryptoDetails) throw new functions.https.HttpsError('invalid-argument', 'Cryptocurrency details are required for crypto cash-in.');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Crypto might take longer
        break;
      default:
        // Should not happen due to validation above, but good practice
        throw new functions.https.HttpsError('internal', 'Unhandled source method.');
    }

    const simulatedExternalSuccess = true; // Assume the external transaction was successful

    if (!simulatedExternalSuccess) {
        // This part would typically be handled by an external webhook or callback function
        // after the payment gateway confirms failure.
        throw new Error('Simulated external cash-in failed.');
    }
    // --- End Placeholder ---

    // 4. Upon Simulated Successful Confirmation: Credit User Balance and Create Transaction
    await creditUserBalance(uid, amount); // Credit the user's balance (placeholder)

    const newTransactionRef = firestore().collection('transactions').doc();
    const transactionId = newTransactionRef.id;

    const transactionData = {
      transactionId: transactionId,
      type: 'cash-in',
      amount: amount,
      currency: 'PHP', // Assuming PHP for Phase 1
      timestamp: firestore.FieldValue.serverTimestamp(),
      description: `Cash-in via ${sourceMethod}`,
      senderId: 'system', // Cash-in is initiated by the user but funds come from external
      recipientId: uid, // The user is the recipient
      sourceMethod: sourceMethod,
      // Include other relevant details from `otherDetails` if necessary
    };

    await newTransactionRef.set(transactionData);

    console.log(`Cash-in transaction ${transactionId} recorded for user ${uid}.`);


    // 5. Return Status
    return {
      status: 'success',
      message: `Cash-in of ${amount} via ${sourceMethod} initiated successfully.`,
      transactionId: transactionId,
      // In a real flow, you might return a redirect URL or a payment ID
      // to the frontend to complete the process.
    };

  } catch (error: any) {
    console.error('Error initiating cash-in:', error);
    throw new functions.https.HttpsError('internal', 'Failed to initiate cash-in.', error.message);
  }
});