import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';

const db = admin.firestore();

// ML Kit Integration Schema
const MLKitResultSchema = z.object({
  taskId: z.string(),
  taskType: z.enum(['TEXT_RECOGNITION', 'FACE_DETECTION', 'DOCUMENT_SCANNING', 'CUSTOM_MODEL']),
  input: z.object({
    imageUrl: z.string(),
    metadata: z.record(z.any()),
  }),
  results: z.object({
    confidence: z.number(),
    predictions: z.array(z.record(z.any())),
    extractedText: z.string().optional(),
    faces: z.array(z.object({
      bounds: z.object({
        left: z.number(),
        top: z.number(),
        right: z.number(),
        bottom: z.number(),
      }),
      confidence: z.number(),
    })).optional(),
  }),
  processingTime: z.number(),
  createdAt: z.date(),
});

export type MLKitResult = z.infer<typeof MLKitResultSchema>;

/**
 * ML Kit Text Recognition for Document Processing
 * Extracts text from KYC documents for automated verification
 */
export const processDocumentWithMLKit = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const { imageUrl, documentType, userId } = z.object({
    imageUrl: z.string(),
    documentType: z.enum(['ID_CARD', 'PASSPORT', 'DRIVERS_LICENSE', 'UTILITY_BILL']),
    userId: z.string(),
  }).parse(data);

  try {
    const startTime = Date.now();
    
    // Simulate ML Kit text recognition
    const extractedText = await simulateTextRecognition(imageUrl, documentType);
    
    // Parse extracted information
    const parsedInfo = await parseDocumentInformation(extractedText, documentType);
    
    // Validate extracted information
    const validationResult = await validateDocumentInformation(parsedInfo, userId);
    
    const processingTime = Date.now() - startTime;
    
    const mlKitResult: MLKitResult = {
      taskId: `text_recognition_${Date.now()}`,
      taskType: 'TEXT_RECOGNITION',
      input: {
        imageUrl,
        metadata: { documentType, userId },
      },
      results: {
        confidence: validationResult.confidence,
        predictions: parsedInfo,
        extractedText,
      },
      processingTime,
      createdAt: new Date(),
    };

    // Store ML Kit result
    await db.collection('mlKitResults').add(mlKitResult);

    // Update user's document verification status
    await db.collection('users').doc(userId).update({
      'profile.documentVerification': {
        [documentType]: {
          verified: validationResult.isValid,
          confidence: validationResult.confidence,
          extractedInfo: parsedInfo,
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      },
    });

    return {
      success: true,
      mlKitResult,
      validationResult,
      message: `Document processed successfully. Confidence: ${validationResult.confidence}%`,
    };

  } catch (error: any) {
    console.error('Error in ML Kit document processing:', error);
    throw new functions.https.HttpsError('internal', 'Failed to process document with ML Kit.', error.message);
  }
});

/**
 * ML Kit Face Detection for Liveness Verification
 * Detects faces and verifies liveness for KYC compliance
 */
export const detectFaceWithMLKit = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const { imageUrl, userId } = z.object({
    imageUrl: z.string(),
    userId: z.string(),
  }).parse(data);

  try {
    const startTime = Date.now();
    
    // Simulate ML Kit face detection
    const faceDetectionResult = await simulateFaceDetection(imageUrl);
    
    // Perform liveness detection
    const livenessResult = await performLivenessDetection(imageUrl, faceDetectionResult);
    
    const processingTime = Date.now() - startTime;
    
    const mlKitResult: MLKitResult = {
      taskId: `face_detection_${Date.now()}`,
      taskType: 'FACE_DETECTION',
      input: {
        imageUrl,
        metadata: { userId },
      },
      results: {
        confidence: livenessResult.confidence,
        predictions: livenessResult.predictions,
        faces: faceDetectionResult.faces,
      },
      processingTime,
      createdAt: new Date(),
    };

    // Store ML Kit result
    await db.collection('mlKitResults').add(mlKitResult);

    // Update user's liveness verification status
    await db.collection('users').doc(userId).update({
      'profile.livenessVerification': {
        verified: livenessResult.isLive,
        confidence: livenessResult.confidence,
        detectedFaces: faceDetectionResult.faces.length,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    });

    return {
      success: true,
      mlKitResult,
      livenessResult,
      message: `Face detection completed. Liveness: ${livenessResult.isLive ? 'LIVE' : 'NOT_LIVE'}`,
    };

  } catch (error: any) {
    console.error('Error in ML Kit face detection:', error);
    throw new functions.https.HttpsError('internal', 'Failed to detect face with ML Kit.', error.message);
  }
});

