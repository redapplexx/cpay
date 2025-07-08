import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface KYCReviewRequest {
  action: 'submit' | 'resubmit' | 'cancel';
  documents?: any[];
  notes?: string;
}

export const requestKYCReview = functions.https.onCall(async (data: KYCReviewRequest, context) => {
  try {
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { uid } = context.auth;
    const { action, documents, notes } = data;

    // Get user data
    const userSnapshot = await db.collectionGroup('users').where('uid', '==', uid).get();
    if (userSnapshot.empty) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const tenantId = userData.tenantId;

    // Check current KYC status
    const currentKYCStatus = userData.kycStatus;

    switch (action) {
      case 'submit':
        if (currentKYCStatus === 'verified') {
          throw new functions.https.HttpsError('failed-precondition', 'KYC is already verified');
        }

        if (!documents || documents.length === 0) {
          throw new functions.https.HttpsError('invalid-argument', 'Documents are required for KYC submission');
        }

        // Check if there's already a pending submission
        const existingSubmission = await db.collection('tenants').doc(tenantId).collection('kyc_submissions')
          .where('userId', '==', uid)
          .where('status', '==', 'pending')
          .limit(1)
          .get();

        if (!existingSubmission.empty) {
          throw new functions.https.HttpsError('failed-precondition', 'KYC submission already pending');
        }

        // Create new KYC submission
        const submissionId = `kyc_${uid}_${Date.now()}`;
        const submissionData = {
          id: submissionId,
          userId: uid,
          tenantId,
          documents,
          status: 'pending',
          submittedAt: admin.firestore.FieldValue.serverTimestamp(),
          kycProvider: 'manual',
          userNotes: notes
        };

        await db.collection('tenants').doc(tenantId).collection('kyc_submissions')
          .doc(submissionId).set(submissionData);

        // Update user KYC status
        await userDoc.ref.update({
          kycStatus: 'pending',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update custom claims
        await admin.auth().setCustomUserClaims(uid, {
          ...userData,
          kycStatus: 'pending'
        });

        // Log KYC submission
        await db.collection('tenants').doc(tenantId).collection('kyc_logs').add({
          userId: uid,
          tenantId,
          action: 'submitted',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          details: `KYC submission created with ${documents.length} documents`,
          adminId: 'user'
        });

        // Send notification to admin
        const adminUsers = await db.collection('tenants').doc(tenantId).collection('users')
          .where('role', '==', 'admin')
          .get();

        const adminNotifications = adminUsers.docs.map(adminDoc => ({
          userId: adminDoc.data().uid,
          tenantId,
          title: 'New KYC Submission',
          body: `New KYC submission from ${userData.fullName || userData.email}`,
          type: 'kyc',
          data: {
            submissionId,
            userId: uid,
            documentCount: documents.length
          },
          read: false,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          fcmSent: false
        }));

        await Promise.all(
          adminNotifications.map(notification =>
            db.collection('tenants').doc(tenantId).collection('notifications').add(notification)
          )
        );

        return {
          success: true,
          message: 'KYC submission created successfully',
          submissionId
        };

      case 'resubmit':
        if (currentKYCStatus !== 'rejected') {
          throw new functions.https.HttpsError('failed-precondition', 'Can only resubmit rejected KYC');
        }

        if (!documents || documents.length === 0) {
          throw new functions.https.HttpsError('invalid-argument', 'Documents are required for KYC resubmission');
        }

        // Cancel any existing submissions
        const existingSubmissions = await db.collection('tenants').doc(tenantId).collection('kyc_submissions')
          .where('userId', '==', uid)
          .where('status', 'in', ['pending', 'processing'])
          .get();

        for (const doc of existingSubmissions.docs) {
          await doc.ref.update({
            status: 'cancelled',
            cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
            cancelledBy: uid
          });
        }

        // Create new submission
        const resubmissionId = `kyc_${uid}_${Date.now()}`;
        const resubmissionData = {
          id: resubmissionId,
          userId: uid,
          tenantId,
          documents,
          status: 'pending',
          submittedAt: admin.firestore.FieldValue.serverTimestamp(),
          kycProvider: 'manual',
          userNotes: notes,
          isResubmission: true
        };

        await db.collection('tenants').doc(tenantId).collection('kyc_submissions')
          .doc(resubmissionId).set(resubmissionData);

        // Update user KYC status
        await userDoc.ref.update({
          kycStatus: 'pending',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Log resubmission
        await db.collection('tenants').doc(tenantId).collection('kyc_logs').add({
          userId: uid,
          tenantId,
          action: 'resubmitted',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          details: `KYC resubmission with ${documents.length} documents`,
          adminId: 'user'
        });

        return {
          success: true,
          message: 'KYC resubmission created successfully',
          submissionId: resubmissionId
        };

      case 'cancel':
        // Cancel pending submissions
        const pendingSubmissions = await db.collection('tenants').doc(tenantId).collection('kyc_submissions')
          .where('userId', '==', uid)
          .where('status', 'in', ['pending', 'processing'])
          .get();

        if (pendingSubmissions.empty) {
          throw new functions.https.HttpsError('failed-precondition', 'No pending KYC submissions to cancel');
        }

        for (const doc of pendingSubmissions.docs) {
          await doc.ref.update({
            status: 'cancelled',
            cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
            cancelledBy: uid
          });
        }

        // Update user KYC status if it was pending
        if (currentKYCStatus === 'pending') {
          await userDoc.ref.update({
            kycStatus: 'rejected',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }

        // Log cancellation
        await db.collection('tenants').doc(tenantId).collection('kyc_logs').add({
          userId: uid,
          tenantId,
          action: 'cancelled',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          details: 'KYC submission cancelled by user',
          adminId: 'user'
        });

        return {
          success: true,
          message: 'KYC submission cancelled successfully',
          cancelledCount: pendingSubmissions.size
        };

      default:
        throw new functions.https.HttpsError('invalid-argument', 'Invalid action');
    }

  } catch (error) {
    console.error('Error in KYC review request:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Error processing KYC request');
  }
}); 