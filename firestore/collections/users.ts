import { Timestamp } from 'firebase/firestore';

<<<<<<< HEAD
interface UserProfile {
  fullName: string;
  birthDate: Timestamp;
  passwordLastChangedAt?: Timestamp;
  kycStatus: 'NOT_STARTED' | 'PENDING' | 'VERIFIED';
}

interface Wallet {
  balance: number;
  currency: 'PHP' | 'KRW' | 'USD' | 'C-CASH' | 'USDT';
  updatedAt: Timestamp;
  type: 'FIAT' | 'CRYPTO';
}

// This represents the main user document in the `users` collection.
// The wallets are stored in a sub-collection.
interface User {
  uid: string; // Firebase Auth UID
  mobileNumber: string;
  profile: UserProfile;
  createdAt: Timestamp;
}
=======
interface User {
  uid: string; // Firebase Auth UID
  mobileNumber: string;
  profile: {
    fullName: string;
    birthDate: Timestamp;
  };
  kycStatus: 'NOT_STARTED' | 'PENDING' | 'VERIFIED';
  createdAt: Timestamp;
}
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
