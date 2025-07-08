// Behavior risk scoring flow
// Converted from Server Action to client-side function for static export compatibility

export interface UserBehavior {
  loginFrequency: number; // logins per day
  transactionPattern: {
    averageAmount: number;
    frequency: number;
    timeOfDay: string;
  };
  deviceUsage: {
    trustedDevices: number;
    newDevices: number;
    locations: string[];
  };
  kycStatus: 'pending' | 'verified' | 'rejected';
  accountAge: number; // days
}

export interface RiskScore {
  overallScore: number; // 0-100
  categoryScores: {
    login: number;
    transaction: number;
    device: number;
    kyc: number;
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export async function calculateBehaviorRiskScore(userBehavior: UserBehavior): Promise<RiskScore> {
  try {
    const categoryScores = {
      login: calculateLoginRisk(userBehavior.loginFrequency),
      transaction: calculateTransactionRisk(userBehavior.transactionPattern),
      device: calculateDeviceRisk(userBehavior.deviceUsage),
      kyc: calculateKYCRisk(userBehavior.kycStatus),
    };

    const overallScore = Math.round(
      (categoryScores.login + categoryScores.transaction + categoryScores.device + categoryScores.kyc) / 4
    );

    const riskLevel = getRiskLevel(overallScore);
    const recommendations = generateRecommendations(categoryScores, userBehavior);

    return {
      overallScore,
      categoryScores,
      riskLevel,
      recommendations,
    };
  } catch (error) {
    console.error('Risk scoring error:', error);
    return {
      overallScore: 0,
      categoryScores: { login: 0, transaction: 0, device: 0, kyc: 0 },
      riskLevel: 'low',
      recommendations: ['Error in risk calculation'],
    };
  }
}

function calculateLoginRisk(loginFrequency: number): number {
  if (loginFrequency > 10) return 80; // Suspicious high frequency
  if (loginFrequency > 5) return 60;
  if (loginFrequency > 2) return 30;
  return 10; // Normal
}

function calculateTransactionRisk(pattern: any): number {
  let score = 0;
  
  // High amount transactions
  if (pattern.averageAmount > 10000) score += 40;
  else if (pattern.averageAmount > 5000) score += 20;
  
  // High frequency
  if (pattern.frequency > 20) score += 30;
  else if (pattern.frequency > 10) score += 15;
  
  // Unusual time
  if (pattern.timeOfDay === 'night') score += 20;
  
  return Math.min(score, 100);
}

function calculateDeviceRisk(deviceUsage: any): number {
  let score = 0;
  
  if (deviceUsage.newDevices > 3) score += 50;
  if (deviceUsage.locations.length > 5) score += 30;
  if (deviceUsage.trustedDevices === 0) score += 20;
  
  return Math.min(score, 100);
}

function calculateKYCRisk(kycStatus: string): number {
  switch (kycStatus) {
    case 'rejected': return 90;
    case 'pending': return 60;
    case 'verified': return 10;
    default: return 50;
  }
}

function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

function generateRecommendations(categoryScores: any, userBehavior: UserBehavior): string[] {
  const recommendations = [];
  
  if (categoryScores.login > 50) {
    recommendations.push('Review login patterns - consider implementing additional authentication');
  }
  
  if (categoryScores.transaction > 50) {
    recommendations.push('Monitor transaction patterns - consider setting lower limits');
  }
  
  if (categoryScores.device > 50) {
    recommendations.push('Review device usage - consider device verification');
  }
  
  if (categoryScores.kyc > 50) {
    recommendations.push('Complete KYC verification to reduce risk score');
  }
  
  return recommendations;
}
