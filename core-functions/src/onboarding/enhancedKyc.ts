import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';

const db = admin.firestore();

// Enhanced KYC Schema
const EnhancedKycSchema = z.object({
  userId: z.string(),
  level: z.enum(['BASIC', 'ENHANCED', 'FULL']),
  verificationMethods: z.array(z.enum(['DOCUMENT', 'VIDEO', 'BIOMETRIC', 'DATABASE_CHECK'])),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED', 'UNDER_REVIEW']),
  riskScore: z.number().min(0).max(1),
  complianceChecks: z.array(z.object({
    check: z.string(),
    status: z.enum(['PASSED', 'FAILED', 'PENDING']),
    details: z.string(),
    timestamp: z.date(),
  })),
  documents: z.array(z.object({
    type: z.string(),
    url: z.string(),
    verified: z.boolean(),
    verificationDate: z.date().optional(),
  })),
  auditTrail: z.array(z.object({
    action: z.string(),
    actor: z.string(),
    timestamp: z.date(),
    details: z.string(),
  })),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type EnhancedKyc = z.infer<typeof EnhancedKycSchema>;

// KYC Levels and Requirements
const KYC_LEVELS = {
  BASIC: {
    requiredDocuments: ['ID_DOCUMENT'],
    requiredChecks: ['IDENTITY_VERIFICATION', 'AGE_VERIFICATION'],
    maxTransactionLimit: 50000, // PHP 50k
    maxDailyLimit: 200000, // PHP 200k
  },
  ENHANCED: {
    requiredDocuments: ['ID_DOCUMENT', 'PROOF_OF_ADDRESS', 'SELFIE'],
    requiredChecks: ['IDENTITY_VERIFICATION', 'AGE_VERIFICATION', 'ADDRESS_VERIFICATION', 'LIVENESS_CHECK'],
    maxTransactionLimit: 500000, // PHP 500k
    maxDailyLimit: 2000000, // PHP 2M
  },
  FULL: {
    requiredDocuments: ['ID_DOCUMENT', 'PROOF_OF_ADDRESS', 'SELFIE', 'ADDITIONAL_DOCUMENTS'],
    requiredChecks: ['IDENTITY_VERIFICATION', 'AGE_VERIFICATION', 'ADDRESS_VERIFICATION', 'LIVENESS_CHECK', 'DATABASE_CHECK', 'RISK_ASSESSMENT'],
    maxTransactionLimit: 5000000, // PHP 5M
    maxDailyLimit: 10000000, // PHP 10M
  },
};

/**
 * Enhanced KYC Submission Function
 * Handles multi-level KYC with comprehensive verification
 */
export const submitEnhancedKyc = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const { level, documents, personalInfo } = z.object({
    level: z.enum(['BASIC', 'ENHANCED', 'FULL']),
    documents: z.array(z.object({
      type: z.string(),
      url: z.string(),
    })),
    personalInfo: z.object({
      fullName: z.string(),
      dob: z.string(),
      address: z.string(),
      nationality: z.string(),
      sourceOfFunds: z.string().optional(),
      occupation: z.string().optional(),
    }),
  }).parse(data);

  try {
    const userId = context.auth.uid;
    const userRef = db.collection('users').doc(userId);
    const kycRef = db.collection('enhancedKyc').doc(userId);

    // Check if KYC already exists
    const existingKyc = await kycRef.get();
    if (existingKyc.exists) {
      throw new functions.https.HttpsError('already-exists', 'KYC submission already exists for this user.');
    }

    // Initialize KYC submission
    const kycSubmission: EnhancedKyc = {
      userId,
      level,
      verificationMethods: getVerificationMethods(level),
      status: 'PENDING',
      riskScore: 0.5, // Initial risk score
      complianceChecks: [],
      documents: documents.map(doc => ({
        type: doc.type,
        url: doc.url,
        verified: false,
      })),
      auditTrail: [{
        action: 'KYC_SUBMITTED',
        actor: userId,
        timestamp: new Date(),
        details: `KYC submission initiated for level ${level}`,
      }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store KYC submission
    await kycRef.set(kycSubmission);

    // Update user profile
    await userRef.update({
      'profile.kycLevel': level,
      'profile.kycStatus': 'PENDING',
      'profile.lastKycSubmission': admin.firestore.FieldValue.serverTimestamp(),
    });

    // Trigger automated verification process
    await triggerAutomatedVerification(userId, level);

    return {
      success: true,
      kycId: userId,
      message: `Enhanced KYC submission received for level ${level}.`,
    };

  } catch (error: any) {
    console.error('Error in enhanced KYC submission:', error);
    throw new functions.https.HttpsError('internal', 'Failed to submit enhanced KYC.', error.message);
  }
});

/**
 * Automated KYC Verification Process
 * Runs comprehensive verification checks
 */
export const triggerAutomatedVerification = functions.https.onCall(async (data, context) => {
  const { userId, level } = z.object({
    userId: z.string(),
    level: z.enum(['BASIC', 'ENHANCED', 'FULL']),
  }).parse(data);

  try {
    const kycRef = db.collection('enhancedKyc').doc(userId);
    const kycDoc = await kycRef.get();
    
    if (!kycDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'KYC submission not found.');
    }

    const kycData = kycDoc.data() as EnhancedKyc;
    
    // Update status to in progress
    await kycRef.update({
      status: 'IN_PROGRESS',
      updatedAt: new Date(),
    });

    // Run compliance checks based on level
    const complianceChecks = await runComplianceChecks(userId, level, kycData);
    
    // Calculate risk score
    const riskScore = calculateRiskScore(complianceChecks, kycData);
    
    // Determine final status
    const finalStatus = determineKycStatus(complianceChecks, riskScore);
    
    // Update KYC submission
    await kycRef.update({
      status: finalStatus,
      riskScore,
      complianceChecks,
      updatedAt: new Date(),
      auditTrail: admin.firestore.FieldValue.arrayUnion({
        action: 'AUTOMATED_VERIFICATION_COMPLETED',
        actor: 'SYSTEM',
        timestamp: new Date(),
        details: `Automated verification completed. Status: ${finalStatus}, Risk Score: ${riskScore}`,
      }),
    });

    // Update user profile
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      'profile.kycStatus': finalStatus,
      'profile.riskScore': riskScore,
      'profile.kycCompletedAt': admin.firestore.FieldValue.serverTimestamp(),
    });

    // Trigger additional processes based on status
    if (finalStatus === 'VERIFIED') {
      await triggerPostVerificationProcesses(userId, level);
    } else if (finalStatus === 'REJECTED') {
      await triggerRejectionProcesses(userId, kycData);
    }

    return {
      success: true,
      status: finalStatus,
      riskScore,
      message: `Automated verification completed. Status: ${finalStatus}`,
    };

  } catch (error: any) {
    console.error('Error in automated verification:', error);
    throw new functions.https.HttpsError('internal', 'Failed to complete automated verification.', error.message);
  }
});

