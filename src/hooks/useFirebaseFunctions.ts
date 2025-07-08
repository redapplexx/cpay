import { useState, useCallback } from 'react';
import { firebaseFunctions } from '@/lib/firebase-functions';
import { analytics } from '@/lib/analytics';
import type {
  CreateWalletRequest,
  CreateWalletResponse,
  ProcessTransactionRequest,
  ProcessTransactionResponse,
  MassPayoutRequest,
  MassPayoutResponse,
} from '@/lib/firebase-functions';

// Generic hook for Firebase function calls
export function useFirebaseFunction<T, R>(
  functionName: string,
  onSuccess?: (result: R) => void,
  onError?: (error: Error) => void
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<R | null>(null);

  const execute = useCallback(
    async (data: T): Promise<R | null> => {
      setLoading(true);
      setError(null);
      
      try {
        // Track function call
        analytics.track('function_call_start', { function: functionName });
        
        const response = await firebaseFunctions.callFunction<T, R>(functionName, data);
        
        setResult(response);
        onSuccess?.(response);
        
        // Track success
        analytics.track('function_call_complete', { function: functionName });
        
        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
        
        // Track error
        analytics.track('function_call_failed', { 
          function: functionName, 
          error: error.message 
        });
        
        return null;
      } finally {
        setLoading(false);
      }
    },
    [functionName, onSuccess, onError]
  );

  return {
    execute,
    loading,
    error,
    result,
    reset: () => {
      setError(null);
      setResult(null);
    },
  };
}

// Specific hooks for common operations
export function useCreateWallet() {
  return useFirebaseFunction<CreateWalletRequest, CreateWalletResponse>('createWallet');
}

export function useProcessTransaction() {
  return useFirebaseFunction<ProcessTransactionRequest, ProcessTransactionResponse>('processTransaction');
}

export function useMassPayout() {
  return useFirebaseFunction<MassPayoutRequest, MassPayoutResponse>('processMassPayout');
}

export function useGetWalletBalance() {
  return useFirebaseFunction<{ walletId: string }, { balance: number; currency: string }>('getWalletBalance');
}

export function useGetTransactionHistory() {
  return useFirebaseFunction<{ walletId: string; limit?: number }, any[]>('getTransactionHistory');
}

export function useUpdateFXRate() {
  return useFirebaseFunction<any, any>('updateFXRate');
}

export function useGetFXRate() {
  return useFirebaseFunction<{ fromCurrency: string; toCurrency: string }, { rate: number }>('getFXRate');
}

export function useUploadKYCDocument() {
  return useFirebaseFunction<{ file: File; userId: string }, { url: string; documentId: string }>('uploadKYCDocument');
}

export function useProcessKYC() {
  return useFirebaseFunction<{ userId: string }, { status: string; message: string }>('processKYC');
}

// Test hooks
export function useTestConnection() {
  return useFirebaseFunction<{}, { message: string; timestamp: string }>('testConnection');
}

export function useTestTransaction() {
  return useFirebaseFunction<{ userId: string; amount: number }, { message: string; amount: number }>('testTransaction');
}

// User Management Hooks
export const useUserFunctions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = useCallback(async (userData: any) => {
    setLoading(true);
    setError(null);
    const result = await firebaseFunctions.user.createUser(userData);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to create user');
    }
    return result;
  }, []);

  const getUser = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    const result = await firebaseFunctions.user.getUser({ userId });
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to get user');
    }
    return result;
  }, []);

  const updateUser = useCallback(async (userId: string, updates: any) => {
    setLoading(true);
    setError(null);
    const result = await firebaseFunctions.user.updateUser({ userId, ...updates });
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to update user');
    }
    return result;
  }, []);

  const listUsers = useCallback(async (filters?: any) => {
    setLoading(true);
    setError(null);
    const result = await firebaseFunctions.user.listUsers({ filters });
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to list users');
    }
    return result;
  }, []);

  return {
    createUser,
    getUser,
    updateUser,
    listUsers,
    loading,
    error,
  };
};

// Wallet Management Hooks
export const useWalletFunctions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWallet = useCallback(async (walletData: any) => {
    setLoading(true);
    setError(null);
    const result = await firebaseFunctions.wallet.createWallet(walletData);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to create wallet');
    }
    return result;
  }, []);

  const getWallet = useCallback(async (walletId: string) => {
    setLoading(true);
    setError(null);
    const result = await firebaseFunctions.wallet.getWallet({ walletId });
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to get wallet');
    }
    return result;
  }, []);

  const getWalletBalance = useCallback(async (walletId: string) => {
    setLoading(true);
    setError(null);
    const result = await firebaseFunctions.wallet.getWalletBalance({ walletId });
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to get wallet balance');
    }
    return result;
  }, []);

  return {
    createWallet,
    getWallet,
    getWalletBalance,
    loading,
    error,
  };
};

// Transaction Management Hooks
export const useTransactionFunctions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendPayment = useCallback(async (paymentData: any) => {
    setLoading(true);
    setError(null);
    const result = await firebaseFunctions.transaction.sendPayment(paymentData);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to send payment');
    }
    return result;
  }, []);

  const getTransaction = useCallback(async (transactionId: string) => {
    setLoading(true);
    setError(null);
    const result = await firebaseFunctions.transaction.getTransaction({ transactionId });
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to get transaction');
    }
    return result;
  }, []);

  const listTransactions = useCallback(async (filters?: any, limit?: number) => {
    setLoading(true);
    setError(null);
    const result = await firebaseFunctions.transaction.listTransactions({ filters, limit });
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to list transactions');
    }
    return result;
  }, []);

  const convertCurrency = useCallback(async (conversionData: any) => {
    setLoading(true);
    setError(null);
    const result = await firebaseFunctions.transaction.convertCurrency(conversionData);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to convert currency');
    }
    return result;
  }, []);

  return {
    sendPayment,
    getTransaction,
    listTransactions,
    convertCurrency,
    loading,
    error,
  };
};

// KYC Management Hooks
export const useKYCFunctions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadKYCDocument = useCallback(async (documentData: any) => {
    setLoading(true);
    setError(null);
    const result = await firebaseFunctions.kyc.uploadKYCDocument(documentData);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to upload KYC document');
    }
    return result;
  }, []);

  const getKYCRecords = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    const result = await firebaseFunctions.kyc.getKYCRecords({ userId });
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to get KYC records');
    }
    return result;
  }, []);

  return {
    uploadKYCDocument,
    getKYCRecords,
    loading,
    error,
  };
};

// Notification Hooks
export const useNotificationFunctions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getNotifications = useCallback(async (userId: string, limit?: number) => {
    setLoading(true);
    setError(null);
    const result = await firebaseFunctions.notification.getNotifications({ userId, limit });
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to get notifications');
    }
    return result;
  }, []);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    setLoading(true);
    setError(null);
    const result = await firebaseFunctions.notification.markNotificationAsRead({ notificationId });
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to mark notification as read');
    }
    return result;
  }, []);

  return {
    getNotifications,
    markNotificationAsRead,
    loading,
    error,
  };
}; 