/**
 * Custom ML Model Inference
 * Runs custom TensorFlow.js models for advanced fraud detection
 */
export const runCustomMLModel = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const { modelName, inputData, userId } = z.object({
    modelName: z.string(),
    inputData: z.record(z.any()),
    userId: z.string(),
  }).parse(data);

  try {
    const startTime = Date.now();
    
    // Run custom model inference
    const prediction = await runModelInference(modelName, inputData);
    
    const processingTime = Date.now() - startTime;
    
    const mlKitResult: MLKitResult = {
      taskId: `custom_model_${Date.now()}`,
      taskType: 'CUSTOM_MODEL',
      input: {
        imageUrl: '', // Not applicable for custom models
        metadata: { modelName, userId, inputData },
      },
      results: {
        confidence: prediction.confidence,
        predictions: prediction.results,
      },
      processingTime,
      createdAt: new Date(),
    };

    // Store ML Kit result
    await db.collection('mlKitResults').add(mlKitResult);

    return {
      success: true,
      mlKitResult,
      prediction,
      message: `Custom model inference completed. Confidence: ${prediction.confidence}%`,
    };

  } catch (error: any) {
    console.error('Error in custom ML model inference:', error);
    throw new functions.https.HttpsError('internal', 'Failed to run custom ML model.', error.message);
  }
});

/**
 * ML Kit Document Scanning
 * Advanced document scanning with ML Kit for KYC documents
 */
export const scanDocumentWithMLKit = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const { imageUrl, documentType, userId } = z.object({
    imageUrl: z.string(),
    documentType: z.enum(['ID_CARD', 'PASSPORT', 'DRIVERS_LICENSE', 'UTILITY_BILL']),
    userId: z.string(),
  }).parse(data);

  try {
    const startTime = Date.now();
    
    // Simulate ML Kit document scanning
    const scanResult = await simulateDocumentScanning(imageUrl, documentType);
    
    // Extract structured data
    const structuredData = await extractStructuredData(scanResult, documentType);
    
    // Validate document authenticity
    const authenticityCheck = await validateDocumentAuthenticity(scanResult, documentType);
    
    const processingTime = Date.now() - startTime;
    
    const mlKitResult: MLKitResult = {
      taskId: `document_scanning_${Date.now()}`,
      taskType: 'DOCUMENT_SCANNING',
      input: {
        imageUrl,
        metadata: { documentType, userId },
      },
      results: {
        confidence: authenticityCheck.confidence,
        predictions: structuredData,
      },
      processingTime,
      createdAt: new Date(),
    };

    // Store ML Kit result
    await db.collection('mlKitResults').add(mlKitResult);

    // Update user's document scanning results
    await db.collection('users').doc(userId).update({
      'profile.documentScanning': {
        [documentType]: {
          scanned: true,
          confidence: authenticityCheck.confidence,
          structuredData,
          isAuthentic: authenticityCheck.isAuthentic,
          scannedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      },
    });

    return {
      success: true,
      mlKitResult,
      structuredData,
      authenticityCheck,
      message: `Document scanning completed. Authenticity: ${authenticityCheck.isAuthentic ? 'AUTHENTIC' : 'SUSPICIOUS'}`,
    };

  } catch (error: any) {
    console.error('Error in ML Kit document scanning:', error);
    throw new functions.https.HttpsError('internal', 'Failed to scan document with ML Kit.', error.message);
  }
});

/**
 * Helper Functions for ML Kit Integration
 */
