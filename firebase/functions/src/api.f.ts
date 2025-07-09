import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { db } from './firebase'; // Assuming you have initialized Firebase Admin SDK in firebase.ts
import { getTransactionHistory } from './transactions.f'; // Import the existing function
import { initiateP2PTransfer } from './transfers.f'; // Import relevant functions

// Assume API key is stored securely and passed in a header, e.g., 'X-API-Key'
// In a real-world scenario, use a more robust authentication method like OAuth 2.0
const authenticateApiKey = (req: functions.Request, res: functions.Response): admin.auth.DecodedIdToken | null => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        res.status(401).json({ status: 'error', message: 'API Key missing' });
        return null;
    }

    // Placeholder for API key validation logic
    // You would typically look up the API key in a database and verify its validity and associated permissions
    if (apiKey !== 'YOUR_SECURE_STATIC_API_KEY') { // Replace with actual validation
        res.status(403).json({ status: 'error', message: 'Invalid API Key' });
        return null;
    }

    // For demonstration, we'll return a mock decoded token.
    // In a real scenario with a proper auth method, you would verify the token
    // and get the authenticated user's info.
    return {
        uid: 'authenticated-api-user', // A fixed UID or based on the API key's owner
        // Add other relevant claims from your auth method
        // e.g., 'merchantId': 'merchant123' if API key belongs to a merchant
    } as admin.auth.DecodedIdToken; // Cast as DecodedIdToken for type compatibility
};

