import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';

const db = admin.firestore();

// Risk Assessment Schema
const RiskAssessmentSchema = z.object({
  userId: z.string(),
  assessmentType: z.enum(['KYC', 'TRANSACTION', 'BEHAVIORAL']),
  riskFactors: z.array(z.object({
    factor: z.string(),
    score: z.number().min(0).max(1),
    weight: z.number().min(0).max(1),
    description: z.string(),
  })),
  overallRiskScore: z.number().min(0).max(1),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  recommendations: z.array(z.string()),
  assessmentDate: z.date(),
});

export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>;

// Risk Factors Configuration
const RISK_FACTORS = {
  // KYC Risk Factors
  KYC: {
    DOCUMENT_QUALITY: { factor: 'Document Quality', weight: 0.3 },
    LIVENESS_VERIFICATION: { factor: 'Liveness Verification', weight: 0.25 },
    DATA_CONSISTENCY: { factor: 'Data Consistency', weight: 0.2 },
    AGE_VERIFICATION: { factor: 'Age Verification', weight: 0.15 },
    ADDRESS_VERIFICATION: { factor: 'Address Verification', weight: 0.1 },
  },
  // Transaction Risk Factors
  TRANSACTION: {
    AMOUNT_FREQUENCY: { factor: 'Amount & Frequency', weight: 0.3 },
    RECIPIENT_RISK: { factor: 'Recipient Risk', weight: 0.25 },
    PATTERN_ANOMALY: { factor: 'Pattern Anomaly', weight: 0.2 },
    LOCATION_RISK: { factor: 'Location Risk', weight: 0.15 },
    TIME_RISK: { factor: 'Time-based Risk', weight: 0.1 },
  },
  // Behavioral Risk Factors
  BEHAVIORAL: {
    LOGIN_PATTERNS: { factor: 'Login Patterns', weight: 0.25 },
    DEVICE_RISK: { factor: 'Device Risk', weight: 0.2 },
    ACTIVITY_FREQUENCY: { factor: 'Activity Frequency', weight: 0.2 },
    SOCIAL_CONNECTIONS: { factor: 'Social Connections', weight: 0.15 },
    APP_USAGE: { factor: 'App Usage Patterns', weight: 0.2 },
  },
};

/**
 * Comprehensive AML Risk Assessment Function
 * Evaluates users based on multiple risk factors and assigns risk scores
 */
export const assessAmlRisk = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const { userId, assessmentType } = z.object({
    userId: z.string(),
    assessmentType: z.enum(['KYC', 'TRANSACTION', 'BEHAVIORAL']),
  }).parse(data);

  try {
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found.');
    }

    const userData = userDoc.data();
    const riskFactors = await calculateRiskFactors(userId, assessmentType, userData);
    const overallRiskScore = calculateOverallRiskScore(riskFactors);
    const riskLevel = determineRiskLevel(overallRiskScore);
    const recommendations = generateRecommendations(riskFactors, riskLevel);

    const assessment: RiskAssessment = {
      userId,
      assessmentType,
      riskFactors,
      overallRiskScore,
      riskLevel,
      recommendations,
      assessmentDate: new Date(),
    };

    // Store assessment in Firestore
    await db.collection('riskAssessments').doc(userId).set({
      [assessmentType.toLowerCase()]: assessment,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // Update user's risk profile
    await db.collection('users').doc(userId).update({
      'profile.riskLevel': riskLevel,
      'profile.lastRiskAssessment': admin.firestore.FieldValue.serverTimestamp(),
    });

    // Trigger alerts for high-risk users
    if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
      await triggerRiskAlert(userId, assessment);
    }

    return {
      success: true,
      assessment,
      message: `Risk assessment completed. Level: ${riskLevel}`,
    };

  } catch (error: any) {
    console.error('Error in AML risk assessment:', error);
    throw new functions.https.HttpsError('internal', 'Failed to assess AML risk.', error.message);
  }
});

/**
 * Calculate risk factors based on assessment type
 */
