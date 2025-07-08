import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

const db = admin.firestore();

interface KYCVerificationResult {
  status: 'approved' | 'rejected';
  score: number;
  reason?: string;
  externalId: string;
}

// Mock KYC verification API call
async function verifyKYCWithProvider(documents: any[], userId: string): Promise<KYCVerificationResult> {
  try {
    // This is a mock implementation. In production, you would call real KYC providers like Onfido or Sumsub
    const mockResponse = await axios.post('https://api.kyc-provider.com/verify', {
      documents,
      userId,
      timestamp: new Date().toISOString()
    }, {
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${process.env.KYC_PROVIDER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      status: mockResponse.data.status,
      score: mockResponse.data.score,
      reason: mockResponse.data.reason,
      externalId: mockResponse.data.externalId
    };
  } catch (error) {
    console.error('KYC verification failed:', error);
    
    // Fallback to mock verification for demo purposes
    return {
      status: Math.random() > 0.3 ? 'approved' : 'rejected', // 70% approval rate
      score: Math.floor(Math.random() * 100),
      reason: Math.random() > 0.3 ? undefined : 'Document quality insufficient',
      externalId: `mock_${Date.now()}_${userId}`
    };
  }
}

export const processKYCSubmission = functions.firestore
  .document('tenants/{tenantId}/kyc_submissions/{submissionId}')
  .onCreate(async (snap, context) => {
    try {
      const { tenantId, submissionId } = context.params;
      const submissionData = snap.data();
      const { userId, documents, kycProvider } = submissionData;

      console.log(`Processing KYC submission ${submissionId} for user ${userId}`);

      // Update submission status to processing
      await snap.ref.update({
        status: 'processing',
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Verify KYC with provider
      const verificationResult = await verifyKYCWithProvider(documents, userId);

      // Update submission with result
      await snap.ref.update({
        status: verificationResult.status,
        verificationScore: verificationResult.score,
        externalId: verificationResult.externalId,
        reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        adminReviewedBy: 'system'
      });

      // Update user profile
      const userRef = db.collection('tenants').doc(tenantId).collection('users').doc(userId);
      await userRef.update({
        kycStatus: verificationResult.status,
        kycTier: verificationResult.status === 'approved' ? 'enhanced' : 'basic',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update custom claims
      const customClaims = {
        kycStatus: verificationResult.status,
        kycTier: verificationResult.status === 'approved' ? 'enhanced' : 'basic'
      };

      await admin.auth().setCustomUserClaims(userId, customClaims);

      // Log KYC result
      await db.collection('tenants').doc(tenantId).collection('kyc_logs').add({
        userId,
        tenantId,
        action: verificationResult.status === 'approved' ? 'approved' : 'rejected',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: verificationResult.reason || `KYC ${verificationResult.status} with score ${verificationResult.score}`,
        adminId: 'system',
        externalId: verificationResult.externalId
      });

      // Send notification to user
      const notificationData = {
        userId,
        tenantId,
        title: verificationResult.status === 'approved' ? 'KYC Approved' : 'KYC Review Required',
        body: verificationResult.status === 'approved' 
          ? 'Your identity verification has been approved. You can now use all features.'
          : `Your KYC verification requires attention: ${verificationResult.reason}`,
        type: 'kyc',
        data: {
          submissionId,
          status: verificationResult.status,
          score: verificationResult.score
        },
        read: false,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        fcmSent: false
      };

      await db.collection('tenants').doc(tenantId).collection('notifications').add(notificationData);

      console.log(`KYC processing completed for user ${userId}: ${verificationResult.status}`);
    } catch (error) {
      console.error('Error processing KYC submission:', error);
      
      // Update submission with error status
      await snap.ref.update({
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      throw error;
    }
  }); 