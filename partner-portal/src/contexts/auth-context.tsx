// partner-portal/src/contexts/auth-context.tsx
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firebaseApp, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface Partner {
  partnerId: string;
  name: string;
  status: 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED';
}

interface PartnerUser {
  uid: string;
  partnerId: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'OPERATOR' | 'VIEWER' | 'MAKER' | 'APPROVER';
}

interface PartnerAuthContextType {
  user: User | null;
  partner: Partner | null;
  partnerUser: PartnerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  logout: () => void;
}

export const AuthContext = createContext<PartnerAuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [partnerUser, setPartnerUser] = useState<PartnerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setIsLoading(true);
      setError(null);
      if (authUser) {
        setUser(authUser);
        try {
          const tokenResult = await authUser.getIdTokenResult(true);
          const { partnerId, role } = tokenResult.claims;

          if (!partnerId || !role) {
            throw new Error('User is not a valid partner. Missing required claims.');
          }
          
          const partnerRef = doc(db, 'partners', partnerId as string);
          const partnerUserRef = doc(db, 'partners', partnerId as string, 'users', authUser.uid);
          
          const [partnerDoc, partnerUserDoc] = await Promise.all([
            getDoc(partnerRef),
            getDoc(partnerUserRef),
          ]);
          
          if (!partnerDoc.exists() || !partnerUserDoc.exists()) {
             throw new Error('Partner or partner user data not found in Firestore.');
          }

          setPartner(partnerDoc.data() as Partner);
          setPartnerUser(partnerUserDoc.data() as PartnerUser);

        } catch (err: any) {
          console.error("Partner Auth Error:", err);
          setError(err);
          await signOut(auth);
          setUser(null);
          setPartner(null);
          setPartnerUser(null);
          router.push('/');
        }
      } else {
        setUser(null);
        setPartner(null);
        setPartnerUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);
  
  const logout = async () => {
      await signOut(auth);
      router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, partner, partnerUser, isAuthenticated: !!user && !!partner, isLoading, error, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
