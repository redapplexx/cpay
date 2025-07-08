
'use client';

import { useContext } from 'react';
import { AuthContext } from '@/contexts/auth-context';
import { type Transaction } from '@/ai/flows/get-transactions-flow';

// We need to redefine the context type here because it's not exported from the context file
interface AuthContextType {
  user: import('firebase/auth').User | null;
  userAccount: {
    profile: {
      fullName?: string;
      address?: string;
      dob?: string;
      kycStatus: 'Verified' | 'Pending' | 'Unverified';
      isMerchant: boolean;
    };
    wallets: {
      [key: string]: {
        balance: number;
        currency: string;
      };
    };
  } | null;
  transactions: Transaction[] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