/**
 * Run Compliance Checks
 */
async function runComplianceChecks(userId: string, level: string, kycData: EnhancedKyc) {
  const checks = [];
  const requirements = KYC_LEVELS[level as keyof typeof KYC_LEVELS];

  // Identity Verification
  checks.push(await performIdentityVerification(userId, kycData));

  // Age Verification
  checks.push(await performAgeVerification(kycData));

  // Address Verification
  if (level !== 'BASIC') {
    checks.push(await performAddressVerification(userId, kycData));
  }

  // Liveness Check
  if (level !== 'BASIC') {
    checks.push(await performLivenessCheck(userId, kycData));
  }

  // Database Checks
  if (level === 'FULL') {
    checks.push(await performDatabaseChecks(userId, kycData));
  }

  // Document Verification
  checks.push(await performDocumentVerification(kycData));

  // Risk Assessment
  if (level === 'FULL') {
    checks.push(await performRiskAssessment(userId, kycData));
  }

  return checks;
}

/**
 * Individual Compliance Check Functions
 */
async function performIdentityVerification(userId: string, kycData: EnhancedKyc) {
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();
  
  const hasRequiredInfo = userData?.profile?.fullName && 
                         userData?.profile?.dob && 
                         userData?.profile?.nationality;
  
  return {
    check: 'IDENTITY_VERIFICATION',
    status: hasRequiredInfo ? 'PASSED' : 'FAILED',
    details: hasRequiredInfo ? 'All required identity information provided' : 'Missing required identity information',
    timestamp: new Date(),
  };
}

async function performAgeVerification(kycData: EnhancedKyc) {
  // Mock age verification - in production, use actual age calculation
  const age = 25; // Mock age
  const isAdult = age >= 18;
  
  return {
    check: 'AGE_VERIFICATION',
    status: isAdult ? 'PASSED' : 'FAILED',
    details: isAdult ? `Age verified: ${age} years old` : `Underage: ${age} years old`,
    timestamp: new Date(),
  };
}

async function performAddressVerification(userId: string, kycData: EnhancedKyc) {
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();
  
  const hasAddress = userData?.profile?.address;
  const isPhilippinesAddress = hasAddress?.toLowerCase().includes('philippines') || 
                              hasAddress?.toLowerCase().includes('ph');
  
  return {
    check: 'ADDRESS_VERIFICATION',
    status: hasAddress && isPhilippinesAddress ? 'PASSED' : 'FAILED',
    details: hasAddress ? `Address provided: ${hasAddress.substring(0, 50)}...` : 'No address provided',
    timestamp: new Date(),
  };
}

async function performLivenessCheck(userId: string, kycData: EnhancedKyc) {
  // Mock liveness check - in production, integrate with video verification service
  const hasSelfie = kycData.documents.some(doc => doc.type === 'SELFIE');
  
  return {
    check: 'LIVENESS_CHECK',
    status: hasSelfie ? 'PASSED' : 'FAILED',
    details: hasSelfie ? 'Selfie provided for liveness verification' : 'No selfie provided',
    timestamp: new Date(),
  };
}