async function simulateTextRecognition(imageUrl: string, documentType: string): Promise<string> {
  // Mock text recognition - in production, use Firebase ML Kit Text Recognition API
  const mockTexts = {
    'ID_CARD': 'REPUBLIC OF THE PHILIPPINES\nUNIFIED MULTI-PURPOSE ID\nSurname: DELA CRUZ\nGiven Names: JUAN SANTOS\nSex: M\nDate of Birth: 15 JAN 1990\nPlace of Birth: MANILA\nNationality: FILIPINO\nBlood Type: O+\nMarital Status: SINGLE\nAddress: 123 RIZAL ST, MANILA, PHILIPPINES',
    'PASSPORT': 'REPUBLIC OF THE PHILIPPINES\nPASSPORT\nSurname: DELA CRUZ\nGiven Names: JUAN SANTOS\nNationality: FILIPINO\nDate of Birth: 15 JAN 1990\nPlace of Birth: MANILA\nDate of Issue: 01 JAN 2020\nDate of Expiry: 01 JAN 2030\nPassport No: P123456789',
    'DRIVERS_LICENSE': 'REPUBLIC OF THE PHILIPPINES\nDRIVER\'S LICENSE\nName: JUAN SANTOS DELA CRUZ\nAddress: 123 RIZAL ST, MANILA\nDate of Birth: 15 JAN 1990\nLicense No: A01-12-345678\nExpires: 15 JAN 2025',
    'UTILITY_BILL': 'MANILA ELECTRIC COMPANY\nBILLING STATEMENT\nAccount No: 123456789\nCustomer: JUAN SANTOS DELA CRUZ\nAddress: 123 RIZAL ST, MANILA, PHILIPPINES\nDue Date: 15 JAN 2024\nAmount Due: PHP 2,500.00',
  };
  
  return mockTexts[documentType as keyof typeof mockTexts] || 'Text extraction failed';
}

async function parseDocumentInformation(extractedText: string, documentType: string) {
  const parsedInfo: any = {};
  
  // Parse based on document type
  switch (documentType) {
    case 'ID_CARD':
      parsedInfo.fullName = extractName(extractedText);
      parsedInfo.dateOfBirth = extractDateOfBirth(extractedText);
      parsedInfo.address = extractAddress(extractedText);
      parsedInfo.nationality = extractNationality(extractedText);
      break;
      
    case 'PASSPORT':
      parsedInfo.fullName = extractName(extractedText);
      parsedInfo.dateOfBirth = extractDateOfBirth(extractedText);
      parsedInfo.passportNumber = extractPassportNumber(extractedText);
      parsedInfo.nationality = extractNationality(extractedText);
      break;
      
    case 'DRIVERS_LICENSE':
      parsedInfo.fullName = extractName(extractedText);
      parsedInfo.dateOfBirth = extractDateOfBirth(extractedText);
      parsedInfo.licenseNumber = extractLicenseNumber(extractedText);
      parsedInfo.address = extractAddress(extractedText);
      break;
      
    case 'UTILITY_BILL':
      parsedInfo.fullName = extractName(extractedText);
      parsedInfo.address = extractAddress(extractedText);
      parsedInfo.accountNumber = extractAccountNumber(extractedText);
      break;
  }
  
  return parsedInfo;
}

async function validateDocumentInformation(parsedInfo: any, userId: string) {
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();
  
  let matchCount = 0;
  let totalFields = 0;
  
  // Compare with user profile
  if (parsedInfo.fullName && userData?.profile?.fullName) {
    totalFields++;
    if (parsedInfo.fullName.toLowerCase().includes(userData.profile.fullName.toLowerCase())) {
      matchCount++;
    }
  }
  
  if (parsedInfo.dateOfBirth && userData?.profile?.dob) {
    totalFields++;
    if (parsedInfo.dateOfBirth === userData.profile.dob) {
      matchCount++;
    }
  }
  
  if (parsedInfo.address && userData?.profile?.address) {
    totalFields++;
    if (parsedInfo.address.toLowerCase().includes(userData.profile.address.toLowerCase())) {
      matchCount++;
    }
  }
  
  const confidence = totalFields > 0 ? (matchCount / totalFields) * 100 : 0;
  const isValid = confidence >= 70; // 70% threshold
  
  return {
    isValid,
    confidence,
    matchCount,
    totalFields,
  };
}

