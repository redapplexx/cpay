import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { DEFAULT_ML_CONFIG, FeatureEngineer, ModelMonitor } from './mlConfig';

const db = admin.firestore();

// Training Data Schema
const TrainingDataSchema = z.object({
  id: z.string(),
  features: z.record(z.string(), z.number()),
  label: z.boolean(),
  metadata: z.object({
    transactionId: z.string().optional(),
    userId: z.string(),
    timestamp: z.date(),
    source: z.enum(['REAL_TRANSACTION', 'SYNTHETIC', 'VALIDATED']),
  }),
  createdAt: z.date(),
});

export type TrainingData = z.infer<typeof TrainingDataSchema>;

// Model Version Schema
const ModelVersionSchema = z.object({
  version: z.string(),
  modelType: z.enum(['FRAUD_DETECTION', 'BEHAVIORAL_ANALYSIS', 'TRANSACTION_CLASSIFICATION']),
  performance: z.object({
    accuracy: z.number(),
    precision: z.number(),
    recall: z.number(),
    f1Score: z.number(),
    auc: z.number(),
  }),
  trainingMetrics: z.object({
    trainingSamples: z.number(),
    validationSamples: z.number(),
    trainingTime: z.number(),
    epochs: z.number(),
    loss: z.number(),
  }),
  features: z.array(z.string()),
  hyperparameters: z.record(z.string(), z.any()),
  deployedAt: z.date().optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
});

export type ModelVersion = z.infer<typeof ModelVersionSchema>;

/**
 * Collect Training Data from Transactions
 * Automatically collects and labels transaction data for ML training
 */
export const collectTrainingData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const { modelType, startDate, endDate } = z.object({
    modelType: z.enum(['FRAUD_DETECTION', 'BEHAVIORAL_ANALYSIS', 'TRANSACTION_CLASSIFICATION']),
    startDate: z.string(),
    endDate: z.string(),
  }).parse(data);

  try {
    const startTimestamp = admin.firestore.Timestamp.fromDate(new Date(startDate));
    const endTimestamp = admin.firestore.Timestamp.fromDate(new Date(endDate));

    // Get transactions for the specified period
    const transactionsSnapshot = await db.collection('transactions')
      .where('timestamp', '>=', startTimestamp)
      .where('timestamp', '<=', endTimestamp)
      .get();

    const trainingData: TrainingData[] = [];

    for (const doc of transactionsSnapshot.docs) {
      const transaction = doc.data();
      
      // Get user profile for feature engineering
      const userDoc = await db.collection('users').doc(transaction.userId).get();
      const userProfile = userDoc.data();

      // Extract features based on model type
      let features: Record<string, number>;
      let label: boolean;

      switch (modelType) {
        case 'FRAUD_DETECTION':
          features = FeatureEngineer.extractTransactionFeatures(transaction, userProfile);
          // Label based on fraud detection results or manual review
          label = transaction.fraudDetection?.riskLevel === 'HIGH' || 
                  transaction.fraudDetection?.riskLevel === 'CRITICAL' ||
                  transaction.status === 'FLAGGED_FOR_REVIEW';
          break;

        case 'BEHAVIORAL_ANALYSIS':
          // Get user behavior data
          const behaviorDoc = await db.collection('userBehaviorAnalysis')
            .doc(transaction.userId)
            .get();
          const behaviorData = behaviorDoc.data();
          
          features = FeatureEngineer.extractBehavioralFeatures(behaviorData || {});
          label = behaviorData?.anomalyDetected || false;
          break;

        case 'TRANSACTION_CLASSIFICATION':
          features = FeatureEngineer.extractTransactionFeatures(transaction, userProfile);
          // Label based on transaction type
          label = transaction.type === 'P2P_TRANSFER'; // Example binary classification
          break;

        default:
          continue;
      }

      const trainingDataPoint: TrainingData = {
        id: `training_${doc.id}`,
        features,
        label,
        metadata: {
          transactionId: doc.id,
          userId: transaction.userId,
          timestamp: transaction.timestamp.toDate(),
          source: 'REAL_TRANSACTION',
        },
        createdAt: new Date(),
      };

      trainingData.push(trainingDataPoint);
    }

    // Store training data
    const batch = db.batch();
    trainingData.forEach(dataPoint => {
      const docRef = db.collection('trainingData').doc(dataPoint.id);
      batch.set(docRef, dataPoint);
    });

    await batch.commit();

    return {
      success: true,
      collectedSamples: trainingData.length,
      modelType,
      message: `Collected ${trainingData.length} training samples for ${modelType}`,
    };

  } catch (error: any) {
    console.error('Error collecting training data:', error);
    throw new functions.https.HttpsError('internal', 'Failed to collect training data.', error.message);
  }
});

/**
 * Train ML Model
 * Trains a new model version using collected training data
 */
