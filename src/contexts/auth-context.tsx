<<<<<<< HEAD
// src/contexts/auth-context.tsx
=======

>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
<<<<<<< HEAD
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
=======
import { onAuthStateChanged, signOut, updateProfile, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
import { auth, db } from '@/lib/firebase';
import { type Transaction } from '@/ai/flows/get-transactions-flow';

interface UserProfile {
  fullName?: string;
  address?: string;
  dob?: string;
<<<<<<< HEAD
  kycStatus: 'Verified' | 'Pending' | 'Unverified' | 'NOT_STARTED' | 'PENDING_REVIEW';
  isMerchant: boolean;
  passwordLastChangedAt?: Timestamp;
}

export interface UserWallets {
=======
  kycStatus: 'Verified' | 'Pending' | 'Unverified';
  isMerchant: boolean;
}

interface UserWallets {
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
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

<<<<<<< HEAD
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      // Clear all previous listeners to prevent memory leaks on user change
=======
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Set loading to true initially, will be set to false after initial data loads
      setIsLoading(true);
      
      // Clean up previous user's listeners
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeWallets) unsubscribeWallets();
      if (unsubscribeTransactions) unsubscribeTransactions();

<<<<<<< HEAD
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
=======
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
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
        unsubscribeWallets = onSnapshot(walletsQuery, (snapshot) => {
            const walletsData: UserWallets = {};
            snapshot.forEach(doc => {
                walletsData[doc.id] = doc.data() as { balance: number; currency: string; };
            });
<<<<<<< HEAD
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
=======
            setUserAccount(prev => ({ ...prev, profile: prev?.profile || { kycStatus: 'Unverified', isMerchant: false }, wallets: walletsData }));
        });

        // Listener for transactions collection
        const transactionsQuery = query(collection(db, "transactions"), where("userId", "==", user.uid), orderBy("date", "desc"), limit(5));
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
        unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
            const txns: Transaction[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                const date = (data.date as Timestamp)?.toDate().toISOString() || new Date().toISOString();
                txns.push({
                    id: doc.id,
                    type: data.type || 'Unknown',
<<<<<<< HEAD
                    direction: data.direction || (data.senderUid === authUser.uid ? 'sent' : 'received'),
=======
                    direction: data.direction || 'sent',
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
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
<<<<<<< HEAD
        }, (error) => {
            console.error("Error fetching transactions:", error);
            setTransactions([]);
=======
            setIsLoading(false); // Primary loading state ends after transactions are fetched
        }, (error) => {
            console.error("Error fetching transactions:", error);
            setTransactions([]);
            setIsLoading(false);
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
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
<<<<<<< HEAD
  }, [isLoading]); // Rerun effect if isLoading changes
=======
  }, []);
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
<<<<<<< HEAD
      // State will be cleared by onAuthStateChanged listener
=======
      setUser(null);
      setUserAccount(null);
      setTransactions(null);
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
      router.push('/');
    } catch (error) {
      console.error("Failed to log out:", error);
    } finally {
<<<<<<< HEAD
      // No need to set loading false here, onAuthStateChanged handles it
=======
      setIsLoading(false);
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
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
