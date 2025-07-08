// Import all Cloud Functions
import * as userFunctions from './functions/users';
import * as walletFunctions from './functions/wallets';
import * as transactionFunctions from './functions/transactions';
import * as ledgerFunctions from './functions/ledgers';
import * as payoutFunctions from './functions/payouts';
import * as kycFunctions from './functions/kyc';
import * as fxFeeFunctions from './functions/fx_fees';
import * as amlFunctions from './functions/aml';
import * as accessControlFunctions from './functions/access_control';
import * as webhookFunctions from './functions/webhooks';
import * as notificationFunctions from './functions/notifications';
import * as configFunctions from './functions/configs';
import * as auditLogFunctions from './functions/audit_logs';

// Import test functions
import * as testFunctions from './test-functions';

// Export all functions for Firebase deployment
export const {
  createUser,
  getUser,
  updateUser,
  listUsers,
  updateUserRole,
  updateKYCStatus
} = userFunctions;

export const {
  createWallet,
  getWallet,
  getWalletBalance
} = walletFunctions;

export const {
  sendPayment,
  getTransaction,
  listTransactions,
  updateTransactionStatus,
  convertCurrency
} = transactionFunctions;

export const {
  getLedgerEntries,
  listLedgers
} = ledgerFunctions;

export const {
  processPayoutBatch,
  retryPayoutBatch
} = payoutFunctions;

export const {
  uploadKYCDocument,
  verifyKYCDocument,
  getKYCRecords,
  listKYC
} = kycFunctions;

export const {
  getFXFeeConfig,
  setFXFeeConfig,
  calculateFXFee
} = fxFeeFunctions;

export const {
  flagTransaction,
  reviewAMLFlag,
  getAMLFlagsByUser,
  listAML
} = amlFunctions;

export const {
  getPermissionsByRole,
  setPermission,
  checkPermission
} = accessControlFunctions;

export const {
  receiveWebhookEvent,
  retryWebhookEvent,
  getWebhookEvent,
  listWebhooks
} = webhookFunctions;

export const {
  sendNotification,
  getNotifications,
  markNotificationAsRead,
  listNotifications
} = notificationFunctions;

export const {
  getConfig,
  setConfig,
  listConfigs
} = configFunctions;

export const {
  getAuditLogs,
  listAuditLogs
} = auditLogFunctions;

// Export test functions
export const {
  createWallet: createWalletTest,
  postTransaction: postTransactionTest,
  getWalletBalance: getWalletBalanceTest,
  listWalletsByUser: listWalletsByUserTest
} = testFunctions; 