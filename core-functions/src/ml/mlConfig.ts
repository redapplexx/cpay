import { z } from 'zod';

// ML Configuration Schema
export const MLConfigSchema = z.object({
  models: z.object({
    fraudDetection: z.object({
      enabled: z.boolean(),
      threshold: z.number().min(0).max(1),
      features: z.array(z.string()),
      weights: z.record(z.string(), z.number()),
    }),
    userBehavior: z.object({
      enabled: z.boolean(),
      windowSize: z.number(),
      anomalyThreshold: z.number(),
      features: z.array(z.string()),
    }),
    documentVerification: z.object({
      enabled: z.boolean(),
      confidenceThreshold: z.number(),
      supportedDocuments: z.array(z.string()),
    }),
    transactionClassification: z.object({
      enabled: z.boolean(),
      categories: z.array(z.string()),
      confidenceThreshold: z.number(),
    }),
  }),
  mlKit: z.object({
    textRecognition: z.object({
      enabled: z.boolean(),
      languages: z.array(z.string()),
      confidenceThreshold: z.number(),
    }),
    faceDetection: z.object({
      enabled: z.boolean(),
      minFaceSize: z.number(),
      maxFaces: z.number(),
    }),
    documentScanning: z.object({
      enabled: z.boolean(),
      supportedFormats: z.array(z.string()),
      qualityThreshold: z.number(),
    }),
  }),
  featureEngineering: z.object({
    transactionFeatures: z.array(z.string()),
    userFeatures: z.array(z.string()),
    behavioralFeatures: z.array(z.string()),
    temporalFeatures: z.array(z.string()),
  }),
  training: z.object({
    dataRetentionDays: z.number(),
    retrainingSchedule: z.string(),
    validationSplit: z.number(),
    batchSize: z.number(),
    epochs: z.number(),
  }),
  monitoring: z.object({
    performanceThreshold: z.number(),
    alertThreshold: z.number(),
    metricsRetentionDays: z.number(),
  }),
});

export type MLConfig = z.infer<typeof MLConfigSchema>;

// Default ML Configuration
export const DEFAULT_ML_CONFIG: MLConfig = {
  models: {
    fraudDetection: {
      enabled: true,
      threshold: 0.7,
      features: [
        'amount',
        'timeOfDay',
        'dayOfWeek',
        'transactionFrequency',
        'recipientRisk',
        'locationRisk',
        'deviceRisk',
        'userBehaviorScore',
        'amountVelocity',
        'frequencyVelocity',
        'locationVelocity',
        'deviceVelocity',
        'recipientVelocity',
        'timePattern',
        'amountPattern',
        'frequencyPattern',
      ],
      weights: {
        amount: 0.25,
        timeOfDay: 0.15,
        dayOfWeek: 0.10,
        transactionFrequency: 0.20,
        recipientRisk: 0.15,
        locationRisk: 0.10,
        deviceRisk: 0.05,
        userBehaviorScore: 0.20,
        amountVelocity: 0.15,
        frequencyVelocity: 0.15,
        locationVelocity: 0.10,
        deviceVelocity: 0.05,
        recipientVelocity: 0.10,
        timePattern: 0.10,
        amountPattern: 0.15,
        frequencyPattern: 0.15,
      },
    },
    userBehavior: {
      enabled: true,
      windowSize: 30, // days
      anomalyThreshold: 0.8,
      features: [
        'loginFrequency',
        'transactionFrequency',
        'amountPattern',
        'timePattern',
        'locationPattern',
        'devicePattern',
        'recipientPattern',
        'sessionDuration',
        'appUsagePattern',
        'navigationPattern',
      ],
    },
    documentVerification: {
      enabled: true,
      confidenceThreshold: 0.8,
      supportedDocuments: [
        'ID_CARD',
        'PASSPORT',
        'DRIVERS_LICENSE',
        'UTILITY_BILL',
        'BANK_STATEMENT',
        'PAYSLIP',
        'TAX_DOCUMENT',
      ],
    },
    transactionClassification: {
      enabled: true,
      categories: [
        'P2P_TRANSFER',
        'BILL_PAYMENT',
        'CASH_IN',
        'CASH_OUT',
        'MERCHANT_PAYMENT',
        'INTERNATIONAL_TRANSFER',
        'CRYPTO_TRANSACTION',
      ],
      confidenceThreshold: 0.7,
    },
  },
  mlKit: {
    textRecognition: {
      enabled: true,
      languages: ['en', 'tl'], // English and Tagalog
      confidenceThreshold: 0.7,
    },
    faceDetection: {
      enabled: true,
      minFaceSize: 0.15,
      maxFaces: 5,
    },
    documentScanning: {
      enabled: true,
      supportedFormats: ['JPEG', 'PNG', 'PDF'],
      qualityThreshold: 0.8,
    },
  },
  featureEngineering: {
    transactionFeatures: [
      'amount',
      'currency',
      'transactionType',
      'recipientType',
      'location',
      'device',
      'timestamp',
      'dayOfWeek',
      'timeOfDay',
      'isWeekend',
      'isHoliday',
    ],
    userFeatures: [
      'age',
      'gender',
      'location',
      'kycLevel',
      'kycStatus',
      'riskLevel',
      'accountAge',
      'transactionCount',
      'totalVolume',
      'averageAmount',
      'preferredTimes',
      'preferredDays',
    ],
    behavioralFeatures: [
      'loginPattern',
      'transactionPattern',
      'amountPattern',
      'timePattern',
      'locationPattern',
      'devicePattern',
      'recipientPattern',
      'sessionPattern',
      'appUsagePattern',
      'navigationPattern',
    ],
    temporalFeatures: [
      'hourOfDay',
      'dayOfWeek',
      'dayOfMonth',
      'month',
      'quarter',
      'isWeekend',
      'isHoliday',
      'isBusinessDay',
      'timeSinceLastTransaction',
      'timeSinceLastLogin',
    ],
  },
  training: {
    dataRetentionDays: 365,
    retrainingSchedule: '0 2 * * 0', // Every Sunday at 2 AM
    validationSplit: 0.2,
    batchSize: 32,
    epochs: 100,
  },
  monitoring: {
    performanceThreshold: 0.9, // 90% accuracy
    alertThreshold: 0.8, // 80% accuracy triggers alert
    metricsRetentionDays: 90,
  },
};

