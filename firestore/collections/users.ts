import { Timestamp } from 'firebase/firestore';

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
