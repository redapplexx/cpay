# Structured Business Requirements Document: CPay Platform

## 1.0 Executive Summary

CPay is a digital wallet and financial services platform designed to operate within the Philippines. The platform's core functionalities include user and merchant registration, domestic and international fund transfers, bill payments, and various cash-in/cash-out methods. The development is structured in a phased approach to strategically roll out features, starting with core wallet functionalities in Phase 1 and expanding to advanced features, merchant services, and third-party integrations in subsequent phases. This document outlines the complete business and functional requirements as approved by Woori Ventures Group Corp. and SpeedyPay Inc.

## 2.0 Business Objectives

*   To launch a competitive digital wallet in the Philippine market with a core focus on seamless user experience.
*   To establish a secure and compliant platform for individual (KYC) and business (KYB) onboarding.
*   To facilitate low-cost and efficient domestic fund transfers through national payment rails like InstaPay and PesoNET.
*   To introduce multi-currency support and remittance capabilities, initially focusing on the Philippines-South Korea corridor.
*   To build a robust back-end portal for effective administration, compliance monitoring, and operational management.
*   To enable future growth through API integrations with external partners, such as e-commerce platforms.

## 3.0 System Scope

### 3.1 In-Scope Requirements

All features marked "OKAY" in the source BRD are considered in-scope and are detailed in the functional requirements section below, categorized by their designated development phase.

### 3.2 Out-of-Scope Requirements

The following features, marked "REMOVE" in the source BRD, are explicitly out-of-scope for the current development roadmap:

*   (BRD #2.1.2) Alphabet-only passwords.
*   (BRD #3.1) A standalone, user-configurable 2-Factor Authentication setup screen.
*   (BRD #3.2.2) User verification via Email-based One-Time Pins (OTPs).
*   (BRD #11.7) Barcode-based payments.

## 4.0 Phased Rollout Plan

The development and launch of CPay will proceed in three distinct phases, as specified in the source document.

### Phase 1: Core Wallet Launch (MVP)

This phase focuses on establishing the foundational digital wallet for individual users in the Philippines.

*   **Onboarding:** Mobile Number login, Alphanumeric password, basic user information capture (Name, DOB, Address).
*   **Core Wallet:** PHP currency support, Peer-to-Peer (P2P) transfers, Transaction History.
*   **Domestic Payments:** Cash-in/out via InstaPay & PesoNET, Bills Payment & eLoads.
*   **QR Payments:** Closed-loop QR code transfers.
*   **Platform:** English language support, core Back-End Portal for user and transaction management.

### Phase 2: Expansion & Merchant Services

This phase introduces advanced features, merchant capabilities, and multi-currency support.

*   **Onboarding:** Username/Email login, 6-digit PIN, Face ID/Biometrics, full e-KYC with video validation, and full Merchant Partner (KYB) onboarding.
*   **Advanced Wallet:** Multi-currency display (KRW, USD), expanded cash-in/out options (agents, vouchers), optional password expiration prompts.
*   **Payment Services:** Online payment acceptance (QRPh P2M, eWallets, Banking, Cards).
*   **Platform:** Tagalog and Korean language support, enhanced Admin Portal with push notification management.
*   **API Integration:** Provision of a JSON-based API for integration with third-party partners (e.g., Korean shopping malls).

### Phase 3: Advanced Technology Integration

This phase focuses on integrating emerging financial technologies.

*   **Blockchain Features:** Integration of blockchain-based functionalities into the platform.

## 5.0 Functional Requirements

### 5.1 User Authentication & Login (Module 1)

| ID          | Requirement                                                               | BRD #   | Phase |
| :---------- | :------------------------------------------------------------------------ | :------ | :---- |
| FR-AUTH-001 | System shall support user login via a registered Mobile Number.             | 1.3     | 1     |
| FR-AUTH-002 | System shall support user login via a Username.                           | 1.1     | 2     |
| FR-AUTH-003 | System shall support user login via a registered Email Address.           | 1.2     | 2     |
| FR-AUTH-004 | System shall support password entry via a standard Alphanumeric keypad.   | 2.1.1   | 1     |
| FR-AUTH-005 | System shall support a 6-digit numeric code (PIN) for login.              | 2.1.3   | 2     |
| FR-AUTH-006 | System shall support login using device-native Face ID.                   | 2.2     | 2     |
| FR-AUTH-007 | System shall support login using device-native Biometrics (fingerprint).    | 2.3     | 2     |

### 5.2 Security & User Verification (Module 2)

| ID         | Requirement                                                                        | BRD #   | Phase |
| :--------- | :--------------------------------------------------------------------------------- | :------ | :---- |
| FR-SEC-001 | System shall use a One-Time Pin (OTP) sent via Mobile (SMS) for critical user verifications. | 3.2.1   | 1     |
| FR-SEC-002 | System shall prompt users to change their password every 90 days, with an option to defer. | 4.1     | 2     |
| FR-SEC-003 | System shall enforce a single active login session per user account at any given time.   | 4.2     | 2     |
| FR-SEC-004 | System shall require an OTP for each fund transfer transaction.                      | 11.6    | 2     |
| FR-SEC-005 | System shall require an OTP for each cash-out transaction.                          | 10.4    | 1     |

### 5.3 Individual User Onboarding (e-KYC) (Module 3)

| ID         | Requirement                                                                           | BRD #         | Phase |
| :--------- | :------------------------------------------------------------------------------------ | :------------ | :---- |
| FR-KYC-001 | System shall capture the user's Full Name during registration.                        | 5.1           | 1     |
| FR-KYC-002 | System shall capture the user's Birth Date and Place of Birth.                        | 5.2, 5.3      | 1     |
| FR-KYC-003 | System shall capture the user's Mobile Number and Email Address.                      | 5.4, 5.5      | 1     |
| FR-KYC-004 | System shall capture the user's Current Home Address and Nationality.                 | 5.8, 5.11     | 1     |
| FR-KYC-005 | System shall capture the user's Gender and Civil Status.                              | 5.6, 5.7      | 2     |
| FR-KYC-006 | System shall capture the user's Permanent Home Address, Source of Funds, Passport Number, TIN, and SSS Number. | 5.9 - 5.14    | 2     |
| FR-KYC-007 | System shall include a Real Person Validation via Video Call feature.                 | 5.15          | 2     |
| FR-KYC-008 | Users must accept Terms and Conditions and the Data Privacy Policy to register.       | 5.16, 5.17    | 1     |
| FR-KYC-009 | System shall support an optional Referral ID field during registration.               | 5.18          | 2     |

### 5.4 Merchant Partner Onboarding (KYB) (Module 4)

| ID         | Requirement                                                                                  | BRD #        | Phase |
| :--------- | :------------------------------------------------------------------------------------------- | :----------- | :---- |
| FR-KYB-001 | System shall support onboarding for various business types (Sole, Partnership, Corp, etc.).    | 6.1          | 2     |
| FR-KYB-002 | System shall capture the merchant's Registered Name, Trade Name, Registered Address, Operation Address, Date of Incorporation, and TIN. | 6.2 - 6.7    | 2     |
| FR-KYB-003 | System shall capture the merchant's Bank Account Details for settlement.                     | 6.8          | 2     |
| FR-KYB-004 | System shall require merchants to upload Business Registration Files and a Secretary's Certificate. | 6.9.1, 6.9.2 | 2     |
| FR-KYB-005 | System shall support role-based access for merchant accounts, including Maker and Approver/Authorizer roles. | 6.10.1, 6.10.2 | 2     |
| FR-KYB-006 | System shall capture the personal information (KYC) of the merchant's authorized users.      | 6.12         | 2     |

### 5.5 Core Wallet & Transaction Management (Module 5)

| ID         | Requirement                                                                        | BRD #      | Phase |
| :--------- | :--------------------------------------------------------------------------------- | :--------- | :---- |
| FR-WLT-001 | System shall support PHP - Philippine Peso as the primary currency.                | 8.2        | 1     |
| FR-WLT-002 | System shall support the display of USD - US Dollar and KRW - South Korean Won.    | 8.1, 8.3   | 2     |
| FR-WLT-003 | System shall provide a user-facing Transaction History.                            | 9.4, 10.5  | 1     |
| FR-WLT-004 | System shall support Cash-In via Philippine eWallet Operators and Banks.           | 9.1        | 1     |
| FR-WLT-005 | System shall support Cash-In via PayOut Outlets, Vouchers, and Cryptocurrency (C-CASH, USDT). | 9.2, 9.3   | 2     |
| FR-WLT-006 | System shall support Cash-Out via Fund Transfer to Philippine eWallets and Banks.  | 10.1, 10.2 | 1     |
| FR-WLT-007 | System shall support Cash-Out via PayOut Outlets and Cryptocurrency (C-CASH).      | 10.3, 10.4 | 2     |
| FR-WLT-008 | System shall support Peer-to-Peer (P2P) fund transfers between CPay users.         | 11.1       | 1     |
| FR-WLT-009 | System shall support fund transfers via InstaPay and PesoNET.                      | 11.2, 11.3 | 1     |

### 5.6 Payment Services (Module 6)

| ID         | Requirement                                                                                                 | BRD #      | Phase |
| :--------- | :---------------------------------------------------------------------------------------------------------- | :--------- | :---- |
| FR-PAY-001 | System shall support payments via a Closed-Loop QR Code.                                                    | 11.4       | 1     |
| FR-PAY-002 | System shall support payments via the national QRPh (InstaPay) standard.                                    | 11.5       | 1     |
| FR-PAY-003 | System shall support Bills Payment and eLoads.                                                              | 13         | 1     |
| FR-PAY-004 | System shall support Offline/Static QR Code payment acceptance for merchants.                               | 12.1       | 1     |
| FR-PAY-005 | System shall support Online Payment Acceptance via QRPh P2M, Direct eWallets, Online Banking, and Debit/Credit Cards. | 12.2       | 2     |

### 5.7 Platform Administration (Back-End Portal) (Module 7)

| ID         | Requirement                                                                       | BRD #   | Phase |
| :--------- | :-------------------------------------------------------------------------------- | :------ | :---- |
| FR-ADM-001 | A back-end portal shall be available for User Management (Onboarding & Monitoring). | 14.1    | 1     |
| FR-ADM-002 | The portal shall support Merchant Management (Onboarding & Monitoring).             | 14.2    | 1     |
| FR-ADM-003 | The portal shall support Transaction Management, including reversals and pauses.    | 14.3    | 1     |
| FR-ADM-004 | The portal shall have features for Security/Password Management for admin users.    | 14.4    | 1     |
| FR-ADM-005 | The portal shall generate Transaction Reports.                                    | 14.5    | 1     |
| FR-ADM-006 | The portal shall include an Access Management audit trail.                          | 14.6    | 1     |
| FR-ADM-007 | The portal shall support Announcement Management via push notifications to the app. | 14.7    | 2     |

### 5.8 API & Integrations (Module 8)

| ID        | Requirement                                                                       | BRD #   | Phase |
| :-------- | :-------------------------------------------------------------------------------- | :------ | :---- |
| FR-API-001 | System shall provide a JSON-type API for data exchange with third parties.        | 15.1    | 2     |
| FR-API-002 | The API shall support Inquiry (user info, balance, history) and Charge/Payment endpoints. | 15.2, 15.3 | 2     |
| FR-API-003 | The system shall integrate Blockchain Features.                                   | 16      | 3     |

## 6.0 Non-Functional Requirements

*   **Security:** The platform must implement end-to-end encryption for all data in transit and at rest. Sensitive data (e.g., KYC documents) must be stored in a secure, access-controlled environment.
*   **Compliance:** The system must be designed to comply with all relevant regulations from the Bangko Sentral ng Pilipinas (BSP), the Anti-Money Laundering Council (AMLC), and the National Privacy Commission (NPC).
*   **Performance:** All user-facing financial transactions must be processed in near real-time (< 3 seconds for confirmation). API response times for the mobile app should be under 500ms.
*   **Availability:** The platform shall maintain a minimum uptime of 99.9%.
*   **Scalability:** The underlying architecture must be able to scale automatically to handle peak transaction loads without performance degradation.
*   **Usability:** The platform must support multiple languages as specified: English (Phase 1), Tagalog (Phase 2), and Korean (Phase 2).