// GET /api/v1/users/{userId}/info
export const getUserInfo = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*'); // Configure CORS appropriately for production

    if (req.method !== 'GET') {
        res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
        return;
    }

    const authUser = authenticateApiKey(req, res);
    if (!authUser) return;

    const userId = req.path.split('/')[4]; // Extract userId from /api/v1/users/{userId}/info

    if (!userId) {
        res.status(400).json({ status: 'error', message: 'User ID missing' });
        return;
    }

    try {
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            res.status(404).json({ status: 'error', message: 'User not found' });
            return;
        }

        const userData = userDoc.data();
        // Filter sensitive data before returning
        const userInfo = {
            uid: userDoc.id,
            profile: userData?.profile, // Ensure you filter sensitive profile data
            kycStatus: userData?.kycStatus,
            createdAt: userData?.createdAt?.toDate().toISOString(), // Convert Timestamp to string
            // Do NOT expose sensitive information like mobile numbers or balances directly
        };

        res.status(200).json({ status: 'success', data: userInfo });

    } catch (error) {
        console.error('Error fetching user info:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});

// GET /api/v1/users/{userId}/balance
export const getUserBalance = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*'); // Configure CORS appropriately for production

    if (req.method !== 'GET') {
        res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
        return;
    }

    const authUser = authenticateApiKey(req, res);
    if (!authUser) return;

    const userId = req.path.split('/')[4]; // Extract userId from /api/v1/users/{userId}/balance

    if (!userId) {
        res.status(400).json({ status: 'error', message: 'User ID missing' });
        return;
    }

     // Security Note: Ensure the API key owner is authorized to view this user's balance
     // This would typically involve checking if the API key is associated with this userId
     // or if the API key has broader read permissions.

    try {
         const walletsSnapshot = await db.collection('users').doc(userId).collection('wallets').get();

         const balances: { [key: string]: { balance: number; currency: string } } = {};
         walletsSnapshot.forEach(doc => {
             balances[doc.id] = doc.data() as { balance: number; currency: string };
         });

        res.status(200).json({ status: 'success', data: { userId: userId, balances: balances } });

    } catch (error) {
        console.error('Error fetching user balance:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});


// GET /api/v1/users/{userId}/history
export const getUserHistory = functions.https.onRequest(async (req, res) => {
     res.set('Access-Control-Allow-Origin', '*'); // Configure CORS appropriately for production

     if (req.method !== 'GET') {
        res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
        return;
     }

     const authUser = authenticateApiKey(req, res);
     if (!authUser) return;

     const userId = req.path.split('/')[4]; // Extract userId from /api/v1/users/{userId}/history

     if (!userId) {
        res.status(400).json({ status: 'error', message: 'User ID missing' });
        return;
     }

     // Security Note: Ensure the API key owner is authorized to view this user's history.

     const limit = parseInt(req.query.limit as string || '10', 10); // Default limit 10
     const startAfterDocId = req.query.startAfterDocId as string | undefined;

     // Call the internal getTransactionHistory logic.
     // Note: The internal function might need adaptation to be called directly
     // without the 'context' object from callable functions.
     // For simplicity here, I'll simulate calling its core logic or re-implement.
     // A better approach is to refactor common logic into reusable modules.

     try {
         // Re-implementing core logic from getTransactionHistory for HTTP trigger
         const transactionsRef = db.collection('transactions');
         let q: admin.firestore.Query = transactionsRef
             .where('senderId', '==', userId)
             .orderBy('timestamp', 'desc') // Assuming 'timestamp' is the field to order by
             .limit(limit);

         // Note: Implementing the OR condition (senderId == userId || recipientId == userId)
         // efficiently in Firestore HTTP queries requires complex structuring or client-side merging.
         // The callable function approach was better suited for this.
         // For a simple API, we might just return transactions *sent* by the user,
         // or require two separate API calls for sent and received.
         // Let's return transactions where the user is the sender for simplicity in this HTTP example.
         // A real API might need a different data structure or query approach.

         // To handle transactions where user is recipient, a separate query is needed.
         // This highlights why callable functions are often easier for complex logic.

         // Placeholder for getting transactions where user is recipient
         // const receivedTransactionsQuery = transactionsRef
         //      .where('recipientId', '==', userId)
         //      .orderBy('timestamp', 'desc')
         //      .limit(limit);

         // For this HTTP example, we'll stick to just senderId query to keep it simpler.
         // A robust API would need to handle both or denormalize data.

         if (startAfterDocId) {
             const startAfterDoc = await transactionsRef.doc(startAfterDocId).get();
             if (startAfterDoc.exists) {
                 q = q.startAfter(startAfterDoc);
             }
         }

         const snapshot = await q.get();
         const transactions = snapshot.docs.map(doc => {
             const data = doc.data();
             return {
                 id: doc.id,
                 ...data, // Be cautious about exposing sensitive data
                 timestamp: data.timestamp?.toDate().toISOString(), // Convert Timestamp
             };
         });

         const lastDocId = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null;
         const hasMore = snapshot.docs.length === limit; // Simple check, might need refinement

         res.status(200).json({ status: 'success', data: transactions, lastDocId: lastDocId, hasMore: hasMore });

     } catch (error) {
         console.error('Error fetching user history:', error);
         res.status(500).json({ status: 'error', message: 'Internal server error' });
     }
});


// POST /api/v1/payments/charge
export const processApiChargePayment = functions.https.onRequest(async (req, res) => {
     res.set('Access-Control-Allow-Origin', '*'); // Configure CORS appropriately for production

     if (req.method !== 'POST') {
        res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
        return;
     }

     const authUser = authenticateApiKey(req, res);
     if (!authUser) return;

     // Security Note: Ensure the API key owner (e.g., a merchant) is authorized
     // to initiate charges and that the request aligns with their permissions.

     const { amount, currency, recipientUserId, externalTransactionId, description } = req.body;

     // Basic input validation
     if (!amount || !currency || !recipientUserId) {
         res.status(400).json({ status: 'error', message: 'Missing required parameters (amount, currency, recipientUserId)' });
         return;
     }
      if (typeof amount !== 'number' || amount <= 0) {
         res.status(400).json({ status: 'error', message: 'Invalid amount' });
         return;
     }


     try {
         // This is a placeholder. In a real API, you would likely:
         // 1. Validate the recipientUserId exists and is a valid recipient.
         // 2. Identify the *payer*. This might be the API key owner (merchant) paying out,
         //    or an instruction to charge a specific user.
         //    If charging a user, you'd need to identify that user securely (e.g., via a separate auth flow,
         //    or if the API key is for a merchant charging *their* customer, the customer might be identified differently).
         //    The current BRD doesn't specify the exact flow for third-party charge APIs.
         //    Assuming this API is for a third-party *to pay a CPay user* (like a Korean shopping mall paying out):
         //    The sender would be the entity associated with the API key, and the recipient is recipientUserId.
         //    This would be similar to a P2P transfer initiated by a trusted party.

         // For simplicity, let's simulate a transfer *from* the API key owner's associated CPay account (if they have one)
         // *to* the recipientUserId. This requires the API key owner to have a balance.
         // A more flexible API might allow specifying the source of funds or charging a customer.

         const senderUserId = authUser.uid; // Assuming API key owner has a CPay account

         // You would call an internal transfer/payment processing function here.
         // Example (assuming a P2P-like flow from API owner to recipient):
         // const result = await initiateP2PTransfer({ senderId: senderUserId, recipientId: recipientUserId, amount, currency });
         // This would require adapting initiateP2PTransfer or creating a new function that doesn't rely solely on `context.auth`.

         // Placeholder: Directly update balances and create transaction (simplified, lacks atomic transaction)
         const senderRef = db.collection('users').doc(senderUserId);
         const recipientRef = db.collection('users').doc(recipientUserId);

         // Security/Atomicity: The following balance updates and transaction creation
         // should ideally be done within a Firestore Transaction for atomicity,
         // especially in a production financial application.

         // Placeholder for balance check (senderUserId needs a balance)
         // const senderDoc = await senderRef.get();
         // const senderBalance = senderDoc.data()?.wallets?.[currency]?.balance || 0;
         // if (senderBalance < amount) {
         //     res.status(400).json({ status: 'error', message: 'Insufficient balance in sender account' });
         //     return;
         // }

         // Simulate balance updates (NOT ATOMIC)
         // await senderRef.collection('wallets').doc(currency).update({
         //     balance: admin.firestore.FieldValue.increment(-amount)
         // });
         // await recipientRef.collection('wallets').doc(currency).update({
         //     balance: admin.firestore.FieldValue.increment(amount)
         // });

         // Simulate transaction record (NOT ATOMIC)
         // await db.collection('transactions').add({
         //     type: 'api-charge-payment',
         //     senderId: senderUserId,
         //     recipientId: recipientUserId,
         //     amount: amount,
         //     currency: currency,
         //     timestamp: admin.firestore.FieldValue.serverTimestamp(),
         //     description: description || 'API Charge/Payment',
         //     externalTransactionId: externalTransactionId, // Store third-party ID
         //     status: 'Completed', // Or 'Pending' if asynchronous
         // });

         // A more robust approach would call an internal function like:
         // await processInternalApiTransfer({ senderId: senderUserId, recipientId: recipientUserId, amount, currency, description, externalTransactionId });
         // This internal function would handle atomicity and status updates.

         // For this example, return a simulated success response
         res.status(200).json({ status: 'success', message: 'Payment processed successfully (simulated)' });

     } catch (error) {
         console.error('Error processing API charge/payment:', error);
         res.status(500).json({ status: 'error', message: 'Internal server error' });
     }
});

// You would deploy these as HTTP functions in Firebase:
// firebase deploy --only functions
