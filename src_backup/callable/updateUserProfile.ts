import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface ProfileUpdateData {
  fullName?: string;
  birthDate?: string;
  placeOfBirth?: string;
  homeAddress?: string;
  nationality?: string;
  language?: 'en' | 'kr' | 'tl';
  mobileNumber?: string;
}

export const updateUserProfile = functions.https.onCall(async (data: ProfileUpdateData, context) => {
  try {
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { uid } = context.auth;

    // Get user data
    const userSnapshot = await db.collectionGroup('users').where('uid', '==', uid).get();
    if (userSnapshot.empty) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const tenantId = userData.tenantId;

    // Validate input data
    const validationErrors: string[] = [];

    if (data.fullName && data.fullName.length < 2) {
      validationErrors.push('Full name must be at least 2 characters long');
    }

    if (data.birthDate) {
      const birthDate = new Date(data.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 18 || age > 100) {
        validationErrors.push('User must be between 18 and 100 years old');
      }
    }

    if (data.mobileNumber && !/^\+?[1-9]\d{1,14}$/.test(data.mobileNumber)) {
      validationErrors.push('Invalid mobile number format');
    }

    if (data.language && !['en', 'kr', 'tl'].includes(data.language)) {
      validationErrors.push('Invalid language selection');
    }

    if (validationErrors.length > 0) {
      throw new functions.https.HttpsError('invalid-argument', validationErrors.join(', '));
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (data.fullName) updateData.fullName = data.fullName;
    if (data.birthDate) updateData.birthDate = data.birthDate;
    if (data.placeOfBirth) updateData.placeOfBirth = data.placeOfBirth;
    if (data.homeAddress) updateData.homeAddress = data.homeAddress;
    if (data.nationality) updateData.nationality = data.nationality;
    if (data.language) updateData.language = data.language;
    if (data.mobileNumber) updateData.mobileNumber = data.mobileNumber;

    // Update user profile
    await userDoc.ref.update(updateData);

    // Log the profile update
    await db.collection('tenants').doc(tenantId).collection('access_logs').add({
      userId: uid,
      tenantId,
      action: 'profile_update',
      ipAddress: 'unknown',
      userAgent: 'cloud_function',
      deviceFingerprint: 'unknown',
      success: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: `Profile updated: ${Object.keys(updateData).filter(key => key !== 'updatedAt').join(', ')}`
    });

    // Send notification if significant changes were made
    const significantChanges = ['fullName', 'nationality', 'mobileNumber'];
    const hasSignificantChanges = significantChanges.some(field => data[field as keyof ProfileUpdateData]);

    if (hasSignificantChanges) {
      const notificationData = {
        userId: uid,
        tenantId,
        title: 'Profile Updated',
        body: 'Your profile has been updated successfully. Some changes may require KYC re-verification.',
        type: 'transaction',
        data: {
          updatedFields: Object.keys(updateData).filter(key => key !== 'updatedAt')
        },
        read: false,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        fcmSent: false
      };

      await db.collection('tenants').doc(tenantId).collection('notifications').add(notificationData);
    }

    return {
      success: true,
      message: 'Profile updated successfully',
      updatedFields: Object.keys(updateData).filter(key => key !== 'updatedAt')
    };

  } catch (error) {
    console.error('Error updating user profile:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Error updating profile');
  }
}); 