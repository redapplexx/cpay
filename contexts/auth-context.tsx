'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { type Transaction } from '@/ai/flows/get-transactions-flow';

interface UserProfile {
  fullName?: string;
  address?: string;
  dob?: string;
  kycStatus: 'Verified' | 'Pending' | 'Unverified' | 'NOT_STARTED' | 'PENDING_REVIEW';
  isMerchant: boolean;
  passwordLastChangedAt?: Timestamp;
}

export interface UserWallets {
    [key: string]: {
        balance: number;
        currency: string;
    };
}

interface UserAccount {
    profile: UserProfile;
    wallets: UserWallets;
}

interface AuthContextType {
  user: User | null;
  userAccount: UserAccount | null;
  transactions: Transaction[] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    let unsubscribeWallets: (() => void) | undefined;
    let unsubscribeTransactions: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      // Clear all previous listeners to prevent memory leaks on user change
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeWallets) unsubscribeWallets();
      if (unsubscribeTransactions) unsubscribeTransactions();

      if (authUser) {
        setUser(authUser);
        
        const userRef = doc(db, 'users', authUser.uid);
        
        unsubscribeProfile = onSnapshot(userRef, (userDoc) => {
            const profileData: UserProfile = {
                kycStatus: userDoc.data()?.profile?.kycStatus || 'NOT_STARTED',
                isMerchant: userDoc.data()?.profile?.isMerchant || false,
                fullName: userDoc.data()?.profile?.fullName,
                address: userDoc.data()?.profile?.address,
                dob: userDoc.data()?.profile?.dob,
                passwordLastChangedAt: userDoc.data()?.profile?.passwordLastChangedAt,
            };
            
            setUserAccount(prev => ({
                 profile: profileData,
                 wallets: prev?.wallets || {} 
            }));
            // Only set loading to false after the initial profile fetch
            if (isLoading) setIsLoading(false);
        }, (error) => {
            console.error("Error fetching profile:", error);
            setIsLoading(false);
        });

        const walletsQuery = collection(db, 'users', authUser.uid, 'wallets');
        unsubscribeWallets = onSnapshot(walletsQuery, (snapshot) => {
            const walletsData: UserWallets = {};
            snapshot.forEach(doc => {
                walletsData[doc.id] = doc.data() as { balance: number; currency: string; };
            });
            setUserAccount(prev => ({
                 profile: prev?.profile || { kycStatus: 'NOT_STARTED', isMerchant: false },
                 wallets: walletsData 
            }));
        });

        const transactionsQuery = query(
          collection(db, "transactions"), 
          where("userId", "==", authUser.uid),
          orderBy("date", "desc"), 
          limit(20)
        );
        unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
            const txns: Transaction[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                const date = (data.date as Timestamp)?.toDate().toISOString() || new Date().toISOString();
                txns.push({
                    id: doc.id,
                    type: data.type || 'Unknown',
                    direction: data.direction || (data.senderUid === authUser.uid ? 'sent' : 'received'),
                    party: data.party || 'Unknown Party',
                    amount: data.amount || 0,
                    currency: data.currency || 'PHP',
                    date: date,
                    icon: data.icon || 'Users',
                    status: data.status || 'Completed',
                    ipAddress: data.ipAddress,
                    fxDetails: data.fxDetails,
                });
            });
            setTransactions(txns);
        }, (error) => {
            console.error("Error fetching transactions:", error);
            setTransactions([]);
        });

      } else {
        setUser(null);
        setUserAccount(null);
        setTransactions(null);
        setIsLoading(false);
      }
    });

    return () => {
        unsubscribeAuth();
        if (unsubscribeProfile) unsubscribeProfile();
        if (unsubscribeWallets) unsubscribeWallets();
        if (unsubscribeTransactions) unsubscribeTransactions();
    };
  }, [isLoading]); // Rerun effect if isLoading changes

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      // State will be cleared by onAuthStateChanged listener
      router.push('/');
    } catch (error) {
      console.error("Failed to log out:", error);
    } finally {
      // No need to set loading false here, onAuthStateChanged handles it
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        userAccount,
        transactions,
        isAuthenticated: !!user,
        isLoading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 