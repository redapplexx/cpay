# Technical Directive for CPay Backend Development (Firebase/GCP)

## 1. Introduction

This document provides technical directives for the backend development of the CPay platform using Firebase and Google Cloud Platform (GCP) services. It translates the functional and non-functional requirements outlined in the structured BRD into actionable implementation guidelines, focusing on Firestore schema design, Cloud Functions logic, and security considerations. This directive strictly adheres to the phasing defined in the BRD.

## 2. Firestore Schema Definition

The core data entities will be stored in Firestore. Collections and their essential fields are defined below. Strict data validation must be enforced at the Cloud Functions layer and via Firestore Security Rules.

### `users` Collection

Represents individual CPay users.

- `uid`: String (Firebase Auth User ID - document ID)
- `mobileNumber`: String (Unique, Indexed for login - Phase 1)
- `username`: String (Unique, Indexed for login - Phase 2)
- `email`: String (Unique, Indexed for login - Phase 2)
- `passwordHash`: String (Hashed password - Phase 1)
- `pinHash`: String (Hashed 6-digit PIN - Phase 2)
- `fullName`: String (Phase 1)
- `dateOfBirth`: Timestamp (Phase 1)
- `placeOfBirth`: String (Phase 1)
- `currentAddress`: String (Phase 1)
- `nationality`: String (Phase 1)
- `gender`: String (Phase 2)
- `civilStatus`: String (Phase 2)
- `permanentAddress`: String (Phase 2)
- `sourceOfFunds`: String (Phase 2)
- `passportNumber`: String (Phase 2)
- `tin`: String (Phase 2)
- `sssNumber`: String (Phase 2)
- `kycStatus`: String ('pending', 'approved', 'rejected' - Phase 2)
- `kycSubmissionRef`: DocumentReference (Link to `kycSubmissions` document - Phase 2)
- `referralId`: String (Optional - Phase 2)
- `accountBalancePHP`: Number (Default 0.00 - Phase 1)
- `accountBalanceUSD`: Number (Default 0.00 - Phase 2)
- `accountBalanceKRW`: Number (Default 0.00 - Phase 2)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp
- `lastLoginAt`: Timestamp
- `status`: String ('active', 'inactive', 'suspended')
- `language`: String ('en' - Phase 1, 'en', 'tl', 'ko' - Phase 2)

### `merchants` Collection

Represents business partners (KYB).

- `merchantId`: String (Auto-generated ID - document ID)
- `registeredName`: String (Phase 2)
- `tradeName`: String (Phase 2)
- `registeredAddress`: String (Phase 2)
- `operationAddress`: String (Phase 2)
- `dateOfIncorporation`: Timestamp (Phase 2)
- `tin`: String (Phase 2)
- `businessType`: String (e.g., 'Sole Proprietorship', 'Partnership', 'Corporation' - Phase 2)
- `bankAccountDetails`: Object (Settlement bank info - Phase 2)
  - `bankName`: String
  - `accountNumber`: String
  - `accountName`: String
- `kybStatus`: String ('pending', 'approved', 'rejected' - Phase 2)
- `kybSubmissionRef`: DocumentReference (Link to `kybSubmissions` document - Phase 2)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp
- `status`: String ('active', 'inactive', 'suspended')

### `transactions` Collection

Records all financial transactions.

- `transactionId`: String (Auto-generated ID - document ID)
- `userId`: String (Reference to user - Phase 1)
- `merchantId`: String (Reference to merchant, if applicable - Phase 1 for QR, Phase 2 for others)
- `type`: String ('cash_in', 'cash_out', 'p2p_transfer', 'bill_payment', 'eload', 'qr_payment', 'online_payment', 'remittance', 'api_charge')
- `amount`: Number
- `currency`: String ('PHP' - Phase 1, 'PHP', 'USD', 'KRW' - Phase 2)
- `fee`: Number
- `status`: String ('pending', 'completed', 'failed', 'reversed')
- `timestamp`: Timestamp (Transaction initiation time)
- `completionTimestamp`: Timestamp (Transaction completion time)
- `details`: Object (Specific details based on transaction type)
  - `senderUserId`: String (For P2P, Remittance, Transfer)
  - `receiverUserId`: String (For P2P, Remittance, Transfer)
  - `destinationAccount`: String (Bank/eWallet account for cash-out, transfer)
  - `billDetails`: Object (For bill payments - Phase 1)
    - `billerName`: String
    - `accountNumber`: String
  - `eloadDetails`: Object (For eLoads - Phase 1)
    - `mobileNumber`: String
    - `network`: String
  - `qrCode`: String (QR code data - Phase 1)
  - `paymentGatewayDetails`: Object (For online payments - Phase 2)
    - `gateway`: String
    - `transactionRef`: String