async function calculateRiskFactors(userId: string, assessmentType: string, userData: any) {
  const factors = RISK_FACTORS[assessmentType as keyof typeof RISK_FACTORS];
  const riskFactors = [];

  switch (assessmentType) {
    case 'KYC':
      riskFactors.push(
        await assessDocumentQuality(userData),
        await assessLivenessVerification(userData),
        await assessDataConsistency(userData),
        await assessAgeVerification(userData),
        await assessAddressVerification(userData)
      );
      break;

    case 'TRANSACTION':
      const transactions = await getRecentTransactions(userId);
      riskFactors.push(
        await assessAmountFrequency(transactions),
        await assessRecipientRisk(transactions),
        await assessPatternAnomaly(transactions),
        await assessLocationRisk(transactions),
        await assessTimeRisk(transactions)
      );
      break;

    case 'BEHAVIORAL':
      const behaviorData = await getBehavioralData(userId);
      riskFactors.push(
        await assessLoginPatterns(behaviorData),
        await assessDeviceRisk(behaviorData),
        await assessActivityFrequency(behaviorData),
        await assessSocialConnections(behaviorData),
        await assessAppUsage(behaviorData)
      );
      break;
  }

  return riskFactors;
}

/**
 * KYC Risk Factor Assessments
 */
async function assessDocumentQuality(userData: any) {
  const kycStatus = userData?.profile?.kycStatus;
  const kycSubmission = await getKycSubmission(userData.uid);
  
  let score = 0.5; // Default medium risk
  
  if (kycStatus === 'Verified' && kycSubmission?.documentQuality === 'HIGH') {
    score = 0.1; // Low risk
  } else if (kycStatus === 'Pending' || kycSubmission?.documentQuality === 'MEDIUM') {
    score = 0.5; // Medium risk
  } else if (kycStatus === 'Unverified' || kycSubmission?.documentQuality === 'LOW') {
    score = 0.9; // High risk
  }

  return {
    factor: 'Document Quality',
    score,
    weight: RISK_FACTORS.KYC.DOCUMENT_QUALITY.weight,
    description: `Document quality assessment based on KYC status: ${kycStatus}`,
  };
}

async function assessLivenessVerification(userData: any) {
  const kycSubmission = await getKycSubmission(userData.uid);
  const hasVideoVerification = kycSubmission?.videoVerificationStatus === 'approved';
  
  return {
    factor: 'Liveness Verification',
    score: hasVideoVerification ? 0.1 : 0.8,
    weight: RISK_FACTORS.KYC.LIVENESS_VERIFICATION.weight,
    description: hasVideoVerification ? 'Video verification completed' : 'No video verification',
  };
}

async function assessDataConsistency(userData: any) {
  const profile = userData?.profile;
  const inconsistencies = [];
  
  if (!profile?.fullName) inconsistencies.push('Missing name');
  if (!profile?.dob) inconsistencies.push('Missing DOB');
  if (!profile?.address) inconsistencies.push('Missing address');
  
  const score = inconsistencies.length === 0 ? 0.1 : Math.min(0.9, inconsistencies.length * 0.3);
  
  return {
    factor: 'Data Consistency',
    score,
    weight: RISK_FACTORS.KYC.DATA_CONSISTENCY.weight,
    description: inconsistencies.length === 0 ? 'All required data present' : `Missing: ${inconsistencies.join(', ')}`,
  };
}

async function assessAgeVerification(userData: any) {
  const dob = userData?.profile?.dob;
  if (!dob) {
    return {
      factor: 'Age Verification',
      score: 0.9,
      weight: RISK_FACTORS.KYC.AGE_VERIFICATION.weight,
      description: 'Date of birth not provided',
    };
  }

  const age = calculateAge(dob);
  const isAdult = age >= 18;
  
  return {
    factor: 'Age Verification',
    score: isAdult ? 0.1 : 0.9,
    weight: RISK_FACTORS.KYC.AGE_VERIFICATION.weight,
    description: isAdult ? `Age verified: ${age} years old` : `Underage: ${age} years old`,
  };
}

