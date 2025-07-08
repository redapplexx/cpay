"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.listWalletsByUserTest = exports.getWalletBalanceTest = exports.postTransactionTest = exports.createWalletTest = exports.listAuditLogs = exports.getAuditLogs = exports.listConfigs = exports.setConfig = exports.getConfig = exports.listNotifications = exports.markNotificationAsRead = exports.getNotifications = exports.sendNotification = exports.listWebhooks = exports.getWebhookEvent = exports.retryWebhookEvent = exports.receiveWebhookEvent = exports.checkPermission = exports.setPermission = exports.getPermissionsByRole = exports.listAML = exports.getAMLFlagsByUser = exports.reviewAMLFlag = exports.flagTransaction = exports.calculateFXFee = exports.setFXFeeConfig = exports.getFXFeeConfig = exports.listKYC = exports.getKYCRecords = exports.verifyKYCDocument = exports.uploadKYCDocument = exports.retryPayoutBatch = exports.processPayoutBatch = exports.listLedgers = exports.getLedgerEntries = exports.convertCurrency = exports.updateTransactionStatus = exports.listTransactions = exports.getTransaction = exports.sendPayment = exports.getWalletBalance = exports.getWallet = exports.createWallet = exports.updateKYCStatus = exports.updateUserRole = exports.listUsers = exports.updateUser = exports.getUser = exports.createUser = void 0;
// Import all Cloud Functions
const userFunctions = __importStar(require("./functions/users"));
const walletFunctions = __importStar(require("./functions/wallets"));
const transactionFunctions = __importStar(require("./functions/transactions"));
const ledgerFunctions = __importStar(require("./functions/ledgers"));
const payoutFunctions = __importStar(require("./functions/payouts"));
const kycFunctions = __importStar(require("./functions/kyc"));
const fxFeeFunctions = __importStar(require("./functions/fx_fees"));
const amlFunctions = __importStar(require("./functions/aml"));
const accessControlFunctions = __importStar(require("./functions/access_control"));
const webhookFunctions = __importStar(require("./functions/webhooks"));
const notificationFunctions = __importStar(require("./functions/notifications"));
const configFunctions = __importStar(require("./functions/configs"));
const auditLogFunctions = __importStar(require("./functions/audit_logs"));
// Import test functions
const testFunctions = __importStar(require("./test-functions"));
// Export all functions for Firebase deployment
exports.createUser = userFunctions.createUser, exports.getUser = userFunctions.getUser, exports.updateUser = userFunctions.updateUser, exports.listUsers = userFunctions.listUsers, exports.updateUserRole = userFunctions.updateUserRole, exports.updateKYCStatus = userFunctions.updateKYCStatus;
exports.createWallet = walletFunctions.createWallet, exports.getWallet = walletFunctions.getWallet, exports.getWalletBalance = walletFunctions.getWalletBalance;
exports.sendPayment = transactionFunctions.sendPayment, exports.getTransaction = transactionFunctions.getTransaction, exports.listTransactions = transactionFunctions.listTransactions, exports.updateTransactionStatus = transactionFunctions.updateTransactionStatus, exports.convertCurrency = transactionFunctions.convertCurrency;
exports.getLedgerEntries = ledgerFunctions.getLedgerEntries, exports.listLedgers = ledgerFunctions.listLedgers;
exports.processPayoutBatch = payoutFunctions.processPayoutBatch, exports.retryPayoutBatch = payoutFunctions.retryPayoutBatch;
exports.uploadKYCDocument = kycFunctions.uploadKYCDocument, exports.verifyKYCDocument = kycFunctions.verifyKYCDocument, exports.getKYCRecords = kycFunctions.getKYCRecords, exports.listKYC = kycFunctions.listKYC;
exports.getFXFeeConfig = fxFeeFunctions.getFXFeeConfig, exports.setFXFeeConfig = fxFeeFunctions.setFXFeeConfig, exports.calculateFXFee = fxFeeFunctions.calculateFXFee;
exports.flagTransaction = amlFunctions.flagTransaction, exports.reviewAMLFlag = amlFunctions.reviewAMLFlag, exports.getAMLFlagsByUser = amlFunctions.getAMLFlagsByUser, exports.listAML = amlFunctions.listAML;
exports.getPermissionsByRole = accessControlFunctions.getPermissionsByRole, exports.setPermission = accessControlFunctions.setPermission, exports.checkPermission = accessControlFunctions.checkPermission;
exports.receiveWebhookEvent = webhookFunctions.receiveWebhookEvent, exports.retryWebhookEvent = webhookFunctions.retryWebhookEvent, exports.getWebhookEvent = webhookFunctions.getWebhookEvent, exports.listWebhooks = webhookFunctions.listWebhooks;
exports.sendNotification = notificationFunctions.sendNotification, exports.getNotifications = notificationFunctions.getNotifications, exports.markNotificationAsRead = notificationFunctions.markNotificationAsRead, exports.listNotifications = notificationFunctions.listNotifications;
exports.getConfig = configFunctions.getConfig, exports.setConfig = configFunctions.setConfig, exports.listConfigs = configFunctions.listConfigs;
exports.getAuditLogs = auditLogFunctions.getAuditLogs, exports.listAuditLogs = auditLogFunctions.listAuditLogs;
// Export test functions
exports.createWalletTest = testFunctions.createWallet, exports.postTransactionTest = testFunctions.postTransaction, exports.getWalletBalanceTest = testFunctions.getWalletBalance, exports.listWalletsByUserTest = testFunctions.listWalletsByUser;
//# sourceMappingURL=index.js.map