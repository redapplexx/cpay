import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import { auth as adminAuth } from 'firebase-admin'; // Assuming admin SDK is initialized elsewhere

// Define interfaces for payment details and function arguments
interface OnlinePaymentDetails {
  amount: number;
  currency: string;
  paymentMethodType: 'qrph-p2m' | 'ewallet' | 'online-banking' | 'card';
  merchantId: string; // Assuming merchant is identified by their CPay user ID for now
  // Add method-specific details here, e.g.,
  ewalletDetails?: { provider: string; accountId: string };
  onlineBankingDetails?: { bank: string; accountDetails: any };
  cardDetails?: { cardNumber: string; expiryDate: string; cvv: string }; // In a real app, handle card details securely (tokenization)
  // For QRPh P2M, the merchantId might be embedded or passed separately
}

interface InitiateOnlinePaymentData extends OnlinePaymentDetails {}

interface InitiateOnlinePaymentResult {
  status: 'success' | 'pending' | 'failed';
  message: string;
  // Depending on the payment method, might include redirect URLs or next steps
  redirectUrl?: string;
  transactionId?: string;
}

export const initiateOnlinePayment = functions.https.onCall(
  async (data: InitiateOnlinePaymentData, context): Promise<InitiateOnlinePaymentResult> => {
    // 1. Authenticate: Ensure context.auth is valid.
    const userId = context.auth?.uid;
    if (!userId) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    // 2. Validate Input Data
    const { amount, currency, paymentMethodType, merchantId, ...methodDetails } = data;

    if (typeof amount !== 'number' || amount <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid payment amount.');
    }
    if (typeof currency !== 'string' || !['PHP', 'USD', 'KRW'].includes(currency)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid currency.');
    }
    if (typeof paymentMethodType !== 'string' || !['qrph-p2m', 'ewallet', 'online-banking', 'card'].includes(paymentMethodType)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid payment method type.');
    }
    if (typeof merchantId !== 'string' || !merchantId) {
        // In a real app, validate merchantId exists and is a valid merchant
        throw new functions.https.HttpsError('invalid-argument', 'Merchant ID is required.');
    }

    // 3. Check Sender's Balance if paying from CPay wallet (if applicable)
    // For online payments, the source of funds might be outside CPay (card, bank).
    // If paying *from* CPay wallet balance, uncomment and implement this:
    /*
    const userWalletRef = firestore().collection('users').doc(userId).collection('wallets').doc(currency);
    const userWalletDoc = await userWalletRef.get();
    if (!userWalletDoc.exists() || userWalletDoc.data()?.balance < amount) {
        throw new functions.https.HttpsError('failed-precondition', 'Insufficient balance in your CPay wallet.');
    }
    */


    // 4. Simulate Interaction with External Payment Gateway
    let simulatedGatewayResponse: { status: 'success' | 'pending' | 'failed'; gatewayTxnId?: string; redirectUrl?: string } = { status: 'failed' };
    const gatewayTransactionId = `gtw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; // Simulated gateway ID

    try {
        functions.logger.info(`Initiating online payment via ${paymentMethodType} for ${amount} ${currency} to merchant ${merchantId}`);
        // *** Placeholder for actual integration with Payment Gateway API ***
        // The actual logic here would involve calling a third-party payment gateway API
        // and handling their response (e.g., redirecting the user for 3D Secure or
        // payment confirmation, or receiving a webhook notification).

        // Simulate different outcomes based on method type or random chance
        switch (paymentMethodType) {
            case 'qrph-p2m':
            case 'ewallet':
            case 'online-banking':
                // Simulate a pending state requiring user action/redirection
                simulatedGatewayResponse = {
                    status: 'pending',
                    gatewayTxnId: gatewayTransactionId,
                    redirectUrl: `https://simulated-gateway.com/pay?txn=${gatewayTransactionId}&amount=${amount}&user=${userId}` // Example redirect
                };
                break;
            case 'card':
                 // Simulate direct success or a pending 3D secure state
                 // For simplicity, simulate direct success here.
                 simulatedGatewayResponse = {
                    status: Math.random() > 0.1 ? 'success' : 'failed', // 90% success rate simulation
                    gatewayTxnId: gatewayTransactionId,
                 };
                 break;
        }

        // In a real system, if the gateway requires a redirect or webhook, the function
        // would return a pending status and the UI would handle the redirect.
        // A separate webhook endpoint would listen for gateway callbacks to finalize the transaction.

    } catch (error) {
        functions.logger.error("Simulated gateway interaction failed:", error);
        // Log and handle specific gateway errors
        return { status: 'failed', message: 'Payment gateway interaction failed.' };
    }

    // 5. Process Gateway Response (for simulated direct outcomes or initial pending state)
    const batch = firestore().batch();
    const transactionRef = firestore().collection('transactions').doc(); // Generate new transaction ID

    const transactionData = {
        transactionId: transactionRef.id,
        type: 'online-payment',
        method: paymentMethodType,
        amount: amount,
        currency: currency,
        timestamp: firestore.FieldValue.serverTimestamp(),
        senderId: userId, // The user initiating the payment
        recipientId: merchantId, // The merchant receiving the payment
        description: `Online payment for merchant ${merchantId}`,
        status: simulatedGatewayResponse.status === 'success' ? 'Completed' : (simulatedGatewayResponse.status === 'pending' ? 'Pending' : 'Failed'),
        gatewayTxnId: simulatedGatewayResponse.gatewayTxnId,
        // Add other relevant details from the gateway response
    };

    batch.set(transactionRef, transactionData);

    // If payment was successful AND source was CPay wallet, debit sender
    // If payment was successful, credit merchant's CPay balance
    if (simulatedGatewayResponse.status === 'success') {
         // *** Placeholder for updating user/merchant balances ***
         // This would involve fetching current balances, calculating new balances,
         // and updating the user's wallet document (if CPay source) and the merchant's wallet document atomically within this batch/transaction.
         // Example (if crediting merchant's PHP wallet):
         /*
         const merchantWalletRef = firestore().collection('users').doc(merchantId).collection('wallets').doc('PHP'); // Assuming merchant receives in PHP
         batch.update(merchantWalletRef, {
             balance: firestore.FieldValue.increment(amount) // Simple increment, ensure atomicity in a real scenario
         });
         */
    }


    try {
        await batch.commit();

        if (simulatedGatewayResponse.status === 'pending' && simulatedGatewayResponse.redirectUrl) {
             return {
                status: 'pending',
                message: 'Payment initiated. Redirecting for completion.',
                redirectUrl: simulatedGatewayResponse.redirectUrl,
                transactionId: transactionRef.id, // Return internal transaction ID
             };
        } else if (simulatedGatewayResponse.status === 'success') {
             return {
                status: 'success',
                message: 'Payment completed successfully.',
                transactionId: transactionRef.id,
             };
        } else {
             return {
                status: 'failed',
                message: 'Payment failed.',
                transactionId: transactionRef.id,
             };
        }

    } catch (error) {
        functions.logger.error("Firestore batch commit failed:", error);
        // In a real scenario, you might need to reconcile with the payment gateway
        return { status: 'failed', message: 'Failed to record transaction.' };
    }
  }
);