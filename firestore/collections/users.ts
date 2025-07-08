import { Timestamp } from 'firebase/firestore';

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