- `source`: String ('mobile_app', 'admin_portal', 'api')
- `adminNotes`: String (For reversals, pauses - Phase 1)

### `kycSubmissions` Collection

Stores detailed KYC/KYB submission data and documents. Sensitive documents should be stored in Cloud Storage and referenced here.

- `submissionId`: String (Auto-generated ID - document ID)
- `userId`: String (Reference to user, if applicable - Phase 2)
- `merchantId`: String (Reference to merchant, if applicable - Phase 2)
- `type`: String ('kyc', 'kyb')
- `status`: String ('submitted', 'reviewing', 'approved', 'rejected')
- `submittedAt`: Timestamp
- `reviewedAt`: Timestamp
- `reviewerId`: String (Reference to admin user)
- `rejectionReason`: String (If rejected)
- `kycData`: Object (Detailed KYC info beyond `users` collection - Phase 2)
  - `idType`: String
  - `idNumber`: String
  - `idPhotoUrl`: String (Cloud Storage URL)
  - `selfiePhotoUrl`: String (Cloud Storage URL)
  - `videoCallValidationStatus`: String ('pending', 'completed', 'failed' - Phase 2)
- `kybData`: Object (Detailed KYB info beyond `merchants` collection - Phase 2)
  - `businessRegistrationFilesUrls`: Array of Strings (Cloud Storage URLs - Phase 2)
  - `secretarysCertificateUrl`: String (Cloud Storage URL - Phase 2)
  - `authorizedUsers`: Array of Objects (References to user IDs and their roles - Phase 2)
    - `userId`: String
    - `role`: String ('maker', 'approver')

## 3. Cloud Functions Logic

Cloud Functions will serve as the secure backend for handling critical operations, ensuring data integrity and business logic execution.

### 3.1 User Registration (Phase 1 & 2)

- **Trigger:** HTTPS request from mobile app.
- **Logic:**
    - **Phase 1:** Receive mobile number, password, full name, DOB, POB, address, nationality, and agreement to T&C/Privacy Policy (FR-KYC-001, 002, 003, 004, 008).
    - Validate mobile number uniqueness.
    - Hash the password securely.
    - Create a new Firebase Auth user with mobile number.
    - Create a new document in the `users` collection with initial data, setting `kycStatus` to 'pending' (or similar initial state) and `accountBalancePHP` to 0.00.
    - **Phase 2:** Handle optional username and email registration (FR-AUTH-002, 003).
    - Capture additional KYC fields (FR-KYC-005, 006, 009).
    - Integrate with a separate function or service for video call validation (FR-KYC-007). Update `kycStatus` and `kycSubmissionRef` accordingly.

### 3.2 Transaction Processing (Phase 1 & 2)

- **Trigger:** HTTPS request from mobile app or admin portal.
- **Logic:**
    - **Common (All Phases):** Receive transaction details (type, amount, currency, source/destination).
    - Validate user's identity and sufficient balance for debit transactions.
    - Generate a unique transaction ID.
    - Create a new document in the `transactions` collection with initial 'pending' status.
    - **OTP Verification (Phase 1 & 2):** For Cash-Out (FR-SEC-005) and Fund Transfer (FR-SEC-004), trigger an SMS OTP via a third-party service (e.g., Twilio, Vonage). Verify the OTP before proceeding with fund movement.
    - **Fund Movement (Phase 1 & 2):** Use Firestore Transactions to atomically update user balances and potentially merchant balances. This is critical for financial integrity.
    - **External Integrations (Phase 1 & 2):**
        - **InstaPay/PesoNET (Phase 1):** Integrate with a payment gateway or direct bank APIs for cash-in/out and transfers. Handle synchronous/asynchronous responses and update transaction status.
        - **Bills Payment/eLoads (Phase 1):** Integrate with biller/telco APIs.
        - **PayOut Outlets, Vouchers, Crypto (Phase 2):** Integrate with respective service providers.
        - **Online Payments (Phase 2):** Integrate with payment gateways supporting QRPh P2M, eWallets, Banking, Cards.
    - **Transaction Status Update:** Update the transaction document status ('completed', 'failed', 'reversed') and completion timestamp.
    - **Error Handling:** Implement robust error handling and logging for failed transactions. Consider mechanisms for automated or manual reversals (FR-ADM-003).