export const trainMLModel = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const { modelType, hyperparameters } = z.object({
    modelType: z.enum(['FRAUD_DETECTION', 'BEHAVIORAL_ANALYSIS', 'TRANSACTION_CLASSIFICATION']),
    hyperparameters: z.record(z.string(), z.any()).optional(),
  }).parse(data);

  try {
    // Get training data for the model type
    const trainingDataSnapshot = await db.collection('trainingData')
      .where('metadata.source', 'in', ['REAL_TRANSACTION', 'VALIDATED'])
      .limit(10000) // Limit to prevent memory issues
      .get();

    const trainingData: TrainingData[] = [];
    trainingDataSnapshot.forEach(doc => {
      trainingData.push(doc.data() as TrainingData);
    });

    if (trainingData.length < 100) {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient training data. Need at least 100 samples.');
    }

    // Split data into training and validation sets
    const shuffled = trainingData.sort(() => 0.5 - Math.random());
    const splitIndex = Math.floor(shuffled.length * 0.8);
    const trainingSet = shuffled.slice(0, splitIndex);
    const validationSet = shuffled.slice(splitIndex);

    // Mock model training (in production, use TensorFlow.js or external ML service)
    const trainingStartTime = Date.now();
    const modelPerformance = await simulateModelTraining(trainingSet, validationSet, modelType, hyperparameters);
    const trainingTime = Date.now() - trainingStartTime;

    // Create new model version
    const modelVersion: ModelVersion = {
      version: `v${Date.now()}`,
      modelType,
      performance: modelPerformance,
      trainingMetrics: {
        trainingSamples: trainingSet.length,
        validationSamples: validationSet.length,
        trainingTime,
        epochs: hyperparameters?.epochs || 100,
        loss: modelPerformance.f1Score, // Mock loss
      },
      features: Object.keys(trainingSet[0]?.features || {}),
      hyperparameters: hyperparameters || DEFAULT_ML_CONFIG.models.fraudDetection,
      isActive: false, // Will be activated after validation
      createdAt: new Date(),
    };

    // Store model version
    await db.collection('modelVersions').doc(modelVersion.version).set(modelVersion);

    // Store training metrics
    await db.collection('trainingMetrics').add({
      modelVersion: modelVersion.version,
      modelType,
      performance: modelPerformance,
      trainingMetrics: modelVersion.trainingMetrics,
      createdAt: new Date(),
    });

    return {
      success: true,
      modelVersion,
      message: `Model training completed. Accuracy: ${(modelPerformance.accuracy * 100).toFixed(1)}%`,
    };

  } catch (error: any) {
    console.error('Error training ML model:', error);
    throw new functions.https.HttpsError('internal', 'Failed to train ML model.', error.message);
  }
});

/**
 * Deploy Model Version
 * Deploys a trained model version to production
 */
export const deployModelVersion = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const { version } = z.object({
    version: z.string(),
  }).parse(data);

  try {
    // Get model version
    const modelVersionDoc = await db.collection('modelVersions').doc(version).get();
    if (!modelVersionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Model version not found.');
    }

    const modelVersion = modelVersionDoc.data() as ModelVersion;

    // Validate model performance
    if (modelVersion.performance.accuracy < DEFAULT_ML_CONFIG.monitoring.performanceThreshold) {
      throw new functions.https.HttpsError('failed-precondition', 
        `Model accuracy ${(modelVersion.performance.accuracy * 100).toFixed(1)}% is below threshold ${(DEFAULT_ML_CONFIG.monitoring.performanceThreshold * 100).toFixed(1)}%`);
    }

    // Deactivate current active model
    const activeModelsSnapshot = await db.collection('modelVersions')
      .where('modelType', '==', modelVersion.modelType)
      .where('isActive', '==', true)
      .get();

    const batch = db.batch();
    activeModelsSnapshot.forEach(doc => {
      batch.update(doc.ref, { isActive: false });
    });

    // Activate new model version
    batch.update(db.collection('modelVersions').doc(version), {
      isActive: true,
      deployedAt: new Date(),
    });

    await batch.commit();

    // Store deployment log
    await db.collection('modelDeployments').add({
      version,
      modelType: modelVersion.modelType,
      performance: modelVersion.performance,
      deployedBy: context.auth.uid,
      deployedAt: new Date(),
    });

    return {
      success: true,
      modelVersion: {
        ...modelVersion,
        isActive: true,
        deployedAt: new Date(),
      },
      message: `Model version ${version} deployed successfully.`,
    };

  } catch (error: any) {
    console.error('Error deploying model version:', error);
    throw new functions.https.HttpsError('internal', 'Failed to deploy model version.', error.message);
  }
});

/**
 * Evaluate Model Performance
 * Evaluates model performance on new data
 */
