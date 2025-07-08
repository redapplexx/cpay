import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Assuming Firebase Admin SDK is already initialized elsewhere
// admin.initializeApp();

export const signInWithUsernameAndPassword = functions.https.onCall(async (data, context) => {
    const identifier = data.identifier; // Can be mobile number or username
    const password = data.password;

    // Basic validation
 if (!identifier || !password) {
        throw new functions.https.HttpsError(
            'invalid-argument',
 'The function must be called with a mobile number or username and password.'
        );
    }

    // In a real application, you would need to map the username to a Firebase Authentication user.
    // This typically involves querying a database (like Firestore or the Realtime Database)
    // to find the user's UID based on the provided username.
    // For this example, we'll simulate finding a UID.
    // REPLACE THIS SIMULATION WITH YOUR ACTUAL USERNAME-TO-UID MAPPING LOGIC
    let uid: string | null = null;
    try {
        // Example: Query Firestore for a user document with the given username
 // First, try to find the user by mobile number
 let queryField = 'profile.mobileNumber';
 let queryValue = identifier;

 // If identifier doesn't look like a mobile number, try username
 if (!/^(09|\+639)\d{9}$/.test(identifier)) {
 queryField = 'username'; // Assuming you have a 'username' field
 queryValue = identifier;
 }

 const userRef = admin.firestore().collection('users').where(queryField, '==', queryValue).limit(1);
        const snapshot = await userRef.get();

        if (snapshot.empty) {
            // No user found with that username
            throw new functions.https.HttpsError(
 'not-found',
 `No user found with the provided ${queryField === 'username' ? 'username' : 'mobile number'}.`
            );
        }

        // Assuming the username is unique, get the UID from the first document
        uid = snapshot.docs[0].id; // Assuming the document ID is the UID

    } catch (error) {
        console.error('Error mapping username to UID:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Unable to find user by username.'
        );
    }

    if (!uid) {
 // This case should theoretically be caught by snapshot.empty, but added for safety
 throw new functions.https.HttpsError(
            'not-found',
            'User with that username does not exist.'
        );
    }


    try {
        // Now that we have the UID, you might need to perform additional checks
        // or directly use Firebase Authentication to verify the password.
        // However, Firebase Authentication's `signInWithEmailAndPassword` (or equivalent for custom auth)
        // typically requires email/password or a custom token, not just a UID and raw password
        // for a direct password verification.

        // A common pattern when using custom usernames is to use Firebase Authentication's
        // Admin SDK to *verify* the password after finding the user by username,
        // or to use Custom Tokens for signing in.

        // Option 1 (Conceptual - requires exposing email or using custom claims):
        // If you stored the user's email alongside the username in Firestore,
        // you could fetch the email and use `admin.auth().getUserByEmail(email)`
        // and then compare passwords (less secure unless hashed on client before sending)
        // OR use a custom token approach.

        // Option 2: Using Custom Tokens (More Secure)
        // You would verify the username and password combination against your database
        // within this Cloud Function. If they match, you generate a custom token
        // for that user's UID and send it back to the client. The client then uses
        // `firebase.auth().signInWithCustomToken(token)` to sign in.

        // This implementation will follow Option 2 (Custom Tokens) as it's more standard
        // for username-based authentication with Firebase Admin SDK.

        // --- BEGIN Password Verification and Custom Token Generation ---
        // In a real app, you would fetch the user's hashed password from your database (e.g., Firestore)
        // using the retrieved `uid` and compare it with the provided `password`.
        // Ensure you are using a secure password hashing library (like bcrypt) and never store raw passwords.

        // SIMULATION: Fetch user data and verify password (REPLACE with your actual logic)
        const userDoc = await admin.firestore().collection('users').doc(uid).get();
        const userData = userDoc.data();

 if (!userData || userData.password !== password) { // **NOTE:** This is a placeholder. Replace with secure hashing comparison.
             throw new functions.https.HttpsError(
                'unauthenticated',
                'Invalid username or password.'
            );
        }
        // END SIMULATION

        // If password verification is successful, generate a custom token
        const customToken = await admin.auth().createCustomToken(uid);

        // --- Implement Single Active Session (Phase 2) ---
        // Invalidate any existing sessions for this user upon successful login.
        // This forces other instances to re-authenticate.
        // Consider the UX implications - this will log out the user on other devices.
        await admin.auth().revokeRefreshTokens(uid);
        // --- End Single Active Session ---

        // Return the custom token to the client
        return { status: 'success', customToken: customToken };

    } catch (error: any) {
        console.error('Error signing in with username and password:', error);

        if (error.code === 'auth/user-not-found' || error.code === 'unauthenticated') {
             throw new functions.https.HttpsError(
                'unauthenticated',
                'Invalid username or password.'
            );
        } else {
             throw new functions.https.HttpsError(
                'internal',
                'An unexpected error occurred during sign-in.',
                error.message // Include original error message for debugging
            );
        }
    }
});