### 3.3 Merchant Onboarding (Phase 2)

- **Trigger:** HTTPS request from frontend (merchant portal or admin portal).
- **Logic:**
    - Receive merchant details and authorized user information (FR-KYB-001 to 006).
    - Securely handle document uploads to Cloud Storage (FR-KYB-004).
    - Create a new document in the `merchants` collection with status 'pending'.
    - Create a new document in the `kybSubmissions` collection, linking to the merchant and referencing the stored documents (FR-KYB-004).
    - Set `kybStatus` on the merchant document to 'pending'.
    - Implement a mechanism for admin review and approval/rejection, updating the `merchants` and `kybSubmissions` status accordingly.

## 4. Firestore Security Rules Principles

Security Rules are crucial for protecting data access directly from client applications. All sensitive operations must be restricted to be called only by authenticated Cloud Functions.

- **Default Deny:** Start with rules that deny all read/write access by default.
- **Authenticated User Access:** Allow authenticated users to read their own data in the `users` collection: `allow read: if request.auth.uid == resource.data.uid;`.
- **Transaction Read Access:** Allow users to read transactions where they are either the sender or receiver: `allow read: if request.auth.uid == resource.data.senderUserId || request.auth.uid == resource.data.receiverUserId;`.
- **Write Operations via Cloud Functions:** Restrict creation, update, and deletion operations on sensitive collections (`users`, `transactions`, `merchants`, `kycSubmissions`) to be performed only by authenticated Cloud Functions. This can be achieved by verifying `request.auth != null` and potentially checking for a custom claim identifying the request source as a Cloud Function (more advanced).
- **Admin Portal Access:** Implement custom claims for admin users to grant broader read/write access to specific collections via the admin portal application (which should also interact via Cloud Functions for critical actions).
- **KYC/KYB Document Access:** Securely store sensitive documents in Cloud Storage with rules that only allow access via signed URLs generated by authorized Cloud Functions (e.g., for admin review or user download of their own documents).

```
rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Default deny all access
    match /{document=**} {
      allow read, write: if false;
    }

    // Users can only read their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // All writes via Cloud Functions
    }

    // Merchants data - Read access potentially for linked users, Admin read/write via functions
    match /merchants/{merchantId} {
       allow read: if request.auth != null && exists(/databases/$(database)/documents/users/$(request.auth.uid)) // Basic user read (maybe limited fields)
                    || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.merchantId == merchantId; // Linked merchant read
       allow write: if false; // All writes via Cloud Functions
    }

    // Transactions - Users can read transactions they are involved in
    match /transactions/{transactionId} {
      allow read: if request.auth != null && (request.auth.uid == resource.data.userId || request.auth.uid == resource.data.senderUserId || request.auth.uid == resource.data.receiverUserId);
      allow write: if false; // All writes via Cloud Functions
    }

    // KYC/KYB Submissions - Read only by linked user or admin via functions
    match /kycSubmissions/{submissionId} {
      allow read: if request.auth != null && (request.auth.uid == resource.data.userId || (resource.data.type == 'kyb' && exists(/databases/$(database)/documents/users/$(request.auth.uid)) && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.merchantId == resource.data.merchantId));
      allow write: if false; // All writes via Cloud Functions
    }

    // Example of Cloud Function triggered write rule (pseudo-code, needs proper implementation)
    // match /some_sensitive_collection/{docId} {
    //   allow create, update, delete: if request.auth != null && request.auth.token.isCloudFunction == true;
    // }
  }
}
```

## 5. Phased Implementation Map

Backend development tasks aligned with the BRD phases:

### Phase 1 Backend Tasks

- **Authentication & User Management:**
    - Implement Firebase Authentication for mobile number and password (FR-AUTH-001, FR-AUTH-004).
    - Cloud Function for initial user registration (FR-KYC-001, 002, 003, 004, 008) and creating the `users` document.
    - Implement SMS OTP generation and verification via a Cloud Function (FR-SEC-001).
