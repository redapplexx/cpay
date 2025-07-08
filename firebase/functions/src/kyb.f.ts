import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';

// Define the TypeScript interface for a Merchant document
interface Merchant {
  // Refined structure for authorizedUsers to include roles
  authorizedUsers: Array<{
    uid: string;
    role: 'maker' | 'approver' | 'admin'; // Define possible roles
  }>;
  merchantId: string; // Auto-generated Firestore document ID
  registeredName: string;
  tradeName: string;
  registeredAddress: string;
  operationAddress: string;
  dateOfIncorporation: firestore.Timestamp;
  tin: string;
  bankAccountDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  uploadedFiles: {
    businessRegistration: string; // Reference or URL to file storage
    secretarysCertificate: string; // Reference or URL to file storage
    // Add other required document types as needed
  };
  kybStatus: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: firestore.Timestamp;
  submittedAt: firestore.Timestamp; // Added to track submission time
  updatedAt: firestore.Timestamp;
}

export const submitMerchantOnboarding = functions.https.onCall(async (data, context) => {
  // 1. Authenticate: Ensure context.auth is valid.
  const authUid = context.auth?.uid;
  if (!authUid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to submit merchant onboarding.');
  }

  // 2. Validate Input Data
  // TODO: Implement robust validation using a schema library like Zod
  // - Validate required business details (registeredName, tradeName, addresses, dateOfIncorporation, tin)
  // - Validate bank account details
  // - Validate file references (ensure they are valid and belong to the uploader)
  // - Ensure the user submitting is authorized or is marked as the initial authorized user

  if (!data.registeredName || !data.tradeName || !data.bankAccountDetails) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required merchant details.');
  }

  // Assume dateOfIncorporation is passed as a string or other serializable format and needs conversion
  let dateOfIncorporationTimestamp: firestore.Timestamp;
  try {
      // Example: Convert string date (YYYY-MM-DD) to Firestore Timestamp
      const dateParts = data.dateOfIncorporation.split('-');
      if (dateParts.length === 3) {
          const year = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
          const day = parseInt(dateParts[2], 10);
          dateOfIncorporationTimestamp = firestore.Timestamp.fromDate(new Date(year, month, day));
      } else {
           throw new Error('Invalid date format');
      }
  } catch (error) {
       throw new functions.https.HttpsError('invalid-argument', 'Invalid date of incorporation format.');
  }


  // 3. Process File Uploads (Placeholder)
  // TODO: Implement secure file upload handling. Files should be uploaded to Cloud Storage
  //       and references/URLs passed here. Validate that the uploaded files are associated
  //       with the authenticated user and meet type/size requirements.
  const uploadedFiles = {
      businessRegistration: data.uploadedFiles?.businessRegistration || null,
      secretarysCertificate: data.uploadedFiles?.secretarysCertificate || null,
      // ... add others
  };

  // 4. Create Merchant Document
  const merchantsCollection = firestore().collection('merchants');

  const newMerchantRef = merchantsCollection.doc(); // Let Firestore generate the ID
  const newMerchant: Merchant = {
      merchantId: newMerchantRef.id,
      registeredName: data.registeredName,
 tradeName: data.tradeName,
      registeredAddress: data.registeredAddress || '', // Handle optional fields
      // Placeholder for other required fields from Phase 2 KYB:
      // businessType: data.businessType,
      // contactPerson: data.contactPerson,
      operationAddress: data.operationAddress || '',   // Handle optional fields
      dateOfIncorporation: dateOfIncorporationTimestamp,
      tin: data.tin || '', // Handle optional fields
      bankAccountDetails: data.bankAccountDetails,
      uploadedFiles: uploadedFiles,
      kybStatus: 'PENDING', // Status set to pending upon submission
      authorizedUsers: [{
 uid: authUid, role: 'admin' // Submitting user is initially an admin
 }], // The user submitting is initially authorized with a role
      createdAt: firestore.FieldValue.serverTimestamp() as firestore.Timestamp,
      submittedAt: firestore.FieldValue.serverTimestamp() as firestore.Timestamp, // Set submission time
      updatedAt: firestore.FieldValue.serverTimestamp() as firestore.Timestamp,
  };

  try {
      await newMerchantRef.set(newMerchant);

 // 5. Trigger Business Verification (Placeholder Integration)
 // In a real application, this would involve calling an external KYB service API.
 // We'll simulate a call here and assume the external service would eventually
 // send a callback to our `handleBusinessVerificationCallback` function.
      console.log(`Simulating triggering business verification for merchant ${newMerchant.merchantId}...`);
      // Example: Make an HTTP request to an external verification service API
      // const verificationResult = await fetch('https://external-kyb-service.com/verify', {
      //     method: 'POST',
      //     body: JSON.stringify({
      //         merchantId: newMerchant.merchantId,
      //         details: newMerchant, // Send relevant details
      //         documentUrls: uploadedFiles, // Send URLs of uploaded documents
      //         callbackUrl: `YOUR_CLOUD_FUNCTIONS_CALLBACK_URL/handleBusinessVerificationCallback`,
      //     }),
      //     headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer YOUR_API_KEY' },
      // });
      // Handle the response from the external service (e.g., initial status, verification ID)

      return { status: 'success', message: 'Merchant onboarding submitted successfully for review.' };

  } catch (error) {
      console.error('Error submitting merchant onboarding:', error);
      throw new functions.https.HttpsError('internal', 'Failed to submit merchant onboarding.', error);
  }
});

