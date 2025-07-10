import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';

const db = admin.firestore();

// Compliance Monitoring Schema
const ComplianceReportSchema = z.object({
  reportId: z.string(),
  reportType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL']),
  period: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }),
  metrics: z.object({
    totalUsers: z.number(),
    totalTransactions: z.number(),
    totalVolume: z.number(),
    kycComplianceRate: z.number(),
    suspiciousActivityCount: z.number(),
    riskAssessmentCount: z.number(),
  }),
  alerts: z.array(z.object({
    type: z.string(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    description: z.string(),
    timestamp: z.date(),
  })),
  recommendations: z.array(z.string()),
  generatedAt: z.date(),
});

export type ComplianceReport = z.infer<typeof ComplianceReportSchema>;

// BSP/AMLC Compliance Requirements
const COMPLIANCE_REQUIREMENTS = {
  KYC: {
    REQUIRED_FIELDS: ['fullName', 'dob', 'address', 'nationality'],
    VERIFICATION_METHODS: ['DOCUMENT', 'VIDEO', 'BIOMETRIC'],
    RETENTION_PERIOD: 5, // years
  },
  TRANSACTION_MONITORING: {
    THRESHOLD_AMOUNTS: {
      DAILY: 500000, // PHP 500k
      MONTHLY: 2000000, // PHP 2M
    },
    SUSPICIOUS_PATTERNS: [
      'STRUCTURED_TRANSACTIONS',
      'RAPID_MOVEMENT',
      'UNUSUAL_AMOUNTS',
      'HIGH_FREQUENCY',
    ],
  },
  REPORTING: {
    CTR_THRESHOLD: 500000, // Cash Transaction Report threshold
    STR_THRESHOLD: 500000, // Suspicious Transaction Report threshold
    REPORTING_DEADLINE: 7, // days
  },
};

/**
 * Generate Comprehensive Compliance Report
 * Monitors all compliance metrics and generates regulatory reports
 */
export const generateComplianceReport = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== 'ADMIN') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required.');
  }

  const { reportType, startDate, endDate } = z.object({
    reportType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL']),
    startDate: z.string(),
    endDate: z.string(),
  }).parse(data);

  try {
    const period = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    // Collect compliance metrics
    const metrics = await collectComplianceMetrics(period);
    const alerts = await generateComplianceAlerts(metrics, period);
    const recommendations = generateComplianceRecommendations(metrics, alerts);

    const report: ComplianceReport = {
      reportId: `COMPLIANCE_${reportType}_${Date.now()}`,
      reportType,
      period,
      metrics,
      alerts,
      recommendations,
      generatedAt: new Date(),
    };

    // Store report in Firestore
    await db.collection('complianceReports').doc(report.reportId).set(report);

    // Send to regulatory authorities if required
    if (reportType === 'MONTHLY' || reportType === 'QUARTERLY') {
      await submitToRegulatoryAuthorities(report);
    }

    return {
      success: true,
      report,
      message: `Compliance report generated successfully.`,
    };

  } catch (error: any) {
    console.error('Error generating compliance report:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate compliance report.', error.message);
  }
});

/**
 * Monitor Suspicious Transactions
 * Real-time monitoring for AML compliance
 */
export const monitorSuspiciousTransactions = functions.firestore
  .document('transactions/{transactionId}')
  .onCreate(async (snap, context) => {
    const transaction = snap.data();
    
    try {
      const suspiciousFlags = await detectSuspiciousActivity(transaction);
      
      if (suspiciousFlags.length > 0) {
        await flagSuspiciousTransaction(transaction, suspiciousFlags);
        
        // Check if STR (Suspicious Transaction Report) is required
        if (await shouldGenerateSTR(transaction, suspiciousFlags)) {
          await generateSuspiciousTransactionReport(transaction, suspiciousFlags);
        }
      }
      
    } catch (error) {
      console.error('Error monitoring suspicious transactions:', error);
    }
  });

/**
 * Daily Compliance Check
 * Scheduled function to run daily compliance checks
 */
