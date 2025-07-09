
'use client';

import { useContext } from 'react';
import { AuthContext, type UserWallets } from '@/contexts/auth-context';
import { type Transaction } from '@/ai/flows/get-transactions-flow';
import { type User } from 'firebase/auth';
import { type Timestamp } from 'firebase/firestore';


// We need to redefine the context type here because it's not exported from the context file
interface AuthContextType {
  user: User | null;
  userAccount: {
    profile: {
      fullName?: string;
      address?: string;
      dob?: string;
      kycStatus: 'Verified' | 'Pending' | 'Unverified' | 'NOT_STARTED' | 'PENDING_REVIEW';
      isMerchant: boolean;
      passwordLastChangedAt?: Timestamp;
    };
    wallets: UserWallets;
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