// Feature Engineering Functions
export class FeatureEngineer {
  /**
   * Extract transaction features for ML models
   */
  static extractTransactionFeatures(transaction: any, userProfile: any): Record<string, number> {
    const features: Record<string, number> = {};
    
    // Basic transaction features
    features.amount = this.normalizeAmount(transaction.amount);
    features.timeOfDay = this.normalizeTimeOfDay(new Date(transaction.timestamp).getHours());
    features.dayOfWeek = this.normalizeDayOfWeek(new Date(transaction.timestamp).getDay());
    features.isWeekend = new Date(transaction.timestamp).getDay() === 0 || new Date(transaction.timestamp).getDay() === 6 ? 1 : 0;
    
    // User profile features
    if (userProfile) {
      features.userAge = this.normalizeAge(userProfile.age);
      features.kycLevel = this.normalizeKycLevel(userProfile.kycLevel);
      features.accountAge = this.normalizeAccountAge(userProfile.accountAge);
      features.riskLevel = this.normalizeRiskLevel(userProfile.riskLevel);
    }
    
    return features;
  }

  /**
   * Extract behavioral features for anomaly detection
   */
  static extractBehavioralFeatures(userBehavior: any): Record<string, number> {
    const features: Record<string, number> = {};
    
    // Behavioral patterns
    features.loginFrequency = this.normalizeFrequency(userBehavior.loginFrequency);
    features.transactionFrequency = this.normalizeFrequency(userBehavior.transactionFrequency);
    features.averageAmount = this.normalizeAmount(userBehavior.averageAmount);
    features.sessionDuration = this.normalizeDuration(userBehavior.sessionDuration);
    
    // Pattern features
    features.amountPattern = userBehavior.amountPattern || 0;
    features.timePattern = userBehavior.timePattern || 0;
    features.locationPattern = userBehavior.locationPattern || 0;
    features.devicePattern = userBehavior.devicePattern || 0;
    
    return features;
  }