export const dailyComplianceCheck = functions.pubsub
  .schedule('0 6 * * *') // 6 AM daily
  .timeZone('Asia/Manila')
  .onRun(async (context) => {
    try {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      const period = {
        startDate: yesterday,
        endDate: today,
      };

      const metrics = await collectComplianceMetrics(period);
      const alerts = await generateComplianceAlerts(metrics, period);
      
      // Store daily compliance snapshot
      await db.collection('complianceSnapshots').add({
        date: today,
        metrics,
        alerts,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Send alerts for critical issues
      const criticalAlerts = alerts.filter(alert => alert.severity === 'CRITICAL');
      if (criticalAlerts.length > 0) {
        await sendComplianceAlert(criticalAlerts);
      }

      console.log('Daily compliance check completed successfully');
      
    } catch (error) {
      console.error('Error in daily compliance check:', error);
    }
  });

/**
 * Collect Compliance Metrics
 */
async function collectComplianceMetrics(period: { startDate: Date; endDate: Date }) {
  const startTimestamp = admin.firestore.Timestamp.fromDate(period.startDate);
  const endTimestamp = admin.firestore.Timestamp.fromDate(period.endDate);

  // Get user metrics
  const usersSnapshot = await db.collection('users')
    .where('createdAt', '>=', startTimestamp)
    .where('createdAt', '<=', endTimestamp)
    .get();

  const totalUsers = usersSnapshot.size;
  const kycCompliantUsers = usersSnapshot.docs.filter(doc => 
    doc.data()?.profile?.kycStatus === 'Verified'
  ).length;

  // Get transaction metrics
  const transactionsSnapshot = await db.collection('transactions')
    .where('date', '>=', startTimestamp)
    .where('date', '<=', endTimestamp)
    .get();

  const totalTransactions = transactionsSnapshot.size;
  const totalVolume = transactionsSnapshot.docs.reduce((sum, doc) => 
    sum + (doc.data()?.amount || 0), 0
  );

  // Get risk assessment metrics
  const riskAssessmentsSnapshot = await db.collection('riskAssessments')
    .where('updatedAt', '>=', startTimestamp)
    .where('updatedAt', '<=', endTimestamp)
    .get();

  const riskAssessmentCount = riskAssessmentsSnapshot.size;

  // Get suspicious activity count
  const suspiciousActivitySnapshot = await db.collection('suspiciousActivity')
    .where('detectedAt', '>=', startTimestamp)
    .where('detectedAt', '<=', endTimestamp)
    .get();

  const suspiciousActivityCount = suspiciousActivitySnapshot.size;

  return {
    totalUsers,
    totalTransactions,
    totalVolume,
    kycComplianceRate: totalUsers > 0 ? (kycCompliantUsers / totalUsers) * 100 : 0,
    suspiciousActivityCount,
    riskAssessmentCount,
  };
}

/**
 * Generate Compliance Alerts
 */
async function generateComplianceAlerts(metrics: any, period: { startDate: Date; endDate: Date }) {
  const alerts = [];

  // KYC Compliance Alert
  if (metrics.kycComplianceRate < 80) {
    alerts.push({
      type: 'KYC_COMPLIANCE_LOW',
      severity: 'HIGH',
      description: `KYC compliance rate is ${metrics.kycComplianceRate.toFixed(1)}%, below the 80% threshold.`,
      timestamp: new Date(),
    });
  }

  // High Volume Alert
  if (metrics.totalVolume > COMPLIANCE_REQUIREMENTS.TRANSACTION_MONITORING.THRESHOLD_AMOUNTS.DAILY) {
    alerts.push({
      type: 'HIGH_VOLUME_ALERT',
      severity: 'MEDIUM',
      description: `Daily transaction volume (PHP ${metrics.totalVolume.toLocaleString()}) exceeds threshold.`,
      timestamp: new Date(),
    });
  }

  // Suspicious Activity Alert
  if (metrics.suspiciousActivityCount > 10) {
    alerts.push({
      type: 'HIGH_SUSPICIOUS_ACTIVITY',
      severity: 'CRITICAL',
      description: `${metrics.suspiciousActivityCount} suspicious activities detected in the period.`,
      timestamp: new Date(),
    });
  }

  // Risk Assessment Alert
  if (metrics.riskAssessmentCount === 0) {
    alerts.push({
      type: 'NO_RISK_ASSESSMENTS',
      severity: 'MEDIUM',
      description: 'No risk assessments performed in the period.',
      timestamp: new Date(),
    });
  }

  return alerts;
}

/**
 * Generate Compliance Recommendations
 */
function generateComplianceRecommendations(metrics: any, alerts: any[]) {
  const recommendations = [];

  if (metrics.kycComplianceRate < 80) {
    recommendations.push('Implement automated KYC reminders for incomplete profiles');
    recommendations.push('Review KYC process efficiency and user experience');
  }

  if (metrics.suspiciousActivityCount > 10) {
    recommendations.push('Enhance transaction monitoring algorithms');
    recommendations.push('Review and update suspicious activity detection rules');
  }

  if (metrics.riskAssessmentCount === 0) {
    recommendations.push('Implement automated risk assessment triggers');
    recommendations.push('Schedule regular risk assessment reviews');
  }

  if (metrics.totalVolume > COMPLIANCE_REQUIREMENTS.TRANSACTION_MONITORING.THRESHOLD_AMOUNTS.DAILY) {
    recommendations.push('Review transaction volume patterns');
    recommendations.push('Consider implementing additional monitoring for high-volume periods');
  }

  return recommendations;
}

/**
 * Detect Suspicious Activity
 */
async function detectSuspiciousActivity(transaction: any) {
  const flags = [];

  // Check for structured transactions (avoiding reporting thresholds)
  if (transaction.amount >= 490000 && transaction.amount <= 500000) {
    flags.push('STRUCTURED_TRANSACTION');
  }

  // Check for rapid movement of funds
  const userTransactions = await getRecentUserTransactions(transaction.userId, 24); // 24 hours
  const totalAmount = userTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  
  if (totalAmount > 1000000) { // PHP 1M in 24 hours
    flags.push('RAPID_FUND_MOVEMENT');
  }

  // Check for unusual amounts
  if (transaction.amount > 500000) { // PHP 500k single transaction
    flags.push('UNUSUAL_AMOUNT');
  }

  // Check for high frequency transactions
  if (userTransactions.length > 20) { // More than 20 transactions in 24 hours
    flags.push('HIGH_FREQUENCY');
  }

  // Check for multiple recipients
  const uniqueRecipients = new Set(userTransactions.map(tx => tx.recipientUid || tx.recipientMobile));
  if (uniqueRecipients.size > 10) { // More than 10 unique recipients
    flags.push('MULTIPLE_RECIPIENTS');
  }

  return flags;
}

/**
 * Flag Suspicious Transaction
 */
async function flagSuspiciousTransaction(transaction: any, flags: string[]) {
  await db.collection('suspiciousActivity').add({
    transactionId: transaction.id,
    userId: transaction.userId,
    flags,
    amount: transaction.amount,
    timestamp: transaction.date,
    detectedAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'PENDING_REVIEW',
  });

  // Update transaction with suspicious flag
  await db.collection('transactions').doc(transaction.id).update({
    suspiciousFlags: flags,
    flaggedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Check if STR (Suspicious Transaction Report) should be generated
 */
async function shouldGenerateSTR(transaction: any, flags: string[]) {
  // STR is required for transactions above threshold or with multiple flags
  return transaction.amount >= COMPLIANCE_REQUIREMENTS.REPORTING.STR_THRESHOLD || 
         flags.length >= 2;
}

/**
 * Generate Suspicious Transaction Report
 */
async function generateSuspiciousTransactionReport(transaction: any, flags: string[]) {
  const userDoc = await db.collection('users').doc(transaction.userId).get();
  const userData = userDoc.data();

  const strReport = {
    reportId: `STR_${Date.now()}`,
    transactionId: transaction.id,
    userId: transaction.userId,
    userDetails: {
      fullName: userData?.profile?.fullName,
      mobileNumber: userData?.mobileNumber,
      kycStatus: userData?.profile?.kycStatus,
    },
    transactionDetails: {
      amount: transaction.amount,
      type: transaction.type,
      timestamp: transaction.date,
      recipient: transaction.recipientUid || transaction.recipientMobile,
    },
    suspiciousFlags: flags,
    reportDate: admin.firestore.FieldValue.serverTimestamp(),
    status: 'PENDING_SUBMISSION',
  };

  await db.collection('suspiciousTransactionReports').add(strReport);

  // Schedule submission to AMLC
  await scheduleSTRSubmission(strReport);
}

/**
 * Schedule STR Submission to AMLC
 */
async function scheduleSTRSubmission(strReport: any) {
  // In production, this would integrate with AMLC's reporting system
  // For now, we'll store it for manual submission
  console.log('STR Report generated:', strReport.reportId);
  
  // Send notification to compliance team
  await sendSTRNotification(strReport);
}

/**
 * Submit Report to Regulatory Authorities
 */
async function submitToRegulatoryAuthorities(report: ComplianceReport) {
  // In production, this would integrate with BSP and AMLC APIs
  // For now, we'll log the submission
  console.log('Submitting compliance report to regulatory authorities:', report.reportId);
  
  // Update report status
  await db.collection('complianceReports').doc(report.reportId).update({
    submittedToAuthorities: true,
    submittedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Send Compliance Alert
 */
async function sendComplianceAlert(alerts: any[]) {
  // In production, this would send emails/notifications to compliance team
  console.log('Sending compliance alerts:', alerts);
  
  // Store alerts for review
  await db.collection('complianceAlerts').add({
    alerts,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'PENDING_REVIEW',
  });
}

/**
 * Send STR Notification
 */
async function sendSTRNotification(strReport: any) {
  // In production, this would send notification to compliance team
  console.log('STR Notification:', strReport.reportId);
}

/**
 * Helper Functions
 */
async function getRecentUserTransactions(userId: string, hours: number) {
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffTime);
  
  const snapshot = await db.collection('transactions')
    .where('userId', '==', userId)
    .where('date', '>=', cutoffTimestamp)
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
} 