async function performDatabaseChecks(userId: string, kycData: EnhancedKyc) {
  // Mock database checks - in production, integrate with government databases
  const isInSanctionsList = false; // Mock check
  const isInPEPList = false; // Mock check for Politically Exposed Person
  
  const allChecksPassed = !isInSanctionsList && !isInPEPList;
  
  return {
    check: 'DATABASE_CHECK',
    status: allChecksPassed ? 'PASSED' : 'FAILED',
    details: allChecksPassed ? 'No matches found in sanctions or PEP databases' : 'Matches found in sanctions or PEP databases',
    timestamp: new Date(),
  };
}

async function performDocumentVerification(kycData: EnhancedKyc) {
  const requiredDocs = KYC_LEVELS[kycData.level as keyof typeof KYC_LEVELS].requiredDocuments;
  const providedDocs = kycData.documents.map(doc => doc.type);
  
  const missingDocs = requiredDocs.filter(doc => !providedDocs.includes(doc));
  const allDocsProvided = missingDocs.length === 0;
  
  return {
    check: 'DOCUMENT_VERIFICATION',
    status: allDocsProvided ? 'PASSED' : 'FAILED',
    details: allDocsProvided ? 'All required documents provided' : `Missing documents: ${missingDocs.join(', ')}`,
    timestamp: new Date(),
  };
}

async function performRiskAssessment(userId: string, kycData: EnhancedKyc) {
  // Mock risk assessment - in production, use comprehensive risk scoring
  const riskFactors = [
    { factor: 'Age', score: 0.2 },
    { factor: 'Location', score: 0.3 },
    { factor: 'Occupation', score: 0.4 },
    { factor: 'Source of Funds', score: 0.5 },
  ];
  
  const averageRisk = riskFactors.reduce((sum, factor) => sum + factor.score, 0) / riskFactors.length;
  
  return {
    check: 'RISK_ASSESSMENT',
    status: averageRisk < 0.7 ? 'PASSED' : 'FAILED',
    details: `Risk assessment completed. Average risk score: ${(averageRisk * 100).toFixed(1)}%`,
    timestamp: new Date(),
  };
}

/**
 * Helper Functions
 */
function getVerificationMethods(level: string): string[] {
  switch (level) {
    case 'BASIC':
      return ['DOCUMENT'];
    case 'ENHANCED':
      return ['DOCUMENT', 'VIDEO'];
    case 'FULL':
      return ['DOCUMENT', 'VIDEO', 'BIOMETRIC', 'DATABASE_CHECK'];
    default:
      return ['DOCUMENT'];
  }
}

function calculateRiskScore(complianceChecks: any[], kycData: EnhancedKyc): number {
  const failedChecks = complianceChecks.filter(check => check.status === 'FAILED');
  const totalChecks = complianceChecks.length;
  
  if (totalChecks === 0) return 0.5;
  
  const failureRate = failedChecks.length / totalChecks;
  const baseRisk = 0.3;
  
  return Math.min(1, baseRisk + (failureRate * 0.7));
}

function determineKycStatus(complianceChecks: any[], riskScore: number): 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'REJECTED' | 'UNDER_REVIEW' {
  const failedChecks = complianceChecks.filter(check => check.status === 'FAILED');
  const criticalChecks = ['IDENTITY_VERIFICATION', 'AGE_VERIFICATION'];
  const criticalFailures = failedChecks.filter(check => criticalChecks.includes(check.check));
  
  if (criticalFailures.length > 0) {
    return 'REJECTED';
  }
  
  if (riskScore > 0.8) {
    return 'UNDER_REVIEW';
  }
  
  if (failedChecks.length === 0) {
    return 'VERIFIED';
  }
  
  return 'UNDER_REVIEW';
}

async function triggerPostVerificationProcesses(userId: string, level: string) {
  // Update transaction limits based on KYC level
  const limits = KYC_LEVELS[level as keyof typeof KYC_LEVELS];
  
  await db.collection('users').doc(userId).update({
    'profile.transactionLimits': {
      maxTransaction: limits.maxTransactionLimit,
      maxDaily: limits.maxDailyLimit,
    },
    'profile.kycLevel': level,
  });
  
  // Send verification success notification
  await sendKycSuccessNotification(userId, level);
}

async function triggerRejectionProcesses(userId: string, kycData: EnhancedKyc) {
  // Send rejection notification with reasons
  await sendKycRejectionNotification(userId, kycData);
  
  // Update user profile
  await db.collection('users').doc(userId).update({
    'profile.kycStatus': 'REJECTED',
    'profile.kycRejectionReason': 'Failed automated verification checks',
  });
}

async function sendKycSuccessNotification(userId: string, level: string) {
  // In production, send email/push notification
  console.log(`KYC verification successful for user ${userId} at level ${level}`);
}

async function sendKycRejectionNotification(userId: string, kycData: EnhancedKyc) {
  // In production, send email/push notification with rejection reasons
  console.log(`KYC verification rejected for user ${userId}`);
} 