  /**
   * Extract temporal features for time-series analysis
   */
  static extractTemporalFeatures(timestamp: Date): Record<string, number> {
    const features: Record<string, number> = {};
    
    features.hourOfDay = timestamp.getHours() / 24;
    features.dayOfWeek = timestamp.getDay() / 7;
    features.dayOfMonth = timestamp.getDate() / 31;
    features.month = timestamp.getMonth() / 12;
    features.quarter = Math.floor(timestamp.getMonth() / 3) / 4;
    features.isWeekend = timestamp.getDay() === 0 || timestamp.getDay() === 6 ? 1 : 0;
    
    return features;
  }

  // Normalization functions
  private static normalizeAmount(amount: number): number {
    const maxAmount = 1000000; // PHP 1M
    return Math.min(1, amount / maxAmount);
  }

  private static normalizeTimeOfDay(hour: number): number {
    // Higher risk for unusual hours (midnight to 6 AM)
    const unusualHours = [0, 1, 2, 3, 4, 5, 22, 23];
    return unusualHours.includes(hour) ? 0.8 : 0.2;
  }

  private static normalizeDayOfWeek(day: number): number {
    // Higher risk for weekends
    return day === 0 || day === 6 ? 0.6 : 0.2;
  }

  private static normalizeAge(age: number): number {
    // Normalize age to 0-1 scale
    return Math.min(1, age / 100);
  }

  private static normalizeKycLevel(level: string): number {
    const levels = { 'BASIC': 0.3, 'ENHANCED': 0.6, 'FULL': 1.0 };
    return levels[level as keyof typeof levels] || 0.3;
  }

  private static normalizeAccountAge(accountAge: number): number {
    // Normalize account age in days
    return Math.min(1, accountAge / 365);
  }

  private static normalizeRiskLevel(level: string): number {
    const levels = { 'LOW': 0.2, 'MEDIUM': 0.5, 'HIGH': 0.8, 'CRITICAL': 1.0 };
    return levels[level as keyof typeof levels] || 0.5;
  }

  private static normalizeFrequency(frequency: number): number {
    // Normalize frequency (transactions per day)
    const maxFrequency = 50;
    return Math.min(1, frequency / maxFrequency);
  }

  private static normalizeDuration(duration: number): number {
    // Normalize duration in minutes
    const maxDuration = 1440; // 24 hours
    return Math.min(1, duration / maxDuration);
  }
}

// Model Performance Monitoring
export class ModelMonitor {
  /**
   * Calculate model performance metrics
   */
  static calculateMetrics(predictions: any[], actuals: any[]): {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  } {
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    let trueNegatives = 0;

    for (let i = 0; i < predictions.length; i++) {
      const prediction = predictions[i];
      const actual = actuals[i];

      if (prediction && actual) {
        truePositives++;
      } else if (prediction && !actual) {
        falsePositives++;
      } else if (!prediction && actual) {
        falseNegatives++;
      } else {
        trueNegatives++;
      }
    }

    const accuracy = (truePositives + trueNegatives) / predictions.length;
    const precision = truePositives / (truePositives + falsePositives);
    const recall = truePositives / (truePositives + falseNegatives);
    const f1Score = 2 * (precision * recall) / (precision + recall);

    return {
      accuracy: accuracy || 0,
      precision: precision || 0,
      recall: recall || 0,
      f1Score: f1Score || 0,
    };
  }

  /**
   * Check if model performance is acceptable
   */
  static isPerformanceAcceptable(metrics: any, config: MLConfig): boolean {
    return metrics.accuracy >= config.monitoring.performanceThreshold;
  }

  /**
   * Generate performance alert
   */
  static generatePerformanceAlert(metrics: any, config: MLConfig): string | null {
    if (metrics.accuracy < config.monitoring.alertThreshold) {
      return `Model performance below threshold. Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`;
    }
    return null;
  }
}

// ML Pipeline Configuration
export const ML_PIPELINE_CONFIG = {
  dataProcessing: {
    batchSize: 1000,
    maxConcurrency: 5,
    retryAttempts: 3,
  },
  modelInference: {
    timeout: 30000, // 30 seconds
    maxBatchSize: 100,
    cacheResults: true,
    cacheTTL: 3600, // 1 hour
  },
  featureStore: {
    enabled: true,
    updateFrequency: 300, // 5 minutes
    retentionPeriod: 86400, // 24 hours
  },
  monitoring: {
    metricsCollection: true,
    alerting: true,
    logging: true,
    performanceTracking: true,
  },
}; 