export const evaluateModelPerformance = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const { modelType, days } = z.object({
    modelType: z.enum(['FRAUD_DETECTION', 'BEHAVIORAL_ANALYSIS', 'TRANSACTION_CLASSIFICATION']),
    days: z.number().min(1).max(30),
  }).parse(data);

  try {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);

    // Get recent predictions and actual outcomes
    const predictionsSnapshot = await db.collection('modelPredictions')
      .where('modelType', '==', modelType)
      .where('timestamp', '>=', cutoffTimestamp)
      .get();

    const predictions: any[] = [];
    const actuals: any[] = [];

    for (const doc of predictionsSnapshot.docs) {
      const prediction = doc.data();
      predictions.push(prediction.prediction);
      
      // Get actual outcome (fraud detection result, manual review, etc.)
      const actual = await getActualOutcome(prediction.transactionId, modelType);
      actuals.push(actual);
    }

    if (predictions.length === 0) {
      throw new functions.https.HttpsError('failed-precondition', 'No predictions found for evaluation.');
    }

    // Calculate performance metrics
    const metrics = ModelMonitor.calculateMetrics(predictions, actuals);

    // Store evaluation results
    await db.collection('modelEvaluations').add({
      modelType,
      evaluationPeriod: days,
      metrics,
      sampleSize: predictions.length,
      evaluatedAt: new Date(),
    });

    // Check if performance is acceptable
    const isAcceptable = ModelMonitor.isPerformanceAcceptable(metrics, DEFAULT_ML_CONFIG);
    const alert = ModelMonitor.generatePerformanceAlert(metrics, DEFAULT_ML_CONFIG);

    return {
      success: true,
      evaluation: {
        metrics,
        isAcceptable,
        alert,
        sampleSize: predictions.length,
      },
      message: `Model evaluation completed. Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`,
    };

  } catch (error: any) {
    console.error('Error evaluating model performance:', error);
    throw new functions.https.HttpsError('internal', 'Failed to evaluate model performance.', error.message);
  }
});

/**
 * Get Model Versions
 * Retrieves all model versions for a specific model type
 */
export const getModelVersions = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const { modelType } = z.object({
    modelType: z.enum(['FRAUD_DETECTION', 'BEHAVIORAL_ANALYSIS', 'TRANSACTION_CLASSIFICATION']),
  }).parse(data);

  try {
    const modelVersionsSnapshot = await db.collection('modelVersions')
      .where('modelType', '==', modelType)
      .orderBy('createdAt', 'desc')
      .get();

    const modelVersions: ModelVersion[] = [];
    modelVersionsSnapshot.forEach(doc => {
      modelVersions.push(doc.data() as ModelVersion);
    });

    return {
      success: true,
      modelVersions,
      message: `Retrieved ${modelVersions.length} model versions for ${modelType}`,
    };

  } catch (error: any) {
    console.error('Error getting model versions:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get model versions.', error.message);
  }
});

// Helper Functions
async function simulateModelTraining(trainingSet: TrainingData[], validationSet: TrainingData[], modelType: string, hyperparameters?: any) {
  // Mock model training - in production, use TensorFlow.js or external ML service
  const trainingFeatures = trainingSet.map(data => data.features);
  const trainingLabels = trainingSet.map(data => data.label);
  const validationFeatures = validationSet.map(data => data.features);
  const validationLabels = validationSet.map(data => data.label);

  // Simulate training process
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate training time

  // Mock performance metrics
  const accuracy = 0.85 + Math.random() * 0.1; // 85-95%
  const precision = 0.80 + Math.random() * 0.15; // 80-95%
  const recall = 0.75 + Math.random() * 0.2; // 75-95%
  const f1Score = 2 * (precision * recall) / (precision + recall);
  const auc = 0.80 + Math.random() * 0.15; // 80-95%

  return {
    accuracy,
    precision,
    recall,
    f1Score,
    auc,
  };
}

async function getActualOutcome(transactionId: string, modelType: string): Promise<boolean> {
  // Get actual outcome based on model type
  switch (modelType) {
    case 'FRAUD_DETECTION':
      const transactionDoc = await db.collection('transactions').doc(transactionId).get();
      const transaction = transactionDoc.data();
      return transaction?.fraudDetection?.riskLevel === 'HIGH' || 
             transaction?.fraudDetection?.riskLevel === 'CRITICAL' ||
             transaction?.status === 'FLAGGED_FOR_REVIEW';

    case 'BEHAVIORAL_ANALYSIS':
      const behaviorDoc = await db.collection('userBehaviorAnalysis').doc(transactionId).get();
      const behavior = behaviorDoc.data();
      return behavior?.anomalyDetected || false;

    case 'TRANSACTION_CLASSIFICATION':
      const txDoc = await db.collection('transactions').doc(transactionId).get();
      const tx = txDoc.data();
      return tx?.type === 'P2P_TRANSFER'; // Example binary classification

    default:
      return false;
  }
} 