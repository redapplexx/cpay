// /core-functions/src/onboarding/videoKyc.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

const db = admin.firestore();

// In a real application, store your API keys in environment configuration.
// For Firebase, you can set them using:
// firebase functions:config:set veriff.key="YOUR_API_KEY"
const VERIFF_API_KEY = functions.config().veriff?.key;

/**
 * Initiates a video verification session with a third-party provider (e.g., Veriff).
 * This function would be called from the client-side KYC wizard.
 */
export const initiateVideoKycSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  if (!VERIFF_API_KEY) {
    throw new functions.https.HttpsError('internal', 'Veriff API key is not configured.');
  }

  // Pre-fill with user data from your database for a better user experience
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userData = userDoc.data();
  const fullName = userData?.profile?.fullName || 'New User';
  const [firstName, ...lastNameParts] = fullName.split(' ');
  const lastName = lastNameParts.join(' ');

  try {
    const response = await axios.post('https://api.veriff.me/v1/sessions', {
      verification: {
        person: {
          firstName: firstName,
          lastName: lastName,
        },
        document: {
          type: 'ID_CARD', // Example, could be configured based on user's choice
          country: 'PH'
        },
        // The URL of your webhook handler function
        callback: `https://<YOUR_REGION>-<YOUR_PROJECT_ID>.cloudfunctions.net/handleKycWebhook`,
        vendorData: context.auth.uid, // Pass the Firebase UID to link the session back to the user
      }
    }, {
      headers: {
        'X-AUTH-CLIENT': VERIFF_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const sessionData = response.data;
    const verification = sessionData.verification;

    // Store the session ID to link it back upon webhook callback
    await db.collection('kycSubmissions').doc(context.auth.uid).set({
        videoSessionId: verification.id,
        videoProvider: 'Veriff',
        status: 'PENDING_VIDEO', // A new status to indicate waiting for video
    }, { merge: true });

    // Return the session URL for the frontend SDK to launch
    return { success: true, sessionId: verification.id, sessionUrl: verification.url };

  } catch (error: any) {
    console.error("Error initiating Veriff session:", error.response?.data || error.message);
    throw new functions.https.HttpsError('internal', 'Failed to initiate video verification session.');
  }
});

/**
 * An HTTP webhook endpoint to receive the results from the KYC provider.
 * This MUST be secured to only accept requests from the provider (e.g., Veriff).
 */
export const handleKycWebhook = functions.https.onRequest(async (req, res) => {
  // 1. Verify the webhook signature to ensure it's from the provider
  // This is a CRITICAL security step. Each provider has a different method.
  // For Veriff, it's typically done by checking a signature in the request headers.
  // const signature = req.headers['x-signature'];
  // if (!isValidSignature(signature, req.rawBody, YOUR_VERIFF_SECRET)) {
  //   res.status(401).send('Unauthorized');
  //   return;
  // }
  console.log("Received KYC Webhook:", req.body);

  // 2. Process the result
  const { id, status, vendorData } = req.body.verification;

  if (!vendorData) {
      console.error("Webhook received without a UID (vendorData).");
      res.status(400).send({ status: 'error', message: 'Missing vendorData.' });
      return;
  }
  
  const userUid = vendorData;
  const userRef = db.collection('users').doc(userUid);
  const kycSubmissionRef = db.collection('kycSubmissions').doc(userUid);

  let finalKycStatus: 'Verified' | 'Pending' | 'Unverified' = 'Pending';
  if (status === 'approved') {
    finalKycStatus = 'Verified';
  } else if (status === 'declined' || status === 'resubmission_requested') {
    finalKycStatus = 'Unverified'; // Or a more specific status like 'Rejected'
  }

  try {
      // Update the user's main profile with the final KYC status
      await userRef.set({
        profile: {
          kycStatus: finalKycStatus,
        }
      }, { merge: true });

      // Update the detailed KYC submission document
      await kycSubmissionRef.set({
          status: finalKycStatus,
          videoVerificationStatus: status,
          webhookResponse: req.body, // Store the full response for auditing
      }, { merge: true });

      console.log(`Successfully updated KYC status for user ${userUid} to ${finalKycStatus}.`);
      res.status(200).send({ status: 'success' });

  } catch (error) {
      console.error(`Error processing webhook for user ${userUid}:`, error);
      res.status(500).send({ status: 'error', message: 'Internal server error.' });
  }
});
