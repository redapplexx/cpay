
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, updateProfile, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { type Transaction } from '@/ai/flows/get-transactions-flow';

interface UserProfile {
  fullName?: string;
  address?: string;
  dob?: string;
  kycStatus: 'Verified' | 'Pending' | 'Unverified';
  isMerchant: boolean;
}

interface UserWallets {
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

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Set loading to true initially, will be set to false after initial data loads
      setIsLoading(true);
      
      // Clean up previous user's listeners
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeWallets) unsubscribeWallets();
      if (unsubscribeTransactions) unsubscribeTransactions();

      if (user) {
        setUser(user);
        
        const userRef = doc(db, 'users', user.uid);
        
        // Listener for the user profile document
        unsubscribeProfile = onSnapshot(userRef, async (userDoc) => {
            let profileData: UserProfile;
            
            if (!userDoc.exists()) {
                profileData = {
                    kycStatus: 'Unverified',
                    isMerchant: false,
                };
                await setDoc(userRef, { profile: profileData }, { merge: true });
                
                if (!user.displayName) {
                    await updateProfile(user, {
                        displayName: 'Juan dela Cruz',
                        photoURL: '/user-avatar.png'
                    });
                }
                const krwWalletRef = doc(db, 'users', user.uid, 'wallets', 'KRW');
                const krwWalletDoc = await getDoc(krwWalletRef);
                if (!krwWalletDoc.exists()) {
                    await setDoc(krwWalletRef, { balance: 1234567, currency: 'KRW' });
                    await setDoc(doc(db, 'users', user.uid, 'wallets', 'PHP'), { balance: 50123.45, currency: 'PHP' });
                }
            } else {
                profileData = userDoc.data()?.profile as UserProfile;
            }
            setUserAccount(prev => ({ ...prev, profile: profileData, wallets: prev?.wallets || {} }));
            if (!transactions) setIsLoading(false); // Stop loading if transactions are not yet loaded
        });

        // Listener for wallets sub-collection
        const walletsQuery = query(collection(db, 'users', user.uid, 'wallets'));
        unsubscribeWallets = onSnapshot(walletsQuery, (snapshot) => {
            const walletsData: UserWallets = {};
            snapshot.forEach(doc => {
                walletsData[doc.id] = doc.data() as { balance: number; currency: string; };
            });
            setUserAccount(prev => ({ ...prev, profile: prev?.profile || { kycStatus: 'Unverified', isMerchant: false }, wallets: walletsData }));
        });

        // Listener for transactions collection
        const transactionsQuery = query(collection(db, "transactions"), where("userId", "==", user.uid), orderBy("date", "desc"), limit(5));
        unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
            const txns: Transaction[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                const date = (data.date as Timestamp)?.toDate().toISOString() || new Date().toISOString();
                txns.push({
                    id: doc.id,
                    type: data.type || 'Unknown',
                    direction: data.direction || 'sent',
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
            setIsLoading(false); // Primary loading state ends after transactions are fetched
        }, (error) => {
            console.error("Error fetching transactions:", error);
            setTransactions([]);
            setIsLoading(false);
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
  }, []);

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setUserAccount(null);
      setTransactions(null);
      router.push('/');
    } catch (error) {
      console.error("Failed to log out:", error);
    } finally {
      setIsLoading(false);
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
