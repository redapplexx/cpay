import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';

// Assuming User interface is defined elsewhere or imported
// interface User {
//   // ... existing fields
//   gender?: string;
//   civilStatus?: string;
//   permanentAddress?: string;
//   sourceOfFunds?: string;
//   passportNumber?: string;
//   tin?: string;
//   sssNumber?: string;
//   kycStatus: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'FAILED'; // Added FAILED status
//   kycLevel: 'level1' | 'level2'; // Added kycLevel
//   referralId?: string;
//   // ... potentially fields for document/video references
// }


export const submitPhase2KYC = functions.https.onCall(async (data, context) => {
  // 1. Authenticate: Ensure context.auth is valid.
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to submit KYC.');
  }

  // 2. Validate Input Data
  // In a real application, use a schema validation library like Zod or Joi
  // to validate the structure and types of the incoming data.
  // Example checks (simplified):
  const { gender, civilStatus, permanentAddress, sourceOfFunds, passportNumber, tin, sssNumber, documentData, videoData } = data;

  if (!gender || typeof gender !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'Gender is required and must be a string.');
  }
   if (!civilStatus || typeof civilStatus !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'Civil Status is required and must be a string.');
  }
   if (!permanentAddress || typeof permanentAddress !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'Permanent Address is required and must be a string.');
  }
    if (!sourceOfFunds || typeof sourceOfFunds !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'Source of Funds is required and must be a string.');
  }
  // Add more detailed validation as per BRD requirements for specific fields
  // Validate format/type of documentData and videoData references/payloads


  // 3. Update User Document with submitted data
  const userRef = firestore().collection('users').doc(uid);

  const updateData: any = {
    gender: gender,
    civilStatus: civilStatus,
    permanentAddress: permanentAddress,
    sourceOfFunds: sourceOfFunds,
    // Only include optional fields if provided
    ...(passportNumber && { passportNumber: passportNumber }),
    ...(tin && { tin: tin }),
    ...(sssNumber && { sssNumber: sssNumber }),
    // Add fields to store references/metadata for uploaded documents/video
    // e.g., documentRefs: documentData, videoRef: videoData,
    kycStatus: 'PENDING', // Set status to PENDING review/verification
    kycLevel: 'level2',   // Indicate Phase 2 submission
  };


  try {
    await userRef.update(updateData);

    // 4. Trigger External Verification Services (Placeholder)
    // In a real application, you would integrate with external services here
    // to verify documents and validate the video call/submission.
    // These services would typically use webhooks or callbacks to notify your backend
    // function once the verification process is complete.

    // Example Placeholder Calls:
    // await triggerDocumentVerificationService(uid, documentData);
    // await triggerVideoValidationService(uid, videoData);


    return { status: 'success', message: 'Phase 2 KYC data submitted for review.' };

  } catch (error: any) {
    functions.logger.error('Error submitting Phase 2 KYC:', error);
    // Revert KYC status or mark as failed on certain errors if necessary
    // await userRef.update({ kycStatus: 'FAILED' }); // Example error handling action

    throw new functions.https.HttpsError('internal', 'Failed to submit Phase 2 KYC data.', error);
  }
});

// Example of a potential callback function (would need to be its own callable or HTTP function)
// export const handleKYCVerificationCallback = functions.https.onCall(async (data, context) => {
//   // Authenticate the callback source (e.g., using a shared secret or signature)
//   // const isCallbackAuthenticated = verifyCallbackSource(context.rawRequest);
//   // if (!isCallbackAuthenticated) {
//   //    throw new functions.https.HttpsError('unauthenticated', 'Callback source not authorized.');
//   // }

//   // Parse callback data to get user ID and verification result
//   // const { userId, verificationStatus, verificationDetails } = data;

//   // Update user document based on verification status
//   // const userRef = firestore().collection('users').doc(userId);
//   // await userRef.update({
//   //   kycStatus: verificationStatus, // 'VERIFIED' or 'FAILED'
//   //   verificationDetails: verificationDetails // Store details from the service
//   // });

//   // return { status: 'success', message: 'KYC status updated.' };
// });