- **Core Wallet & Transactions:**
    - Design and implement the `transactions` Firestore collection.
    - Cloud Functions for P2P transfers (FR-WLT-008) using Firestore Transactions for atomic balance updates.
    - Cloud Functions for Cash-In/Out via eWallets and Banks (InstaPay/PesoNET) (FR-WLT-004, 006, 009) - requires integration with external APIs.
    - Cloud Functions for Bills Payment and eLoads (FR-PAY-003) - requires integration with external APIs.
    - Cloud Function for Closed-Loop QR payments (FR-PAY-001).
    - Implement Transaction History retrieval logic for users (FR-WLT-003).
    - Implement OTP requirement for Cash-Out transactions (FR-SEC-005).
- **Platform Administration:**
    - Develop basic backend logic and security for the Admin Portal (FR-ADM-001, 002, 003, 004, 005, 006). This involves functions to read and manage user/merchant data, view transactions, and perform manual adjustments (with audit trails).

### Phase 2 Backend Tasks

- **Authentication & User Management:**
    - Extend Firebase Authentication for Username/Email login (FR-AUTH-002, 003).
    - Implement logic for 6-digit PINs (FR-AUTH-005).
    - Integrate Firebase Authentication with device-native biometrics (Face ID/Fingerprint) (FR-AUTH-006, 007).
    - Implement logic for the 90-day password expiration prompt (FR-SEC-002).
    - Implement single active login session enforcement logic (FR-SEC-003).
- **KYC/KYB Onboarding:**
    - Design and implement the `kycSubmissions` and `merchants` Firestore collections.
    - Cloud Functions for handling full e-KYC data capture (FR-KYC-005, 006, 009) and document uploads.
    - Integration with a third-party video validation service (FR-KYC-007).
    - Cloud Functions for full Merchant Partner (KYB) onboarding (FR-KYB-001 to 006) including document uploads and role-based user linking.
    - Implement admin review workflows for KYC/KYB submissions.
- **Core Wallet & Transactions Expansion:**
    - Modify schema and functions to handle USD and KRW balances (FR-WLT-001, 002). Note: Actual FX conversion logic may reside here or integrate with an FX provider.
    - Cloud Functions for Cash-In/Out via Agents, Vouchers, and Cryptocurrency (FR-WLT-005, 007) - requires integration with external APIs.
    - Implement OTP requirement for Fund Transfer transactions (FR-SEC-004).
- **Payment Services Expansion:**
    - Cloud Functions for QRPh (InstaPay) payments (FR-PAY-002).
    - Cloud Functions for Offline/Static QR Code payment acceptance for merchants (FR-PAY-004).
    - Cloud Functions for Online Payment Acceptance (QRPh P2M, Direct eWallets, Online Banking, Debit/Credit Cards) (FR-PAY-005) - requires extensive integration with various payment gateways.
- **Platform Administration Enhancement:**
    - Enhance Admin Portal backend functions to support Announcement Management via push notifications (FCM) (FR-ADM-007).
- **API Integration:**
    - Design and implement a JSON-based API using Cloud Functions or Cloud Run (FR-API-001, 002).
    - Implement API endpoints for Inquiry (user info, balance, history) and Charge/Payment, ensuring strict API key authentication and rate limiting.

### Phase 3 Backend Tasks

- **Blockchain Integration:**
    - Research and integrate with a blockchain platform based on the specific requirements of FR-API-003 (Blockchain Features). This will likely involve new Cloud Functions for interacting with blockchain nodes or APIs.

## 6. Non-Functional Requirements Considerations

- **Security:** Implement standard security practices in Cloud Functions (input validation, output sanitization). Use Firebase Authentication and Firestore Security Rules rigorously. Encrypt sensitive data at rest where required by regulations. Ensure secure handling of API keys for external integrations.
- **Compliance:** Design data storage and processing flows to comply with BSP, AMLC, and NPC regulations. Implement necessary logging and audit trails (FR-ADM-006). Ensure data retention policies are met.
- **Performance & Scalability:** Utilize serverless Cloud Functions for automatic scaling. Optimize Firestore queries and data structures for performance. Consider using Redis or similar for caching frequently accessed data if bottlenecks arise.
- **Availability:** Design Cloud Functions for idempotency where possible. Implement retries for external API calls. Utilize Firebase/GCP managed services for high availability.
- **Usability (Language):** Ensure backend responses and data structures support multi-language content (English, Tagalog, Korean - Phase 1 & 2).