async function simulateFaceDetection(imageUrl: string) {
  // Mock face detection - in production, use Firebase ML Kit Face Detection API
  return {
    faces: [
      {
        bounds: {
          left: 100,
          top: 100,
          right: 300,
          bottom: 400,
        },
        confidence: 0.95,
      },
    ],
    faceCount: 1,
  };
}

async function performLivenessDetection(imageUrl: string, faceDetectionResult: any) {
  // Mock liveness detection - in production, use advanced liveness detection models
  const isLive = Math.random() > 0.1; // 90% chance of being live
  const confidence = isLive ? 0.85 + Math.random() * 0.15 : 0.1 + Math.random() * 0.2;
  
  return {
    isLive,
    confidence,
    predictions: {
      livenessScore: confidence,
      spoofingDetected: !isLive,
    },
  };
}

async function runModelInference(modelName: string, inputData: any) {
  // Mock custom model inference - in production, load and run TensorFlow.js models
  let confidence = 0.8;
  let results = {};
  
  switch (modelName) {
    case 'fraud_detection':
      confidence = 0.75 + Math.random() * 0.2;
      results = {
        fraudProbability: confidence,
        riskLevel: confidence > 0.7 ? 'HIGH' : confidence > 0.4 ? 'MEDIUM' : 'LOW',
      };
      break;
      
    case 'transaction_classification':
      confidence = 0.85 + Math.random() * 0.1;
      results = {
        category: 'P2P_TRANSFER',
        confidence: confidence,
      };
      break;
      
    case 'user_behavior_analysis':
      confidence = 0.7 + Math.random() * 0.25;
      results = {
        behaviorScore: confidence,
        anomalyDetected: confidence > 0.8,
      };
      break;
      
    default:
      confidence = 0.5;
      results = { prediction: 'unknown' };
  }
  
  return {
    confidence,
    results,
  };
}

async function simulateDocumentScanning(imageUrl: string, documentType: string) {
  // Mock document scanning - in production, use Firebase ML Kit Document Scanner API
  return {
    documentType,
    quality: 'HIGH',
    corners: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 150 },
      { x: 0, y: 150 },
    ],
    extractedText: await simulateTextRecognition(imageUrl, documentType),
  };
}

async function extractStructuredData(scanResult: any, documentType: string) {
  return await parseDocumentInformation(scanResult.extractedText, documentType);
}

async function validateDocumentAuthenticity(scanResult: any, documentType: string) {
  // Mock authenticity validation - in production, use advanced document verification
  const isAuthentic = Math.random() > 0.05; // 95% chance of being authentic
  const confidence = isAuthentic ? 0.9 + Math.random() * 0.1 : 0.1 + Math.random() * 0.3;
  
  return {
    isAuthentic,
    confidence,
    quality: scanResult.quality,
  };
}

// Text extraction helper functions
function extractName(text: string): string {
  const nameMatch = text.match(/(?:Name|Surname|Given Names?):\s*([^\n]+)/i);
  return nameMatch ? nameMatch[1].trim() : '';
}

function extractDateOfBirth(text: string): string {
  const dobMatch = text.match(/(?:Date of Birth|DOB):\s*(\d{1,2}\s+[A-Z]{3}\s+\d{4})/i);
  return dobMatch ? dobMatch[1].trim() : '';
}

function extractAddress(text: string): string {
  const addressMatch = text.match(/(?:Address):\s*([^\n]+)/i);
  return addressMatch ? addressMatch[1].trim() : '';
}

function extractNationality(text: string): string {
  const nationalityMatch = text.match(/(?:Nationality):\s*([^\n]+)/i);
  return nationalityMatch ? nationalityMatch[1].trim() : '';
}

function extractPassportNumber(text: string): string {
  const passportMatch = text.match(/(?:Passport No|Passport Number):\s*([^\n]+)/i);
  return passportMatch ? passportMatch[1].trim() : '';
}

function extractLicenseNumber(text: string): string {
  const licenseMatch = text.match(/(?:License No|License Number):\s*([^\n]+)/i);
  return licenseMatch ? licenseMatch[1].trim() : '';
}

function extractAccountNumber(text: string): string {
  const accountMatch = text.match(/(?:Account No|Account Number):\s*([^\n]+)/i);
  return accountMatch ? accountMatch[1].trim() : '';
} 