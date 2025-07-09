// /firebase/functions/src/payments/vouchers.f.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Redeems a Woori Ventures voucher code.
 */
export const redeemVoucher = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { voucherCode } = data;
    // 1. Look up the voucherCode in a 'vouchers' collection
    // TODO: Implement actual lookup

    // 2. Check if the voucher is valid and not already used
    // TODO: Implement validation

    // 3. In a transaction:
    // a. Mark the voucher as 'REDEEMED'
    // b. Credit the user's PHP wallet with the voucher's value
    // c. Create a transaction log entry

    console.log(`Simulating voucher redeem for code: ${voucherCode} by user ${context.auth.uid}`);
    
    // Simulate crediting 500 PHP for any voucher code
    const userWalletRef = db.collection('users').doc(context.auth.uid).collection('wallets').doc('PHP');
    await userWalletRef.set({
        balance: admin.firestore.FieldValue.increment(500),
        currency: 'PHP',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return { success: true, message: "Successfully redeemed voucher for ₱500.00!" };
});
