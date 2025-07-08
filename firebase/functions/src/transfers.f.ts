import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { firestore, apps } from 'firebase-admin';
// Import necessary libraries for OTP generation (e.g., speakeasy or a simple library)
// Import necessary libraries for SMS sending (e.g., Twilio, Vonage, or a local provider SDK)
import { generateSecret, hotp, totp } from 'speakeasy'; // Example OTP library

// Initialize Firestore if not already done
if (!apps.length) {
  admin.initializeApp();
}
const db = admin.firestore(); // Use the default app's firestore

// Define the interface for a transaction document (can be moved to a shared types file later)
interface Transaction {
  transactionId: string; // Unique ID for the transaction
  type: 'p2p' | 'cash-in' | 'cash-out' | 'bill-payment' | 'eload' | 'qr-payment' | 'remittance' | 'transfer'; // Type of transaction
  amount: number; // Transaction amount
  currency: string; // Currency (e.g., 'PHP')
  timestamp: admin.firestore.Timestamp; // Server timestamp
  description: string; // Transaction description
  senderId: string; // UID of the sender
  recipientId: string; // UID of the recipient
  status: 'pending' | 'completed' | 'failed' | 'reversed'; // Transaction status
  // Add other relevant fields like fees, reference numbers, etc. as needed
  otpSecret?: string; // Store OTP secret for verification (for pending transfers)
  otpGeneratedAt?: admin.firestore.Timestamp; // Timestamp when OTP was generated
}

// Define the interface for a user document (can be moved to a shared types file later)
interface User {
    uid: string;
    mobileNumber: string;
    profile: {
      fullName: string;
      birthDate: admin.firestore.Timestamp; // Assuming Timestamp is used
    };
    kycStatus: 'NOT_STARTED' | 'PENDING' | 'VERIFIED';
    createdAt: admin.firestore.Timestamp; // Assuming Timestamp is used
    // Add wallet balance field - Placeholder for now
    // balance: {
    //   PHP: number;
    //   // Add other currencies as needed for Phase 2
    // };
}


// Placeholder function to send an SMS (replace with actual SMS gateway integration)
async function sendOtpSms(mobileNumber: string, otpCode: string): Promise<void> {
    functions.logger.info(`Sending OTP ${otpCode} to ${mobileNumber}`);
    // Actual implementation would use an SMS gateway SDK (e.g., Twilio, Vonage, etc.)
    // Example using a placeholder:
    // try {
    //     const smsResult = await yourSmsGateway.send({
    //         to: mobileNumber,
    //         body: `Your CPay verification code is: ${otpCode}. This code is valid for a short time.`,
    //     });
    //     functions.logger.info('SMS sent successfully:', smsResult);
    // } catch (error) {
    //     functions.logger.error('Failed to send SMS:', error);
    //     // Depending on requirements, you might throw an error or log and continue
    //     throw new functions.https.HttpsError('internal', 'Failed to send verification code.');
    // }
}

// Placeholder for storing and retrieving pending transfer requests
// In a real system, this might be a dedicated collection in Firestore with a TTL
const pendingTransfers = new Map<string, { transactionData: any, otpSecret: string, otpGeneratedAt: admin.firestore.Timestamp, senderUid: string }>();
const OTP_VALIDITY_SECONDS = 300; // OTP valid for 5 minutes


