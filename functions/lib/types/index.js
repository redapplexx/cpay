"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerEntryType = exports.RiskCategory = exports.WebhookStatus = exports.WebhookEventType = exports.KYCDocumentStatus = exports.KYCDocumentType = exports.MassPayoutRecipientStatus = exports.MassPayoutStatus = exports.TransactionStatus = exports.TransactionType = exports.WalletStatus = exports.KYCStatus = exports.UserStatus = exports.UserRole = void 0;
// Enums
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["MERCHANT"] = "merchant";
    UserRole["USER"] = "user";
    UserRole["COMPLIANCE"] = "compliance";
    UserRole["SUPPORT"] = "support";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["SUSPENDED"] = "suspended";
    UserStatus["PENDING"] = "pending";
    UserStatus["BLOCKED"] = "blocked";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var KYCStatus;
(function (KYCStatus) {
    KYCStatus["NOT_STARTED"] = "not_started";
    KYCStatus["PENDING"] = "pending";
    KYCStatus["APPROVED"] = "approved";
    KYCStatus["REJECTED"] = "rejected";
    KYCStatus["EXPIRED"] = "expired";
})(KYCStatus || (exports.KYCStatus = KYCStatus = {}));
var WalletStatus;
(function (WalletStatus) {
    WalletStatus["ACTIVE"] = "active";
    WalletStatus["SUSPENDED"] = "suspended";
    WalletStatus["CLOSED"] = "closed";
    WalletStatus["PENDING"] = "pending";
})(WalletStatus || (exports.WalletStatus = WalletStatus = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["DEPOSIT"] = "deposit";
    TransactionType["WITHDRAWAL"] = "withdrawal";
    TransactionType["TRANSFER"] = "transfer";
    TransactionType["PAYMENT"] = "payment";
    TransactionType["REFUND"] = "refund";
    TransactionType["FEE"] = "fee";
    TransactionType["FX_CONVERSION"] = "fx_conversion";
    TransactionType["MASS_PAYOUT"] = "mass_payout";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "pending";
    TransactionStatus["PROCESSING"] = "processing";
    TransactionStatus["COMPLETED"] = "completed";
    TransactionStatus["FAILED"] = "failed";
    TransactionStatus["CANCELLED"] = "cancelled";
    TransactionStatus["REVERSED"] = "reversed";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var MassPayoutStatus;
(function (MassPayoutStatus) {
    MassPayoutStatus["PENDING"] = "pending";
    MassPayoutStatus["PROCESSING"] = "processing";
    MassPayoutStatus["COMPLETED"] = "completed";
    MassPayoutStatus["FAILED"] = "failed";
    MassPayoutStatus["CANCELLED"] = "cancelled";
})(MassPayoutStatus || (exports.MassPayoutStatus = MassPayoutStatus = {}));
var MassPayoutRecipientStatus;
(function (MassPayoutRecipientStatus) {
    MassPayoutRecipientStatus["PENDING"] = "pending";
    MassPayoutRecipientStatus["PROCESSING"] = "processing";
    MassPayoutRecipientStatus["COMPLETED"] = "completed";
    MassPayoutRecipientStatus["FAILED"] = "failed";
})(MassPayoutRecipientStatus || (exports.MassPayoutRecipientStatus = MassPayoutRecipientStatus = {}));
var KYCDocumentType;
(function (KYCDocumentType) {
    KYCDocumentType["IDENTITY_CARD"] = "identity_card";
    KYCDocumentType["PASSPORT"] = "passport";
    KYCDocumentType["DRIVERS_LICENSE"] = "drivers_license";
    KYCDocumentType["UTILITY_BILL"] = "utility_bill";
    KYCDocumentType["BANK_STATEMENT"] = "bank_statement";
    KYCDocumentType["SELFIE"] = "selfie";
    KYCDocumentType["PROOF_OF_ADDRESS"] = "proof_of_address";
})(KYCDocumentType || (exports.KYCDocumentType = KYCDocumentType = {}));
var KYCDocumentStatus;
(function (KYCDocumentStatus) {
    KYCDocumentStatus["PENDING"] = "pending";
    KYCDocumentStatus["APPROVED"] = "approved";
    KYCDocumentStatus["REJECTED"] = "rejected";
    KYCDocumentStatus["EXPIRED"] = "expired";
})(KYCDocumentStatus || (exports.KYCDocumentStatus = KYCDocumentStatus = {}));
var WebhookEventType;
(function (WebhookEventType) {
    WebhookEventType["TRANSACTION_CREATED"] = "transaction.created";
    WebhookEventType["TRANSACTION_COMPLETED"] = "transaction.completed";
    WebhookEventType["TRANSACTION_FAILED"] = "transaction.failed";
    WebhookEventType["WALLET_CREATED"] = "wallet.created";
    WebhookEventType["WALLET_UPDATED"] = "wallet.updated";
    WebhookEventType["USER_KYC_APPROVED"] = "user.kyc.approved";
    WebhookEventType["USER_KYC_REJECTED"] = "user.kyc.rejected";
    WebhookEventType["MASS_PAYOUT_COMPLETED"] = "mass_payout.completed";
})(WebhookEventType || (exports.WebhookEventType = WebhookEventType = {}));
var WebhookStatus;
(function (WebhookStatus) {
    WebhookStatus["PENDING"] = "pending";
    WebhookStatus["SENT"] = "sent";
    WebhookStatus["FAILED"] = "failed";
    WebhookStatus["RETRY"] = "retry";
})(WebhookStatus || (exports.WebhookStatus = WebhookStatus = {}));
var RiskCategory;
(function (RiskCategory) {
    RiskCategory["LOW"] = "low";
    RiskCategory["MEDIUM"] = "medium";
    RiskCategory["HIGH"] = "high";
    RiskCategory["CRITICAL"] = "critical";
})(RiskCategory || (exports.RiskCategory = RiskCategory = {}));
var LedgerEntryType;
(function (LedgerEntryType) {
    LedgerEntryType["CREDIT"] = "credit";
    LedgerEntryType["DEBIT"] = "debit";
})(LedgerEntryType || (exports.LedgerEntryType = LedgerEntryType = {}));
//# sourceMappingURL=index.js.map