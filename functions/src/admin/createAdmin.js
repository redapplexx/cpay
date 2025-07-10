const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Create Admin User Function
 * Creates a new admin user with specified credentials and role
 */
exports.createAdminUser = functions.https.onCall(async (data, context) => {
  // Only allow this function to be called by existing admins or in development
  if (context.auth) {
    const userRecord = await admin.auth().getUser(context.auth.uid);
    const customClaims = userRecord.customClaims;
    
    if (!customClaims || customClaims.role !== 'ADMIN') {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required.');
    }
  }

  const { uid, email, password, role } = data;

  if (!uid || !email || !password || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: uid, email, password, role');
  }

  if (!['ADMIN', 'USER'].includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid role. Must be ADMIN or USER');
  }

  try {
    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      uid: uid,
      email: email,
      password: password,
      emailVerified: true,
    });

    // Set custom claims for role
    await admin.auth().setCustomUserClaims(uid, {
      role: role,
      partnerId: null, // Admin users don't belong to partners
    });

    // Create user document in Firestore
    const userDoc = {
      uid: uid,
      email: email,
      profile: {
        fullName: 'Admin User',
        kycStatus: 'Verified', // Admins are pre-verified
        isMerchant: false,
        role: role,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active',
      language: 'en',
    };

    await db.collection('users').doc(uid).set(userDoc);

    // Create admin audit log
    await db.collection('adminAuditLogs').add({
      adminUid: context.auth?.uid || 'SYSTEM',
      adminEmail: context.auth?.token?.email || 'system@cpay.com',
      action: 'CREATE_ADMIN_USER',
      targetType: 'USER',
      targetId: uid,
      details: {
        email: email,
        role: role,
        createdBy: context.auth?.uid || 'SYSTEM',
      },
      ipAddress: context.rawRequest?.ip || 'unknown',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: `Admin user created successfully: ${email}`,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        role: role,
        customClaims: await admin.auth().getUser(uid).then(u => u.customClaims),
      },
    };

  } catch (error) {
    console.error('Error creating admin user:', error);
    
    // Clean up if user was created but Firestore failed
    try {
      await admin.auth().deleteUser(uid);
    } catch (cleanupError) {
      console.error('Error cleaning up user:', cleanupError);
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to create admin user.', error.message);
  }
});

/**
 * Create Specific Admin User (Winny)
 * Creates the specific admin user with provided credentials
 */
exports.createWinnyAdmin = functions.https.onCall(async (data, context) => {
  // This function can be called without admin auth for initial setup
  const { secretKey } = data;

  if (!secretKey) {
    throw new functions.https.HttpsError('invalid-argument', 'Secret key is required');
  }

  // Verify secret key for security
  if (secretKey !== 'CPAY_ADMIN_SETUP_2024') {
    throw new functions.https.HttpsError('permission-denied', 'Invalid secret key.');
  }

  const adminData = {
    uid: 'YmVCpYj5emNlGvxBWD1Q',
    email: 'winny@redapplrx.com',
    password: 'superwinny',
    role: 'ADMIN',
  };

  try {
    // Check if user already exists
    try {
      const existingUser = await admin.auth().getUser(adminData.uid);
      if (existingUser) {
        // Update existing user
        await admin.auth().updateUser(adminData.uid, {
          email: adminData.email,
          password: adminData.password,
          emailVerified: true,
        });

        // Update custom claims
        await admin.auth().setCustomUserClaims(adminData.uid, {
          role: adminData.role,
          partnerId: null,
        });

        // Update Firestore document
        await db.collection('users').doc(adminData.uid).set({
          uid: adminData.uid,
          email: adminData.email,
          profile: {
            fullName: 'Winny Admin',
            kycStatus: 'Verified',
            isMerchant: false,
            role: adminData.role,
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'active',
          language: 'en',
        }, { merge: true });

        return {
          success: true,
          message: 'Admin user updated successfully: winny@redapplrx.com',
          user: {
            uid: adminData.uid,
            email: adminData.email,
            role: adminData.role,
          },
        };
      }
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Create new user
    const userRecord = await admin.auth().createUser({
      uid: adminData.uid,
      email: adminData.email,
      password: adminData.password,
      emailVerified: true,
    });

    // Set custom claims
    await admin.auth().setCustomUserClaims(adminData.uid, {
      role: adminData.role,
      partnerId: null,
    });

    // Create Firestore document
    await db.collection('users').doc(adminData.uid).set({
      uid: adminData.uid,
      email: adminData.email,
      profile: {
        fullName: 'Winny Admin',
        kycStatus: 'Verified',
        isMerchant: false,
        role: adminData.role,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active',
      language: 'en',
    });

    // Create audit log
    await db.collection('adminAuditLogs').add({
      adminUid: 'SYSTEM',
      adminEmail: 'system@cpay.com',
      action: 'CREATE_WINNY_ADMIN',
      targetType: 'USER',
      targetId: adminData.uid,
      details: {
        email: adminData.email,
        role: adminData.role,
        createdBy: 'SYSTEM',
      },
      ipAddress: context.rawRequest?.ip || 'unknown',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: 'Winny admin user created successfully: winny@redapplrx.com',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        role: adminData.role,
        customClaims: await admin.auth().getUser(adminData.uid).then(u => u.customClaims),
      },
    };

  } catch (error) {
    console.error('Error creating Winny admin user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create admin user.', error.message);
  }
});

/**
 * Verify Admin User
 * Verifies that the specified user exists and has admin role
 */
exports.verifyAdminUser = functions.https.onCall(async (data, context) => {
  const { uid } = data;

  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'User ID is required');
  }

  try {
    const userRecord = await admin.auth().getUser(uid);
    const customClaims = userRecord.customClaims;
    
    const isAdmin = customClaims && customClaims.role === 'ADMIN';
    
    // Get Firestore user data
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    return {
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled,
        customClaims: customClaims,
        firestoreData: userData,
        isAdmin: isAdmin,
      },
    };

  } catch (error) {
    console.error('Error verifying admin user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to verify admin user.', error.message);
  }
}); 