// Placeholder Cloud Function to handle callbacks from external Business Verification Services
// This function would be triggered by an external service (e.g., via HTTP POST)
export const handleBusinessVerificationCallback = functions.https.onRequest(async (req, res) => {
  // TODO: Implement logic to receive the callback from the external KYB service.
  // - Validate the source of the callback (e.g., using a shared secret or signature).
  // - Parse the payload to get the merchantId and verification result (e.g., 'VERIFIED', 'REJECTED').
  // - Update the merchant document in Firestore with the new kybStatus and any other relevant data from the callback.
  // - Send a response back to the external service (e.g., 200 OK).
  console.log('Received callback for business verification.');
  console.log('Callback Payload:', req.body);

  const merchantId = req.body.merchantId; // Assume merchantId is in the payload
  const verificationStatus = req.body.status; // Assume status is in the payload ('VERIFIED', 'REJECTED')
  const verificationDetails = req.body.details || {}; // Optional details from the service

  if (!merchantId || !verificationStatus) {
    console.error('Callback payload missing required fields (merchantId or status)');
    return res.status(400).send('Bad Request: Missing required fields.');
  }

  try {
    const merchantRef = firestore().collection('merchants').doc(merchantId);
    await merchantRef.update({
      kybStatus: verificationStatus, // Update status based on callback
      verificationDetails: verificationDetails, // Store any relevant details from the service
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Merchant ${merchantId} KYB status updated to ${verificationStatus}`);
    res.status(200).send('Callback received and processed.');

  } catch (error) {
    console.error(`Error processing business verification callback for merchant ${merchantId}:`, error);
    res.status(500).send('Internal Server Error.');
  }
});

// New Cloud Function to add a user to a merchant's authorized users list with a specific role
export const addMerchantUser = functions.https.onCall(async (data, context) => {
  const authUid = context.auth?.uid;
  if (!authUid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  // TODO: Validate input data: merchantId, targetUserUid, role
  const { merchantId, targetUserUid, role } = data;
  if (!merchantId || !targetUserUid || !role || !['maker', 'approver', 'admin'].includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid input data.');
  }

  const merchantRef = firestore().collection('merchants').doc(merchantId);

  try {
    const merchantDoc = await merchantRef.get();
    if (!merchantDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Merchant not found.');
    }

    const merchantData = merchantDoc.data() as Merchant;

    // 1. Authorization Check: Ensure the calling user (authUid) is authorized to modify this merchant's users
    //    For simplicity here, let's say only 'admin' can add/remove users.
    const callingUser = merchantData.authorizedUsers.find(user => user.uid === authUid);
    if (!callingUser || callingUser.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'User is not authorized to modify merchant users.');
    }

    // 2. Check if target user is already authorized
    const existingUser = merchantData.authorizedUsers.find(user => user.uid === targetUserUid);
    if (existingUser) {
      throw new functions.https.HttpsError('already-exists', 'User is already an authorized user for this merchant.');
    }

    // 3. Check KYC Status of the target user
    const targetUserDoc = await firestore().collection('users').doc(targetUserUid).get();
    const targetUser = targetUserDoc.data();

    if (!targetUser || targetUser.profile?.kycStatus !== 'Verified') {
        // TODO: Depending on requirements, you might allow adding but mark them as inactive
        //       until KYC is verified, or explicitly require KYC verification first.
        //       For now, let's throw an error requiring KYC.
        throw new functions.https.HttpsError('failed-precondition', 'Target user must be KYC verified before being added to a merchant account.');
    }

    // 4. Add the new user with their role
    const updatedAuthorizedUsers = [...merchantData.authorizedUsers, { uid: targetUserUid, role: role }];

    await merchantRef.update({
      authorizedUsers: updatedAuthorizedUsers,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    return { status: 'success', message: `User ${targetUserUid} added to merchant ${merchantId} with role ${role}.` };

  } catch (error) {
    console.error('Error adding merchant user:', error);
    // Re-throw HttpsErrors, wrap others
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to add merchant user.', error);
  }
});

// TODO: Add a similar Cloud Function to remove a user from a merchant's authorized users list.

// TODO: Implement checks in relevant functions (e.g., processing merchant payments,
//       accessing merchant reports) to verify if the calling user has the
//       necessary role within the merchant's authorizedUsers array.