// --- Phase 2: Password Expiration ---

// Helper function to check if a date is more than 90 days ago
const isMoreThan90DaysAgo = (date: admin.firestore.Timestamp): boolean => {
    const ninetyDaysInMillis = 90 * 24 * 60 * 60 * 1000;
    const nowInMillis = Date.now();
    const dateInMillis = date.toMillis();
    return (nowInMillis - dateInMillis) > ninetyDaysInMillis;
};

// HTTP-callable function to check if the user's password has expired (more than 90 days old)
export const checkPasswordExpiration = functions.https.onCall(async (data, context) => {
    // Ensure the user is authenticated
    const uid = context.auth?.uid;
    if (!uid) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'User must be authenticated to check password expiration.'
        );
    }

    try {
        // Fetch the user's passwordLastChanged timestamp from Firestore
        const userDoc = await admin.firestore().collection('users').doc(uid).get();
        const userData = userDoc.data();

        const passwordLastChanged = userData?.passwordLastChanged as admin.firestore.Timestamp | undefined;

        // If the timestamp exists, check if it's more than 90 days ago
        const hasExpired = passwordLastChanged ? isMoreThan90DaysAgo(passwordLastChanged) : true; // Assume expired if timestamp is missing (e.g., old user)

        return { hasExpired: hasExpired };

    } catch (error: any) {
        console.error('Error checking password expiration:', error);
        throw new functions.https.HttpsError('internal', 'Failed to check password expiration.', error.message);
    }
});


export const signInWithEmailAndPassword = functions.https.onCall(async (data, context) => {
    const email = data.email;
    const password = data.password;

    // Basic validation
    if (!email || !password) {
        throw new functions.https.HttpsError(
            'invalid-argument',
 'The function must be called with an email and password.'
        );
    }

    try {
        // Firebase Admin SDK does not have a direct `signInWithEmailAndPassword` method
        // for server-side authentication in the same way the client SDK does.
        // Server-side authentication typically involves verifying credentials against
        // your database if you're not using standard Firebase Auth email/password,
        // or using custom tokens.

        // Assuming you ARE using standard Firebase Authentication's email/password provider,
        // the client SDK handles the sign-in. This Cloud Function might be more useful
        // for *creating* users with email/password or linking credentials.

        // If the goal is to sign in server-side using email/password (which is unusual
        // as client SDKs are for this), you would typically use a custom token approach
        // after verifying the email/password against your own stored (hashed) credentials
        // in a database, if not relying entirely on Firebase Auth's provider.

        // Since the BRD specifies email login in Phase 2, and Firebase Auth supports it,
        // the most standard approach is for the CLIENT to call Firebase Auth directly
        // with email and password. This Cloud Function is not the standard place for this.

        // However, if this function is intended for a non-standard flow (e.g., admin),
        // you would need to implement password verification logic here (using bcrypt etc.)
        // and potentially issue a custom token.

        // Returning a placeholder response as direct email/password sign-in is client-side.
 return { status: 'success', message: 'Email/password sign-in is typically client-side via Firebase SDK.' };
    } catch (error: any) {
        console.error('Error processing email/password request:', error);
        // Depending on actual implementation needs, handle specific errors
        throw new functions.https.HttpsError(
            'internal',
            'An error occurred processing the email/password request.',
            error.message
        );
    }
});

// --- Phase 2: Biometrics (Face ID / Fingerprint) Authentication ---

