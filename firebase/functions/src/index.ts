import * as admin from 'firebase-admin';

admin.initializeApp();

// Authentication & Onboarding
export { onboardNewUser } from './onboarding';
export { submitPhase2KYC } from './kyc';
export { submitMerchantOnboarding, handleBusinessVerificationCallback, addMerchantUser } from './kyb';
export { signInWithUsernameAndPassword, signInWithEmailAndPassword, signInWithPin, checkPasswordExpiration, changePassword } from './auth';

// Payments & Transfers
export { initiateP2PTransfer, confirmFundTransferWithOtp } from './transfers';
export { processBillPayment } from './billspayments';
export { processELoad } from './eloads';
export { processClosedLoopQRPayment } from './qrpayments';
export { processQRPhPayment } from './qrphpayments';
export { initiateInstaPayTransfer, initiatePesoNETTransfer } from './nationaltransfers';
export { initiateOnlinePayment } from './onlinepayments'; // New

// Wallet & Transactions
export { getTransactionHistory } from './transactions';
export { initiateCashIn } from './cashin';
export { initiateCashOut } from './cashout';
export { getBlockchainBalance, initiateBlockchainTransfer } from './blockchain';

// New Payment Rails
export { requestCryptoCashOut, generateCryptoCashInAddress } from './payments/crypto.f';
export { redeemVoucher } from './payments/vouchers.f';

// Announcements
export { sendAnnouncement } from './announcements';

// API for Partners
export { getUserInfo, getUserBalance, getUserHistory, processApiChargePayment } from './api';
