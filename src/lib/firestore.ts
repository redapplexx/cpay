import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import type { UserProfile } from '@/types';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) return null;
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return userDocSnap.data() as UserProfile;
    } else {
      console.warn(`No user profile found for UID: ${uid}`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function createUserProfile(user: User, fullName: string): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  const userDocRef = doc(db, 'users', user.uid);

  // Create a new user profile with default values based on the new schema.
  const newUserProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> & { createdAt: unknown; updatedAt: unknown } = {
    uid: user.uid,
    tenantId: 'default', // Default tenant
    email: user.email!,
    mobileNumber: '',
    fullName: fullName || user.displayName || 'New User',
    birthDate: '',
    placeOfBirth: '',
    homeAddress: '',
    nationality: '',
    role: 'user',
    kycStatus: 'pending',
    kycTier: 'basic',
    balance: {
      PHP: 0,
      KRW: 0,
      USD: 0,
    },
    dailyLimit: 1000,
    monthlyLimit: 10000,
    language: 'en',
    aiScore: 0,
    aiRecommendations: [],
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(userDocRef, newUserProfile);
}

export async function getAllUsers(): Promise<UserProfile[]> {
  if (!db) return [];
  try {
    const usersCollectionRef = collection(db, 'users');
    const q = query(usersCollectionRef);
    const querySnapshot = await getDocs(q);
    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      // It's good practice to spread the data and explicitly add the id
      users.push({ ...(doc.data() as Omit<UserProfile, 'uid'>), uid: doc.id });
    });
    return users;
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
}

export async function updateUserStatus(uid: string, status: 'active' | 'suspended'): Promise<void> {
  // Note: The 'status' field is not in the new UserProfile schema.
  // This function can be adapted or removed based on whether you want to re-introduce a user status field.
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  try {
    // You would need to add a 'status' field to the UserProfile type to use this.
    // await updateDoc(userDocRef, { status });
    console.warn("updateUserStatus called, but 'status' is not part of the UserProfile schema.");
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
}
