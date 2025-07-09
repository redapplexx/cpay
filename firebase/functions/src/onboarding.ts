// /functions/src/onboarding.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const firestore = admin.firestore();

// Define the structure of the data returned from the Cloud Function
// Define the structure of the User document in Firestore
interface User {
  uid: string; // Firebase Auth UID
  mobileNumber: string;
  profile: {
    fullName: string;
    birthDate: admin.firestore.Timestamp;
    gender?: string; // Phase 2
    civilStatus?: string; // Phase 2
    permanentAddress?: string; // Phase 2
    sourceOfFunds?: string; // Phase 2
    passportNumber?: string; // Phase 2 (optional)
    tin?: string; // Phase 2 (optional)
    sssNumber?: string; // Phase 2 (optional)
  };
  kycStatus: 'NOT_STARTED' | 'PENDING' | 'VERIFIED';
  createdAt: admin.firestore.Timestamp;
}


// Define the schema for input data validation
// Phase 1 Schema
const OnboardUserDataSchema = z.object({
  fullName: z.string().min(1, 'Full name is required.'),
  birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid birth date format.'), // Basic date validation
});
type OnboardUserData = z.infer<typeof OnboardUserDataSchema>;

export const onboardNewUser = functions.https.onCall(async (data: OnboardUserData, context) => {
  // 1. Authenticate: Ensure context.auth is valid.
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  // 2. Validate Input Data
  try {
    OnboardUserDataSchema.parse(data);
  } catch (error: any) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid input data.', error.errors);
  }

  // Use a try-catch block for Firestore operations
  try {
    // 3. Mutate Data: Create the user document in Firestore.
    const userRef = firestore.collection('users').doc(uid);

    // Check if user document already exists to prevent overwriting
    const userDoc = await userRef.get();
    if (userDoc.exists) {
        // If the user document already exists, it means onboarding was likely completed.
        // We can return a success or a specific error indicating they are already onboarded.
        // For this implementation, let's return a success message indicating the user profile exists.
         return { status: 'success', message: 'User already onboarded.' };
    }

    const userData: User = {
      uid: uid,
      mobileNumber: context.auth.token.phone_number || '', // Get mobile number from auth token
      profile: {
        fullName: data.fullName,
        birthDate: admin.firestore.Timestamp.fromDate(new Date(data.birthDate)), // Convert date string to Timestamp
      },
      kycStatus: 'NOT_STARTED', // Initial KYC status
      createdAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp, // Server timestamp
    };


    await userRef.set(userData);

    return { status: 'success', message: 'User profile created.' };

  } catch (error: any) {
    console.error('Error onboarding new user:', error);
    // Handle specific Firestore errors or general errors
    throw new functions.https.HttpsError('internal', 'Failed to onboard user.', error);
  }
});