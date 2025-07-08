import { functions, httpsCallable } from './firebase';
import { analytics } from './analytics';

// Type definitions for function calls
export interface CreateWalletRequest {
  userId: string;
  currency: string;
  initialBalance?: number;
  tenantId?: string;
}

export interface CreateWalletResponse {
  success: boolean;
  walletId: string;
  message: string;
}

export interface ProcessTransactionRequest {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  currency: string;
  type: 'transfer' | 'payout' | 'cash_in' | 'cash_out';
  description?: string;
  tenantId?: string;
}

export interface ProcessTransactionResponse {
  success: boolean;
  transactionId: string;
  message: string;
  newBalance?: number;
}

export interface MassPayoutRequest {
  payouts: Array<{
    toWalletId: string;
    amount: number;
    currency: string;
    description?: string;
  }>;
  tenantId?: string;
}

export interface MassPayoutResponse {
  success: boolean;
  batchId: string;
  processedCount: number;
  failedCount: number;
  message: string;
}

export interface UpdateFXRateRequest {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  tenantId?: string;
}

export interface UpdateFXRateResponse {
  success: boolean;
  message: string;
}

// Function call wrappers with error handling
class FirebaseFunctionsService {
  private async callFunction<T, R>(
    functionName: string,
    data: T,
    options?: { timeout?: number }
  ): Promise<R> {
    try {
      const startTime = Date.now();
      const callable = httpsCallable<T, R>(functions, functionName);
      
      const result = await callable(data);
      
      // Track performance
      const duration = Date.now() - startTime;
      analytics.trackPerformance(`${functionName}_duration`, duration);
      
      // Track success
      analytics.track('function_call_success', {
        function: functionName,
        duration,
      });
      
      return result.data;
    } catch (error: any) {
      // Track error
      analytics.track('function_call_error', {
        function: functionName,
        error: error.message,
        code: error.code,
      });
      
      console.error(`Error calling ${functionName}:`, error);
      throw new Error(`Function call failed: ${error.message}`);
    }
  }

  // Wallet Management
  async createWallet(request: CreateWalletRequest): Promise<CreateWalletResponse> {
    return this.callFunction('createWallet', request);
  }

  async getWalletBalance(walletId: string): Promise<{ balance: number; currency: string }> {
    return this.callFunction('getWalletBalance', { walletId });
  }

  // Transaction Processing
  async processTransaction(request: ProcessTransactionRequest): Promise<ProcessTransactionResponse> {
    return this.callFunction('processTransaction', request);
  }

  async getTransactionHistory(walletId: string, limit = 10): Promise<any[]> {
    return this.callFunction('getTransactionHistory', { walletId, limit });
  }

  // Mass Payouts
  async processMassPayout(request: MassPayoutRequest): Promise<MassPayoutResponse> {
    return this.callFunction('processMassPayout', request);
  }

  async getPayoutStatus(batchId: string): Promise<any> {
    return this.callFunction('getPayoutStatus', { batchId });
  }

  // FX Operations
  async updateFXRate(request: UpdateFXRateRequest): Promise<UpdateFXRateResponse> {
    return this.callFunction('updateFXRate', request);
  }

  async getFXRate(fromCurrency: string, toCurrency: string): Promise<{ rate: number }> {
    return this.callFunction('getFXRate', { fromCurrency, toCurrency });
  }

  // KYC Operations
  async uploadKYCDocument(file: File, userId: string): Promise<{ url: string; documentId: string }> {
    return this.callFunction('uploadKYCDocument', { file, userId });
  }

  async processKYC(userId: string): Promise<{ status: string; message: string }> {
    return this.callFunction('processKYC', { userId });
  }

  // User Management
  async createUser(userData: any): Promise<{ userId: string; message: string }> {
    return this.callFunction('createUser', userData);
  }

  async updateUserProfile(userId: string, profileData: any): Promise<{ success: boolean; message: string }> {
    return this.callFunction('updateUserProfile', { userId, profileData });
  }

  // Test Functions
  async testConnection(): Promise<{ message: string; timestamp: string }> {
    return this.callFunction('testConnection', {});
  }

  async testTransaction(data: { userId: string; amount: number }): Promise<{ message: string; amount: number }> {
    return this.callFunction('testTransaction', data);
  }
}

export const firebaseFunctions = new FirebaseFunctionsService(); 