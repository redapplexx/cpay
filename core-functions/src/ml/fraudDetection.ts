import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';

const db = admin.firestore();

// Fraud Detection Schema
const FraudDetectionSchema = z.object({
  transactionId: z.string(),
  userId: z.string(),
  amount: z.number(),
  recipientId: z.string(),
  timestamp: z.date(),
  features: z.object({
    amount: z.number(),
    timeOfDay: z.number(),
    dayOfWeek: z.number(),
    transactionFrequency: z.number(),
    recipientRisk: z.number(),
    locationRisk: z.number(),
    deviceRisk: z.number(),
    userBehaviorScore: z.number(),
  }),
  prediction: z.object({
    fraudProbability: z.number(),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    confidence: z.number(),
    features: z.array(z.string()),
  }),
  createdAt: z.date(),
});

export type FraudDetection = z.infer<typeof FraudDetectionSchema>;

// ML Model Configuration
const ML_CONFIG = {
  FRAUD_THRESHOLD: 0.7,
  HIGH_RISK_THRESHOLD: 0.5,
  FEATURE_WEIGHTS: {
    amount: 0.25,
    timeOfDay: 0.15,
    dayOfWeek: 0.10,
    transactionFrequency: 0.20,
    recipientRisk: 0.15,
    locationRisk: 0.10,
    deviceRisk: 0.05,
  },
  ANOMALY_DETECTION: {
    AMOUNT_THRESHOLD: 500000, // PHP 500k
    FREQUENCY_THRESHOLD: 20, // transactions per day
    TIME_WINDOW: 24, // hours
  },
};

/**
 * ML-Powered Fraud Detection Function
 * Uses machine learning to detect fraudulent transactions in real-time
 */
export const detectFraudWithML = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const { transactionId, userId, amount, recipientId, timestamp } = z.object({
    transactionId: z.string(),
    userId: z.string(),
    amount: z.number(),
    recipientId: z.string(),
    timestamp: z.string(),
  }).parse(data);

  try {
    // Extract features for ML model
    const features = await extractTransactionFeatures(userId, amount, recipientId, new Date(timestamp));
    
    // Run ML prediction
    const prediction = await runFraudPrediction(features);
    
    // Store fraud detection result
    const fraudDetection: FraudDetection = {
      transactionId,
      userId,
      amount,
      recipientId,
      timestamp: new Date(timestamp),
      features,
      prediction,
      createdAt: new Date(),
    };

    await db.collection('fraudDetections').doc(transactionId).set(fraudDetection);

    // Update transaction with fraud detection result
    await db.collection('transactions').doc(transactionId).update({
      fraudDetection: {
        fraudProbability: prediction.fraudProbability,
        riskLevel: prediction.riskLevel,
        confidence: prediction.confidence,
        detectedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    });

    // Trigger alerts for high-risk transactions
    if (prediction.riskLevel === 'HIGH' || prediction.riskLevel === 'CRITICAL') {
      await triggerFraudAlert(fraudDetection);
    }

    return {
      success: true,
      fraudDetection,
      message: `Fraud detection completed. Risk level: ${prediction.riskLevel}`,
    };

  } catch (error: any) {
    console.error('Error in fraud detection:', error);
    throw new functions.https.HttpsError('internal', 'Failed to detect fraud.', error.message);
  }
});

/**
 * Extract Features for ML Model
 */
async function extractTransactionFeatures(userId: string, amount: number, recipientId: string, timestamp: Date) {
  // Get user's transaction history
  const userTransactions = await getUserTransactionHistory(userId, 30); // Last 30 days
  
  // Get recipient's risk profile
  const recipientRisk = await getRecipientRiskScore(recipientId);
  
  // Get user's behavioral patterns
  const userBehavior = await getUserBehaviorPatterns(userId);
  
  // Calculate time-based features
  const timeOfDay = timestamp.getHours();
  const dayOfWeek = timestamp.getDay();
  
  // Calculate transaction frequency
  const recentTransactions = userTransactions.filter(tx => 
    (Date.now() - tx.timestamp.toDate().getTime()) < ML_CONFIG.ANOMALY_DETECTION.TIME_WINDOW * 60 * 60 * 1000
  );
  const transactionFrequency = recentTransactions.length;
  
  // Calculate location risk (mock - in production, use IP geolocation)
  const locationRisk = await calculateLocationRisk(userId, timestamp);
  
  // Calculate device risk
  const deviceRisk = await calculateDeviceRisk(userId);
  
  return {
    amount: normalizeAmount(amount),
    timeOfDay: normalizeTimeOfDay(timeOfDay),
    dayOfWeek: normalizeDayOfWeek(dayOfWeek),
    transactionFrequency: normalizeFrequency(transactionFrequency),
    recipientRisk,
    locationRisk,
    deviceRisk,
    userBehaviorScore: userBehavior.riskScore,
  };
}