async function assessAddressVerification(userData: any) {
  const address = userData?.profile?.address;
  const isPhilippinesAddress = address?.toLowerCase().includes('philippines') || 
                              address?.toLowerCase().includes('ph');
  
  return {
    factor: 'Address Verification',
    score: address && isPhilippinesAddress ? 0.2 : 0.7,
    weight: RISK_FACTORS.KYC.ADDRESS_VERIFICATION.weight,
    description: address ? `Address provided: ${address.substring(0, 50)}...` : 'No address provided',
  };
}

/**
 * Transaction Risk Factor Assessments
 */
async function assessAmountFrequency(transactions: any[]) {
  const totalAmount = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  const avgAmount = totalAmount / transactions.length;
  const highValueThreshold = 50000; // PHP 50k
  
  let score = 0.3; // Default low risk
  
  if (avgAmount > highValueThreshold) {
    score = 0.8; // High risk
  } else if (avgAmount > highValueThreshold * 0.5) {
    score = 0.5; // Medium risk
  }
  
  return {
    factor: 'Amount & Frequency',
    score,
    weight: RISK_FACTORS.TRANSACTION.AMOUNT_FREQUENCY.weight,
    description: `Average transaction amount: PHP ${avgAmount.toFixed(2)}`,
  };
}

async function assessRecipientRisk(transactions: any[]) {
  const uniqueRecipients = new Set(transactions.map(tx => tx.recipientUid || tx.recipientMobile));
  const recipientCount = uniqueRecipients.size;
  
  let score = 0.3; // Default low risk
  
  if (recipientCount > 20) {
    score = 0.8; // High risk - many different recipients
  } else if (recipientCount > 10) {
    score = 0.5; // Medium risk
  }
  
  return {
    factor: 'Recipient Risk',
    score,
    weight: RISK_FACTORS.TRANSACTION.RECIPIENT_RISK.weight,
    description: `Transactions with ${recipientCount} unique recipients`,
  };
}

async function assessPatternAnomaly(transactions: any[]) {
  // Simple pattern analysis - in production, use ML models
  const amounts = transactions.map(tx => tx.amount).filter(Boolean);
  const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
  const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);
  
  const highVarianceThreshold = avgAmount * 2;
  const score = stdDev > highVarianceThreshold ? 0.7 : 0.3;
  
  return {
    factor: 'Pattern Anomaly',
    score,
    weight: RISK_FACTORS.TRANSACTION.PATTERN_ANOMALY.weight,
    description: `Transaction pattern variance: ${(stdDev / avgAmount * 100).toFixed(1)}%`,
  };
}

async function assessLocationRisk(transactions: any[]) {
  // Mock location risk - in production, use IP geolocation
  const foreignTransactions = transactions.filter(tx => tx.location === 'FOREIGN');
  const foreignRatio = foreignTransactions.length / transactions.length;
  
  return {
    factor: 'Location Risk',
    score: foreignRatio > 0.5 ? 0.6 : 0.3,
    weight: RISK_FACTORS.TRANSACTION.LOCATION_RISK.weight,
    description: `${(foreignRatio * 100).toFixed(1)}% of transactions are foreign`,
  };
}

async function assessTimeRisk(transactions: any[]) {
  // Mock time risk - in production, analyze transaction timing patterns
  const nightTransactions = transactions.filter(tx => {
    const hour = new Date(tx.date?.toDate()).getHours();
    return hour >= 22 || hour <= 6;
  });
  
  const nightRatio = nightTransactions.length / transactions.length;
  
  return {
    factor: 'Time-based Risk',
    score: nightRatio > 0.3 ? 0.6 : 0.3,
    weight: RISK_FACTORS.TRANSACTION.TIME_RISK.weight,
    description: `${(nightRatio * 100).toFixed(1)}% of transactions during night hours`,
  };
}

/**
 * Behavioral Risk Factor Assessments
 */
async function assessLoginPatterns(behaviorData: any) {
  // Mock login pattern analysis
  const loginCount = behaviorData?.loginCount || 0;
  const avgLoginsPerDay = loginCount / 30; // Assuming 30 days
  
  return {
    factor: 'Login Patterns',
    score: avgLoginsPerDay > 10 ? 0.6 : 0.3,
    weight: RISK_FACTORS.BEHAVIORAL.LOGIN_PATTERNS.weight,
    description: `Average ${avgLoginsPerDay.toFixed(1)} logins per day`,
  };
}

