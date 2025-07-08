// AI-driven financial advice flow
// Converted from Server Action to client-side function for static export compatibility

export interface FinancialProfile {
  income: number;
  expenses: number;
  savings: number;
  investments: number;
  debt: number;
  age: number;
  riskTolerance: 'low' | 'medium' | 'high';
  goals: string[];
}

export interface FinancialAdvice {
  summary: string;
  recommendations: string[];
  riskAssessment: string;
  nextSteps: string[];
  priority: 'high' | 'medium' | 'low';
}

export async function generateFinancialAdvice(profile: FinancialProfile): Promise<FinancialAdvice> {
  try {
    const recommendations = [];
    const nextSteps = [];
    let priority: 'high' | 'medium' | 'low' = 'medium';

    // Analyze savings rate
    const savingsRate = (profile.savings / profile.income) * 100;
    if (savingsRate < 10) {
      recommendations.push('Increase your savings rate to at least 10% of your income');
      priority = 'high';
    } else if (savingsRate < 20) {
      recommendations.push('Consider increasing savings to 20% for better financial security');
    }

    // Analyze debt-to-income ratio
    const debtToIncome = (profile.debt / profile.income) * 100;
    if (debtToIncome > 40) {
      recommendations.push('Focus on reducing debt - your debt-to-income ratio is high');
      priority = 'high';
    } else if (debtToIncome > 20) {
      recommendations.push('Consider paying down debt before increasing investments');
    }

    // Investment recommendations
    if (profile.investments === 0 && profile.savings > 10000) {
      recommendations.push('Consider starting an investment portfolio with your excess savings');
      nextSteps.push('Research low-cost index funds');
      nextSteps.push('Consider opening a retirement account');
    }

    // Emergency fund check
    const emergencyFund = profile.savings - profile.investments;
    const monthlyExpenses = profile.expenses / 12;
    if (emergencyFund < monthlyExpenses * 3) {
      recommendations.push('Build an emergency fund covering 3-6 months of expenses');
      priority = 'high';
    }

    // Risk tolerance alignment
    if (profile.riskTolerance === 'low' && profile.investments > profile.savings * 0.5) {
      recommendations.push('Consider more conservative investments aligned with your risk tolerance');
    }

    const summary = `Based on your financial profile, you have a ${savingsRate.toFixed(1)}% savings rate and ${debtToIncome.toFixed(1)}% debt-to-income ratio.`;

    const riskAssessment = debtToIncome > 40 ? 'High risk due to high debt levels' :
                          savingsRate < 10 ? 'Moderate risk due to low savings' :
                          'Low to moderate risk profile';

    return {
      summary,
      recommendations,
      riskAssessment,
      nextSteps,
      priority,
    };
  } catch (error) {
    console.error('Financial advice generation error:', error);
    return {
      summary: 'Unable to generate financial advice at this time',
      recommendations: ['Please try again later'],
      riskAssessment: 'Unable to assess',
      nextSteps: ['Contact support if the issue persists'],
      priority: 'medium',
    };
  }
}