export const initiateP2PTransfer = functions.https.onCall(async (data, context) => {
  // 1. Authenticate: Ensure context.auth is valid and get sender UID.
  const senderUid = context.auth?.uid;
  if (!senderUid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to initiate a transfer.');
  }

  // 2. Validate Input Data
  const { recipientMobileNumber, amount } = data;

  if (!recipientMobileNumber || typeof recipientMobileNumber !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Recipient mobile number is required.');
  }
  if (typeof amount !== 'number' || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Amount must be a positive number.');
  }

  // In a real application, you would also validate the mobile number format
  // if (!/^(09|\+639)\d{9}$/.test(recipientMobileNumber)) {
  //     throw new functions.https.HttpsError('invalid-argument', 'Invalid recipient mobile number format.');
  // }


  // Generate a unique identifier for this pending transfer request
  const pendingTransferId = db.collection('pendingTransfers').doc().id; // Using a doc ID for uniqueness

  // 3. Validate Sender Balance (perform this check before generating OTP)
  const senderDocRef = db.collection('users').doc(senderUid);
  const senderDoc = await senderDocRef.get();

  if (!senderDoc.exists) {
    throw new functions.https.HttpsError('internal', 'Sender user document not found.');
  }

  const senderData = senderDoc.data() as User;
  // Check sender's balance (PLACEHOLDER: Access the actual balance field)
  // Assuming a `balance` field exists with currency subfields like `PHP`
  const senderCurrentBalancePHP = (senderData as any).wallets?.PHP?.balance || 0;

  if (senderCurrentBalancePHP < amount) {
    throw new functions.https.HttpsError('failed-precondition', 'Insufficient balance.');
  }

  // 4. Find Recipient UID and Mobile Number
  const recipientQuerySnapshot = await db.collection('users').where('mobileNumber', '==', recipientMobileNumber).limit(1).get();

  if (recipientQuerySnapshot.empty) {
    throw new functions.https.HttpsError('not-found', 'Recipient not found.');
  }

  const recipientDoc = recipientQuerySnapshot.docs[0];
  const recipientUid = recipientDoc.id; // Use document ID as UID

  // Prevent sending money to self (optional, but good practice)
  if (senderUid === recipientUid) {
    throw new functions.https.HttpsError('invalid-argument', 'Cannot send money to yourself.');
  }

  const recipientData = recipientDoc.data() as User;
  const recipientActualMobileNumber = recipientData.mobileNumber; // Get the stored mobile number

  // 5. Generate OTP
  // Generate a random secret for this OTP
  const otpSecret = generateSecret({ length: 20 });

  // Generate the OTP code (using HOTP for simplicity, or TOTP if time-based is preferred)
  // For HOTP, you would need a counter. Let's use TOTP based on current time for simplicity.
  const otpCode = totp({
    secret: otpSecret,
    encoding: 'base32',
    step: 60, // OTP changes every 60 seconds
    window: 1, // Allow a window of 1 step around the current time
  });

  // 6. Send OTP via SMS to the sender's registered mobile number
  // Get sender's mobile number from their user document
  const senderActualMobileNumber = senderData.mobileNumber; // Assuming mobileNumber is stored in the user document

  if (!senderActualMobileNumber) {
      throw new functions.https.HttpsError('internal', 'Sender mobile number not found.');
  }

  try {
      await sendOtpSms(senderActualMobileNumber, otpCode);
  } catch (error) {
      // If SMS sending fails, abort the initiation and inform the user
      throw error; // sendOtpSms already throws HttpsError
  }

  // 7. Store the pending transfer details securely (e.g., in a temporary collection with TTL)
  // For this example, we'll use a Map in memory (NOT suitable for production in Cloud Functions)
  // PRODUCTION NOTE: Use a dedicated Firestore collection (e.g., 'pending_otp_verifications') with a TTL
  // and index on a `createdAt` field to automatically clean up expired entries.
  const otpGeneratedAt = admin.firestore.Timestamp.now();
  pendingTransfers.set(pendingTransferId, {
      transactionData: { amount, recipientUid, recipientMobileNumber, type: 'p2p' },
      otpSecret: otpSecret,
      otpGeneratedAt: otpGeneratedAt,
      senderUid: senderUid,
  });

  // In a production Firestore-based pending_otp_verifications collection:
  // await db.collection('pending_otp_verifications').doc(pendingTransferId).set({
  //     senderUid: senderUid,
  //     otpSecret: otpSecret,
  //     otpGeneratedAt: otpGeneratedAt,
  //     transactionDetails: { // Store minimal necessary details for the confirmation step
  //          type: 'p2p',
  //          amount: amount,
  //          currency: 'PHP',
  //          recipientUid: recipientUid,
  //          recipientMobileNumber: recipientMobileNumber,
  //     },
  //     createdAt: admin.firestore.FieldValue.serverTimestamp(), // For TTL
  // });


  // 8. Return the pending transfer ID to the frontend
  return {
      status: 'otp_sent',
      message: 'A verification code has been sent to your mobile number.',
      pendingTransferId: pendingTransferId, // Frontend needs this to confirm
  };

});