// Placeholder for registering a biometric credential (e.g., a public key from WebAuthn/FIDO2)
// This function would be called by the client after a successful native biometric enrollment.
// The client would send the necessary credential data generated by the native API.
export const registerBiometricCredential = functions.https.onCall(async (data, context) => {
    const uid = context.auth?.uid;
    if (!uid) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to register biometrics.');
    }

    const { credentialId, publicKey, counter } = data; // Example data structure; depends on the biometric API (e.g., WebAuthn)

    if (!credentialId || !publicKey || counter === undefined) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing biometric credential data.');
    }

    try {
        // TODO: Securely store the user's biometric public key or identifier in your database
        // This public key will be used later to verify biometric authentication challenges.
        // Ensure this data is linked to the user's UID.
        console.log(`Placeholder: Storing biometric credential for user ${uid}:`, { credentialId, publicKey, counter });

        // Example: Update the user's document in Firestore with biometric info
        // await admin.firestore().collection('users').doc(uid).update({
        //     biometricCredentialId: credentialId,
        //     biometricPublicKey: publicKey, // In practice, store securely, perhaps not directly plaintext
        //     biometricCounter: counter,
        // });

        return { status: 'success', message: 'Biometric credential registered successfully.' };
    } catch (error: any) {
        console.error('Error registering biometric credential:', error);
        throw new functions.https.HttpsError('internal', 'Failed to register biometric credential.', error.message);
    }
});

// Placeholder for verifying a biometric authentication challenge response.
// The client would request a challenge, perform the biometric check natively,
// and send the response back to this function for verification using the stored public key.
export const verifyBiometricChallenge = functions.https.onCall(async (data, context) => {
    const { credentialId, clientDataJSON, authenticatorData, signature, userHandle } = data; // Example WebAuthn response data

    // TODO: Implement secure verification logic. This is highly dependent on the biometric API (e.g., WebAuthn/FIDO2).
    // You would retrieve the stored public key associated with the credentialId,
    // reconstruct the challenge, and cryptographically verify the signature against the public key.
    throw new functions.https.HttpsError('unimplemented', 'Biometric challenge verification is not yet implemented.');
});

export const signInWithPin = functions.https.onCall(async (data, context) => {
    const identifier = data.identifier; // Mobile number or potentially UID
    const pin = data.pin;

    // 1. Basic validation
    if (!identifier || !pin || typeof pin !== 'string' || pin.length !== 6) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'The function must be called with a valid identifier and a 6-digit PIN.'
        );
    }

    // Ensure the user is authenticated before attempting PIN verification
    // This assumes the PIN is used as a secondary authentication factor or
    // after an initial step that identifies the user (e.g., entering mobile number).
    // If PIN is the primary login method, you'd need to identify the user first.
    // For this implementation, I will assume the user's UID is available in the context
    // or can be derived from the identifier (like mobile number lookup).

    const uid = context.auth?.uid;
    if (!uid) {
         // If PIN is primary, you'd lookup UID by identifier here.
         // For now, throwing error if not already authenticated/identified.
        throw new functions.https.HttpsError(
            'unauthenticated',
            'User must be identified before verifying PIN.'
        );
    }

    try {
        // 2. Securely Verify PIN
        // This is a critical security step.
        // You would fetch the user's hashed PIN from your database (e.g., Firestore)
        // using the `uid` and compare it with the provided `pin`.
        // Always hash PINs before storing and use a secure comparison method.

        // PLACEHOLDER: Implement your secure PIN verification logic here.
        // Example: Fetch hashedPin from user document and compare.
        // const userDoc = await admin.firestore().collection('users').doc(uid).get();
        // const storedHashedPin = userDoc.data()?.hashedPin;
        // const isPinValid = await verifyPin(pin, storedHashedPin); // Use a secure library for verification

        // SIMULATION: Assume PIN verification is successful for demonstration
        const isPinValid = pin === '123456'; // **REPLACE WITH SECURE VERIFICATION**

        if (!isPinValid) {
            throw new functions.https.HttpsError('unauthenticated', 'Invalid PIN.');
        }

        // --- Implement Single Active Session (Phase 2) ---
        // If PIN sign-in is used as a primary method, you'd issue a custom token here
        // after identifying the user by identifier/PIN. If so, you would revoke
        // existing refresh tokens after issuing the new token.
        // await admin.auth().revokeRefreshTokens(uid); // Example if issuing custom token
        // --- End Single Active Session ---

        // 3. If PIN is valid, the user is authenticated.
        // For a callable function used post-authentication (e.g., for transaction confirmation PIN),
        // successful execution is enough.
        // If this were a *primary* sign-in method (less common for PINs alone),
        // you might issue a custom token here after identifying the user by PIN.

        return { status: 'success', message: 'PIN verified successfully.' };

    } catch (error: any) {
        console.error('Error signing in with PIN:', error);

        if (error.code === 'unauthenticated') {
            throw error; // Re-throw specific unauthenticated error
        } else {
             throw new functions.https.HttpsError(
                'internal',
                'An unexpected error occurred during PIN verification.',
                error.message // Include original error message for debugging
            );
        }
    }
});