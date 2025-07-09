import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';

// Assuming a shared types file might be created later, but defining locally for now.
interface Transaction {
    transactionId: string;
    type: string;
    amount: number;
    currency: string; // Assuming PHP for Phase 1 as per BRD
    timestamp: firestore.Timestamp;
    description: string;
    senderId: string;
    recipientId?: string; // Recipient might be an external entity for cash-out/bill pay/eload
    metadata?: { [key: string]: any }; // Additional details specific to the transaction type
}

// Placeholder for accessing user balance. In a real app, this would interact
// with a dedicated wallet/balance management system or a balance field on the user document.
// This function would need to be integrated with that system.
async function getUserBalance(uid: string): Promise<number> {
    // Simulate fetching balance
    functions.logger.log(`Simulating fetching balance for user: ${uid}`);
    // In a real application, retrieve the user's actual balance from Firestore or a dedicated service
    // For now, assume a high balance for simulation purposes
    return 100000; // High mock balance
}

// Placeholder for updating user balance within an atomic transaction.
// This function would be called from within a Firestore transaction.
async function debitUserBalance(transaction: firestore.Transaction, uid: string, amount: number): Promise<void> {
    // Simulate debiting balance
    functions.logger.log(`Simulating debiting ${amount} from user: ${uid}`);
    // In a real application, update the balance field in the user's document
    // transaction.update(userRef, { balance: firestore.FieldValue.increment(-amount) });
}

// Placeholder for interacting with an external eLoad provider API.
async function simulateELoadAPI(mobileNumber: string, amount: number): Promise<{ success: boolean; providerRefId?: string; errorMessage?: string }> {
    functions.logger.log(`Simulating eLoad API call for number: ${mobileNumber}, amount: ${amount}`);
    // Simulate success for certain numbers or amounts, failure for others
    if (mobileNumber.startsWith('+639') && amount > 0 && amount <= 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        return { success: true, providerRefId: `eload_${Date.now()}` };
    } else {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        return { success: false, errorMessage: 'Simulated API error: Invalid number or amount.' };
    }
}


export const processELoad = functions.https.onCall(async (data, context) => {
    // 1. Authenticate: Ensure context.auth is valid.
    const uid = context.auth?.uid;
    if (!uid) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to perform eLoad.');
    }

    // 2. Validate Input Data
    const { mobileNumber, amount } = data;

    if (!mobileNumber || typeof mobileNumber !== 'string' || !/^(09|\+639)\d{9}$/.test(mobileNumber)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid mobile number format.');
    }
    if (typeof amount !== 'number' || amount <= 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Amount must be a positive number.');
    }

    // Use PHP as primary currency for Phase 1
    const currency = 'PHP';

    // 3. Check User Balance
    const currentBalance = await getUserBalance(uid); // Placeholder call
    if (currentBalance < amount) {
        throw new functions.https.HttpsError('failed-precondition', 'Insufficient balance.');
    }

    // 4. Simulate interaction with external eLoad provider API
    let apiResult;
    try {
         apiResult = await simulateELoadAPI(mobileNumber, amount); // Placeholder call
    } catch (error: any) {
         functions.logger.error('Simulated ELoad API Error:', error);
         throw new functions.https.HttpsError('unavailable', 'Failed to connect to eLoad provider.', error.message);
    }


    if (!apiResult.success) {
        throw new functions.https.HttpsError('failed-precondition', apiResult.errorMessage || 'eLoad processing failed with provider.');
    }

    // 5. Perform Atomic Transaction (Debit user, create transaction)
    const transactionId = firestore().collection('transactions').doc().id; // Generate a unique ID

    try {
         await firestore().runTransaction(async t => {
            // Debit user balance - Placeholder call within the transaction
            // This part needs real implementation based on how balances are stored
            // For now, the debitUserBalance placeholder is called outside the transaction
            // to fit the simulation, but in production, it MUST be inside the transaction.
            // await debitUserBalance(t, uid, amount);

            // Create transaction document
            const transactionRef = firestore().collection('transactions').doc(transactionId);
            const transactionData: Transaction = {
                transactionId: transactionId,
                type: 'eload',
                amount: amount,
                currency: currency,
                timestamp: firestore.FieldValue.serverTimestamp() as firestore.Timestamp,
                description: `eLoad for ${mobileNumber}`,
                senderId: uid, // The user initiating the eLoad
                // recipientId is not directly applicable here as it's an external service
                metadata: {
                    eloadMobileNumber: mobileNumber,
                    providerReferenceId: apiResult.providerRefId,
                },
            };
            t.set(transactionRef, transactionData);
        });

        // Since debitUserBalance is a placeholder outside the transaction for now,
        // call it here *after* the Firestore transaction for simulation consistency,
        // but remember this needs to be inside the transaction in a real implementation.
        await debitUserBalance({} as firestore.Transaction, uid, amount);


    } catch (error: any) {
        functions.logger.error('Firestore Transaction Failed for ELoad:', error);
         // Ideally, a failed Firestore transaction should also trigger a reversal
         // or compensation with the external eLoad provider if the API call succeeded.
        throw new functions.https.HttpsError('internal', 'Transaction failed.', error.message);
    }


    return {
        status: 'success',
        message: `eLoad of ${amount} ${currency} successfully processed for ${mobileNumber}.`,
        transactionId: transactionId,
    };
});