// New function to confirm the transfer with OTP
export const confirmFundTransferWithOtp = functions.https.onCall(async (data, context) => {
    // 1. Authenticate: Ensure context.auth is valid.
    const senderUid = context.auth?.uid;
    if (!senderUid) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to confirm a transfer.');
    }

    // 2. Validate Input Data
    const { pendingTransferId, otpCode } = data;

    if (!pendingTransferId || typeof pendingTransferId !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'Pending transfer ID is required.');
    }
    if (!otpCode || typeof otpCode !== 'string' || otpCode.length !== 6) { // Assuming a 6-digit OTP
        throw new functions.https.HttpsError('invalid-argument', 'A valid 6-digit OTP code is required.');
    }

    // 3. Retrieve Pending Transfer Details
    // PRODUCTION NOTE: Retrieve from your Firestore 'pending_otp_verifications' collection
    const pending = pendingTransfers.get(pendingTransferId);
    // const pendingDoc = await db.collection('pending_otp_verifications').doc(pendingTransferId).get();

    // Check if pending transfer exists and belongs to the sender
    if (!pending || pending.senderUid !== senderUid) {
        // if (!pendingDoc.exists || pendingDoc.data()?.senderUid !== senderUid) {
        throw new functions.https.HttpsError('failed-precondition', 'Insufficient balance.');
    }

    // PRODUCTION NOTE: Access data from the Firestore doc
    // const pendingData = pendingDoc.data() as { otpSecret: string, otpGeneratedAt: admin.firestore.Timestamp, transactionDetails: any };
    const pendingData = pending; // Using the Map data for this example
    const { otpSecret, otpGeneratedAt, transactionData } = pendingData;

    // 4. Verify OTP Validity Period
    const now = admin.firestore.Timestamp.now().toDate();
    const generatedTime = otpGeneratedAt.toDate();
    const timeDiffSeconds = (now.getTime() - generatedTime.getTime()) / 1000;

    if (timeDiffSeconds > OTP_VALIDITY_SECONDS) {
        // Clean up expired pending transfer
        pendingTransfers.delete(pendingTransferId);
        // await db.collection('pending_otp_verifications').doc(pendingTransferId).delete();
        throw new functions.https.HttpsError('expired', 'Verification code has expired.');
    }

    // 5. Verify OTP Code
    const isOtpValid = totp.verify({
        secret: otpSecret,
        encoding: 'base32',
        token: otpCode,
        step: 60,
        window: 1,
    });

    if (!isOtpValid) {
        // PRODUCTION NOTE: Implement rate limiting for failed OTP attempts
        throw new functions.https.HttpsError('permission-denied', 'Invalid verification code.');
    }

    // 6. OTP is valid - Execute the actual transfer transaction
    const { amount, recipientUid, recipientMobileNumber, type } = transactionData; // Extract transaction details

    try {
        await db.runTransaction(async (transaction) => {
            const senderDocRef = db.collection('users').doc(senderUid);
            const recipientDocRef = db.collection('users').doc(recipientUid);

            // Fetch sender and recipient documents within the transaction
            const [senderDocInTxn, recipientDocInTxn] = await transaction.getAll(senderDocRef, recipientDocRef);

            if (!senderDocInTxn.exists) {
                throw new functions.https.HttpsError('internal', 'Sender user document not found during transaction.');
            }
            if (!recipientDocInTxn.exists) {
                 // This might happen if recipient account was deleted between initiation and confirmation
                 throw new functions.https.HttpsError('not-found', 'Recipient user document not found during transaction.');
            }

            const senderDataInTxn = senderDocInTxn.data() as User;
            const recipientDataInTxn = recipientDocInTxn.data() as User;

            // Re-check sender balance within the transaction for safety
            const senderCurrentBalancePHP = (senderDataInTxn as any).wallets?.PHP?.balance || 0;
            if (senderCurrentBalancePHP < amount) {
                throw new functions.https.HttpsError('failed-precondition', 'Insufficient balance (checked during confirmation).');
            }

            // Debit sender's balance
            const newSenderBalancePHP = senderCurrentBalancePHP - amount;
            transaction.update(senderDocRef, { 'wallets.PHP.balance': newSenderBalancePHP });

            // Credit recipient's balance
            const recipientCurrentBalancePHP = (recipientDataInTxn as any).wallets?.PHP?.balance || 0;
            const newRecipientBalancePHP = recipientCurrentBalancePHP + amount;
            transaction.update(recipientDocRef, { 'wallets.PHP.balance': newRecipientBalancePHP });

            // Create a transaction ledger entry
            const transactionRef = db.collection('transactions').doc();
            const newTransaction: Transaction = {
                transactionId: transactionRef.id,
                type: type as any, // Use the type from pending data ('p2p', 'transfer')
                amount: amount,
                currency: 'PHP', // Assuming PHP for these transfers
                timestamp: admin.firestore.Timestamp.now(),
                description: type === 'p2p' ? `P2P transfer to ${recipientMobileNumber}` : `National transfer`, // Customize description
                senderId: senderUid,
                recipientId: recipientUid, // Recipient UID from pending data
                status: 'completed', // Mark as completed upon successful transaction
                // You could potentially store the OTP verification ID here as well
            };
            transaction.set(transactionRef, newTransaction);

             // PRODUCTION NOTE: Delete the pending transfer document from Firestore
            // transaction.delete(db.collection('pending_otp_verifications').doc(pendingTransferId));

        });

        // Clean up the in-memory map entry (for this example)
        pendingTransfers.delete(pendingTransferId);

        return { status: 'success', message: 'Fund transfer confirmed and completed.' };

    } catch (error: any) {
        // If the transaction fails, log the error
        console.error('Fund Transfer Transaction failed after OTP verification:', error);

        // PRODUCTION NOTE: Update the pending transfer status to 'failed' in Firestore
        // if (pendingDoc.exists) {
        //    await db.collection('pending_otp_verifications').doc(pendingTransferId).update({ status: 'transaction_failed', error: error.message });
        // }

        if (error.code) {
            throw error; // Re-throw HttpsErrors
        }
        throw new functions.https.HttpsError('internal', 'An error occurred while completing the transfer.', error.message);
    }
});