/**
 * Run ML Fraud Prediction
 * Uses a simplified ML model - in production, use TensorFlow.js or Firebase ML Kit
 */
async function runFraudPrediction(features: any) {
  // Calculate weighted risk score
  const weights = ML_CONFIG.FEATURE_WEIGHTS;
  const riskScore = 
    features.amount * weights.amount +
    features.timeOfDay * weights.timeOfDay +
    features.dayOfWeek * weights.dayOfWeek +
    features.transactionFrequency * weights.transactionFrequency +
    features.recipientRisk * weights.recipientRisk +
    features.locationRisk * weights.locationRisk +
    features.deviceRisk * weights.deviceRisk;

  // Apply sigmoid function to get probability
  const fraudProbability = 1 / (1 + Math.exp(-riskScore));
  
  // Determine risk level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  if (fraudProbability < 0.3) {
    riskLevel = 'LOW';
  } else if (fraudProbability < 0.5) {
    riskLevel = 'MEDIUM';
  } else if (fraudProbability < 0.7) {
    riskLevel = 'HIGH';
  } else {
    riskLevel = 'CRITICAL';
  }

  // Identify contributing features
  const contributingFeatures = [];
  if (features.amount > 0.7) contributingFeatures.push('HIGH_AMOUNT');
  if (features.transactionFrequency > 0.8) contributingFeatures.push('HIGH_FREQUENCY');
  if (features.recipientRisk > 0.6) contributingFeatures.push('RISKY_RECIPIENT');
  if (features.locationRisk > 0.5) contributingFeatures.push('SUSPICIOUS_LOCATION');
  if (features.deviceRisk > 0.4) contributingFeatures.push('DEVICE_RISK');

  return {
    fraudProbability,
    riskLevel,
    confidence: Math.min(0.95, fraudProbability + 0.1), // Confidence based on probability
    features: contributingFeatures,
  };
}

/**
 * User Behavior Analysis with ML
 */
export const analyzeUserBehavior = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const { userId } = z.object({
    userId: z.string(),
  }).parse(data);

  try {
    const behaviorPatterns = await getUserBehaviorPatterns(userId);
    const anomalyScore = await detectBehavioralAnomalies(userId, behaviorPatterns);
    
    // Store behavior analysis
    await db.collection('userBehaviorAnalysis').doc(userId).set({
      userId,
      patterns: behaviorPatterns,
      anomalyScore,
      analyzedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      behaviorAnalysis: {
        patterns: behaviorPatterns,
        anomalyScore,
        riskLevel: anomalyScore > 0.7 ? 'HIGH' : anomalyScore > 0.4 ? 'MEDIUM' : 'LOW',
      },
    };

  } catch (error: any) {
    console.error('Error in behavior analysis:', error);
    throw new functions.https.HttpsError('internal', 'Failed to analyze user behavior.', error.message);
  }
});

/**
 * ML-Powered Risk Assessment
 */
export const assessRiskWithML = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const { userId, assessmentType } = z.object({
    userId: z.string(),
    assessmentType: z.enum(['KYC', 'TRANSACTION', 'BEHAVIORAL']),
  }).parse(data);

  try {
    let riskScore = 0;
    let riskFactors = [];

    switch (assessmentType) {
      case 'KYC':
        const kycData = await getKycData(userId);
        riskScore = await calculateKycRiskScore(kycData);
        riskFactors = await identifyKycRiskFactors(kycData);
        break;

      case 'TRANSACTION':
        const transactionData = await getTransactionData(userId);
        riskScore = await calculateTransactionRiskScore(transactionData);
        riskFactors = await identifyTransactionRiskFactors(transactionData);
        break;

      case 'BEHAVIORAL':
        const behaviorData = await getBehaviorData(userId);
        riskScore = await calculateBehavioralRiskScore(behaviorData);
        riskFactors = await identifyBehavioralRiskFactors(behaviorData);
        break;
    }

    // Store ML risk assessment
    await db.collection('mlRiskAssessments').add({
      userId,
      assessmentType,
      riskScore,
      riskFactors,
      assessedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      riskAssessment: {
        riskScore,
        riskFactors,
        riskLevel: riskScore > 0.7 ? 'HIGH' : riskScore > 0.4 ? 'MEDIUM' : 'LOW',
      },
    };

  } catch (error: any) {
    console.error('Error in ML risk assessment:', error);
    throw new functions.https.HttpsError('internal', 'Failed to assess risk with ML.', error.message);
  }
});

