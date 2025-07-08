// AI-powered fraud detection flow
// Converted from Server Action to client-side function for static export compatibility

import { genkit } from '@genkit-ai/core';

// Initialize AI client (this would be configured on the client side)
const ai = genkit({
  // Configuration would be handled on the client side
});

export interface FraudDetectionInput {
  transactionAmount: number;
  transactionType: string;
  userHistory: {
    totalTransactions: number;
    averageAmount: number;
    riskScore: number;
  };
  location: {
    country: string;
    city: string;
  };
  deviceInfo: {
    fingerprint: string;
    isTrusted: boolean;
  };
}

export interface FraudDetectionResult {
  riskScore: number;
  isFlagged: boolean;
  confidence: number;
  reasons: string[];
  recommendation: 'allow' | 'block' | 'review';
}

export async function detectFraud(input: FraudDetectionInput): Promise<FraudDetectionResult> {
  try {
    // This would be implemented as a client-side API call to your backend
    // For now, we'll return a mock implementation
    
    const riskFactors = [];
    let riskScore = 0;

    // Check transaction amount
    if (input.transactionAmount > input.userHistory.averageAmount * 5) {
      riskFactors.push('Transaction amount significantly higher than user average');
      riskScore += 30;
    }

    // Check location
    if (input.location.country !== 'PH' && input.location.country !== 'KR') {
      riskFactors.push('Transaction from unusual location');
      riskScore += 20;
    }

    // Check device
    if (!input.deviceInfo.isTrusted) {
      riskFactors.push('Untrusted device');
      riskScore += 25;
    }

    // Check user history
    if (input.userHistory.riskScore > 70) {
      riskFactors.push('User has high risk history');
      riskScore += 15;
    }

    const isFlagged = riskScore > 50;
    const confidence = Math.min(riskScore, 100);

    return {
      riskScore,
      isFlagged,
      confidence,
      reasons: riskFactors,
      recommendation: isFlagged ? 'review' : 'allow',
    };
  } catch (error) {
    console.error('Fraud detection error:', error);
    return {
      riskScore: 0,
      isFlagged: false,
      confidence: 0,
      reasons: ['Error in fraud detection'],
      recommendation: 'review',
    };
  }
}