async function assessDeviceRisk(behaviorData: any) {
  const deviceCount = behaviorData?.uniqueDevices || 1;
  
  return {
    factor: 'Device Risk',
    score: deviceCount > 5 ? 0.7 : 0.3,
    weight: RISK_FACTORS.BEHAVIORAL.DEVICE_RISK.weight,
    description: `Using ${deviceCount} unique devices`,
  };
}

async function assessActivityFrequency(behaviorData: any) {
  const activityScore = behaviorData?.activityScore || 0.5;
  
  return {
    factor: 'Activity Frequency',
    score: activityScore,
    weight: RISK_FACTORS.BEHAVIORAL.ACTIVITY_FREQUENCY.weight,
    description: `Activity frequency score: ${(activityScore * 100).toFixed(1)}%`,
  };
}

async function assessSocialConnections(behaviorData: any) {
  const connectionCount = behaviorData?.socialConnections || 0;
  
  return {
    factor: 'Social Connections',
    score: connectionCount > 100 ? 0.6 : 0.3,
    weight: RISK_FACTORS.BEHAVIORAL.SOCIAL_CONNECTIONS.weight,
    description: `${connectionCount} social connections`,
  };
}

async function assessAppUsage(behaviorData: any) {
  const usagePattern = behaviorData?.usagePattern || 'NORMAL';
  
  return {
    factor: 'App Usage Patterns',
    score: usagePattern === 'ABNORMAL' ? 0.7 : 0.3,
    weight: RISK_FACTORS.BEHAVIORAL.APP_USAGE.weight,
    description: `Usage pattern: ${usagePattern}`,
  };
}

/**
 * Helper Functions
 */
function calculateOverallRiskScore(riskFactors: any[]) {
  const weightedSum = riskFactors.reduce((sum, factor) => {
    return sum + (factor.score * factor.weight);
  }, 0);
  
  const totalWeight = riskFactors.reduce((sum, factor) => sum + factor.weight, 0);
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

function determineRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score < 0.3) return 'LOW';
  if (score < 0.6) return 'MEDIUM';
  if (score < 0.8) return 'HIGH';
  return 'CRITICAL';
}

function generateRecommendations(riskFactors: any[], riskLevel: string): string[] {
  const recommendations = [];
  
  if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
    recommendations.push('Manual review required');
    recommendations.push('Enhanced due diligence recommended');
  }
  
  const highRiskFactors = riskFactors.filter(f => f.score > 0.7);
  highRiskFactors.forEach(factor => {
    recommendations.push(`Address ${factor.factor} concerns`);
  });
  
  if (riskLevel === 'LOW') {
    recommendations.push('Standard monitoring sufficient');
  }
  
  return recommendations;
}

async function triggerRiskAlert(userId: string, assessment: RiskAssessment) {
  // Send alert to compliance team
  await db.collection('alerts').add({
    type: 'HIGH_RISK_USER',
    userId,
    assessment,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'PENDING_REVIEW',
  });
}

// Helper functions for data retrieval
async function getKycSubmission(userId: string) {
  const doc = await db.collection('kycSubmissions').doc(userId).get();
  return doc.exists ? doc.data() : null;
}

async function getRecentTransactions(userId: string) {
  const snapshot = await db.collection('transactions')
    .where('userId', '==', userId)
    .orderBy('date', 'desc')
    .limit(100)
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function getBehavioralData(userId: string) {
  // Mock behavioral data - in production, collect real behavioral metrics
  return {
    loginCount: Math.floor(Math.random() * 50) + 10,
    uniqueDevices: Math.floor(Math.random() * 5) + 1,
    activityScore: Math.random(),
    socialConnections: Math.floor(Math.random() * 200),
    usagePattern: Math.random() > 0.8 ? 'ABNORMAL' : 'NORMAL',
  };
}

function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
} 