/**
 * Helper Functions
 */
async function getUserTransactionHistory(userId: string, days: number) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);
  
  const snapshot = await db.collection('transactions')
    .where('userId', '==', userId)
    .where('date', '>=', cutoffTimestamp)
    .orderBy('date', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function getRecipientRiskScore(recipientId: string) {
  // Mock recipient risk calculation
  // In production, analyze recipient's transaction history and risk factors
  const recipientDoc = await db.collection('users').doc(recipientId).get();
  const recipientData = recipientDoc.data();
  
  let riskScore = 0.3; // Base risk
  
  if (recipientData?.profile?.kycStatus !== 'Verified') {
    riskScore += 0.3;
  }
  
  if (recipientData?.profile?.riskLevel === 'HIGH') {
    riskScore += 0.4;
  }
  
  return Math.min(1, riskScore);
}

async function getUserBehaviorPatterns(userId: string) {
  const transactions = await getUserTransactionHistory(userId, 90);
  
  // Calculate behavioral patterns
  const patterns = {
    avgTransactionAmount: 0,
    transactionFrequency: 0,
    preferredTimes: [] as number[],
    preferredDays: [] as number[],
    riskScore: 0,
  };
  
  if (transactions.length > 0) {
    const amounts = transactions.map(tx => tx.amount || 0);
    patterns.avgTransactionAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    patterns.transactionFrequency = transactions.length / 90; // transactions per day
    
    // Analyze time patterns
    const times = transactions.map(tx => new Date(tx.date?.toDate()).getHours());
    patterns.preferredTimes = times;
    
    // Analyze day patterns
    const days = transactions.map(tx => new Date(tx.date?.toDate()).getDay());
    patterns.preferredDays = days;
    
    // Calculate risk score based on patterns
    patterns.riskScore = calculateBehavioralRiskScore(patterns);
  }
  
  return patterns;
}

async function detectBehavioralAnomalies(userId: string, patterns: any) {
  // Compare current behavior with historical patterns
  const recentTransactions = await getUserTransactionHistory(userId, 7);
  
  if (recentTransactions.length === 0) return 0;
  
  let anomalyScore = 0;
  
  // Check for unusual transaction amounts
  const recentAmounts = recentTransactions.map(tx => tx.amount || 0);
  const avgRecentAmount = recentAmounts.reduce((sum, amt) => sum + amt, 0) / recentAmounts.length;
  
  if (Math.abs(avgRecentAmount - patterns.avgTransactionAmount) > patterns.avgTransactionAmount * 0.5) {
    anomalyScore += 0.3;
  }
  
  // Check for unusual frequency
  const recentFrequency = recentTransactions.length / 7;
  if (Math.abs(recentFrequency - patterns.transactionFrequency) > patterns.transactionFrequency * 0.5) {
    anomalyScore += 0.3;
  }
  
  // Check for unusual times
  const recentTimes = recentTransactions.map(tx => new Date(tx.date?.toDate()).getHours());
  const unusualTimes = recentTimes.filter(time => !patterns.preferredTimes.includes(time));
  if (unusualTimes.length > recentTimes.length * 0.5) {
    anomalyScore += 0.2;
  }
  
  return Math.min(1, anomalyScore);
}

async function calculateLocationRisk(userId: string, timestamp: Date) {
  // Mock location risk calculation
  // In production, use IP geolocation and compare with user's usual locations
  return 0.2; // Low risk by default
}

async function calculateDeviceRisk(userId: string) {
  // Mock device risk calculation
  // In production, analyze device fingerprinting and unusual device usage
  return 0.1; // Low risk by default
}

function normalizeAmount(amount: number): number {
  // Normalize amount to 0-1 scale
  const maxAmount = 1000000; // PHP 1M
  return Math.min(1, amount / maxAmount);
}

function normalizeTimeOfDay(hour: number): number {
  // Normalize time to 0-1 scale, with higher risk for unusual hours
  const unusualHours = [0, 1, 2, 3, 4, 5, 22, 23];
  return unusualHours.includes(hour) ? 0.8 : 0.2;
}

function normalizeDayOfWeek(day: number): number {
  // Normalize day to 0-1 scale, with higher risk for weekends
  return day === 0 || day === 6 ? 0.6 : 0.2; // Sunday = 0, Saturday = 6
}

function normalizeFrequency(frequency: number): number {
  // Normalize frequency to 0-1 scale
  const maxFrequency = 50; // Max transactions per day
  return Math.min(1, frequency / maxFrequency);
}

function calculateBehavioralRiskScore(patterns: any): number {
  let riskScore = 0;
  
  // High transaction frequency increases risk
  if (patterns.transactionFrequency > 5) {
    riskScore += 0.3;
  }
  
  // Unusual transaction amounts increase risk
  if (patterns.avgTransactionAmount > 100000) {
    riskScore += 0.2;
  }
  
  // Unusual time patterns increase risk
  const unusualTimes = patterns.preferredTimes.filter((time: number) => time < 6 || time > 22);
  if (unusualTimes.length > patterns.preferredTimes.length * 0.3) {
    riskScore += 0.2;
  }
  
  return Math.min(1, riskScore);
}

async function triggerFraudAlert(fraudDetection: FraudDetection) {
  // Store fraud alert
  await db.collection('fraudAlerts').add({
    transactionId: fraudDetection.transactionId,
    userId: fraudDetection.userId,
    riskLevel: fraudDetection.prediction.riskLevel,
    fraudProbability: fraudDetection.prediction.fraudProbability,
    detectedAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'PENDING_REVIEW',
  });

  // Send notification to compliance team
  console.log(`Fraud alert triggered for transaction ${fraudDetection.transactionId}`);
}

// Mock functions for risk assessment
async function getKycData(userId: string) {
  const doc = await db.collection('users').doc(userId).get();
  return doc.data();
}

async function getTransactionData(userId: string) {
  return await getUserTransactionHistory(userId, 30);
}

async function getBehaviorData(userId: string) {
  return await getUserBehaviorPatterns(userId);
}

async function calculateKycRiskScore(kycData: any): Promise<number> {
  let riskScore = 0.3;
  
  if (kycData?.profile?.kycStatus !== 'Verified') {
    riskScore += 0.4;
  }
  
  if (kycData?.profile?.riskLevel === 'HIGH') {
    riskScore += 0.3;
  }
  
  return Math.min(1, riskScore);
}

async function calculateTransactionRiskScore(transactionData: any[]): Promise<number> {
  if (transactionData.length === 0) return 0.5;
  
  let riskScore = 0.2;
  
  const totalAmount = transactionData.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  const avgAmount = totalAmount / transactionData.length;
  
  if (avgAmount > 100000) {
    riskScore += 0.3;
  }
  
  if (transactionData.length > 20) {
    riskScore += 0.2;
  }
  
  return Math.min(1, riskScore);
}

async function calculateBehavioralRiskScore(behaviorData: any): Promise<number> {
  return behaviorData.riskScore || 0.3;
}

async function identifyKycRiskFactors(kycData: any): Promise<string[]> {
  const factors = [];
  
  if (kycData?.profile?.kycStatus !== 'Verified') {
    factors.push('INCOMPLETE_KYC');
  }
  
  if (kycData?.profile?.riskLevel === 'HIGH') {
    factors.push('HIGH_RISK_PROFILE');
  }
  
  return factors;
}

async function identifyTransactionRiskFactors(transactionData: any[]): Promise<string[]> {
  const factors = [];
  
  const totalAmount = transactionData.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  
  if (totalAmount > 1000000) {
    factors.push('HIGH_VOLUME');
  }
  
  if (transactionData.length > 20) {
    factors.push('HIGH_FREQUENCY');
  }
  
  return factors;
}

async function identifyBehavioralRiskFactors(behaviorData: any): Promise<string[]> {
  const factors = [];
  
  if (behaviorData.riskScore > 0.6) {
    factors.push('UNUSUAL_BEHAVIOR');
  }
  
  if (behaviorData.transactionFrequency > 5) {
    factors.push('HIGH_FREQUENCY');
  }
  
  return factors;
} 