// Placeholder function for initiating InstaPay transfer (needs OTP confirmation)
export const initiateInstaPayTransfer = functions.https.onCall(async (data, context) => {
    const senderUid = context.auth?.uid;
    if (!senderUid) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    // Validate input data for InstaPay (e.g., bank name, account number, amount)
    // ... validation logic ...

    // Perform balance check like in initiateP2PTransfer
    // ... balance check ...

    // Find sender's mobile number for sending OTP
    const senderDoc = await db.collection('users').doc(senderUid).get();
    if (!senderDoc.exists) {
         throw new functions.https.HttpsError('internal', 'Sender user document not found.');
    }
    const senderData = senderDoc.data() as User;
     const senderMobileNumber = senderData.mobileNumber;
    if (!senderMobileNumber) {
         throw new functions.https.HttpsError('internal', 'Sender mobile number not found.');
    }

    // Generate OTP
    const otpSecret = generateSecret({ length: 20 });
    const otpCode = totp({ secret: otpSecret, encoding: 'base32', step: 60, window: 1 });

    // Send OTP SMS
    try {
        await sendOtpSms(senderMobileNumber, otpCode);
    } catch (error) {
        throw error;
    }

    // Store pending transfer details (PRODUCTION: use Firestore collection with TTL)
    const pendingTransferId = db.collection('pendingTransfers').doc().id;
    const otpGeneratedAt = admin.firestore.Timestamp.now();
    pendingTransfers.set(pendingTransferId, {
        transactionData: { ...data, type: 'transfer' }, // Store all relevant data and type 'transfer'
        otpSecret: otpSecret,
        otpGeneratedAt: otpGeneratedAt,
        senderUid: senderUid,
    });
    // PRODUCTION NOTE: Use Firestore for pending_otp_verifications collection

    return {
        status: 'otp_sent',
        message: 'A verification code has been sent to your mobile number to confirm the InstaPay transfer.',
        pendingTransferId: pendingTransferId,
    };
});

// Placeholder function for initiating PesoNET transfer (needs OTP confirmation)
export const initiatePesoNETTransfer = functions.https.onCall(async (data, context) => {
     const senderUid = context.auth?.uid;
    if (!senderUid) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    // Validate input data for PesoNET (e.g., bank name, account number, amount)
    // ... validation logic ...

    // Perform balance check
    // ... balance check ...

     // Find sender's mobile number for sending OTP
    const senderDoc = await db.collection('users').doc(senderUid).get();
    if (!senderDoc.exists) {
         throw new functions.https.HttpsError('internal', 'Sender user document not found.');
    }
    const senderData = senderDoc.data() as User;
     const senderMobileNumber = senderData.mobileNumber;
     if (!senderMobileNumber) {
         throw new functions.https.HttpsError('internal', 'Sender mobile number not found.');
    }

    // Generate OTP
    const otpSecret = generateSecret({ length: 20 });
    const otpCode = totp({ secret: otpSecret, encoding: 'base32', step: 60, window: 1 });

    // Send OTP SMS
    try {
        await sendOtpSms(senderMobileNumber, otpCode);
    } catch (error) {
        throw error;
    }

    // Store pending transfer details (PRODUCTION: use Firestore collection with TTL)
    const pendingTransferId = db.collection('pendingTransfers').doc().id;
    const otpGeneratedAt = admin.firestore.Timestamp.now();
     pendingTransfers.set(pendingTransferId, {
        transactionData: { ...data, type: 'transfer' }, // Store all relevant data and type 'transfer'
        otpSecret: otpSecret,
        otpGeneratedAt: otpGeneratedAt,
        senderUid: senderUid,
    });
    // PRODUCTION NOTE: Use Firestore for pending_otp_verifications collection

    return {
        status: 'otp_sent',
        message: 'A verification code has been sent to your mobile number to confirm the PesoNET transfer.',
        pendingTransferId: pendingTransferId,
    };
});


// Note: The in-memory `pendingTransfers` Map is NOT suitable for production Cloud Functions
// as instances can be recycled, losing pending state. A dedicated Firestore collection
// with a TTL (Time To Live) policy is the recommended production approach for storing
// pending requests awaiting OTP verification.