'use server';
/**
 * @fileOverview Simulates a P2M (Peer to Merchant) payment.
 *
 * - initiatePayment - A function that handles the payment process.
 * - InitiatePaymentInput - The input type for the initiatePayment function.
 * - InitiatePaymentOutput - The return type for the initiatePayment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const InitiatePaymentInputSchema = z.object({
  userId: z.string().describe("The ID of the user initiating the payment."),
  merchantId: z.string().describe("The recipient merchant's ID."),
  amount: z.number().min(1, 'Amount must be greater than 0.').describe('The amount to pay.'),
  notes: z.string().optional().describe('Optional notes for the transaction.'),
});
export type InitiatePaymentInput = z.infer<typeof InitiatePaymentInputSchema>;

const InitiatePaymentOutputSchema = z.object({
    transactionId: z.string().describe("The unique ID for the transaction."),
    status: z.enum(['SUCCESS', 'FAILED', 'PENDING']).describe("The status of the transaction."),
    message: z.string().describe("A message describing the result of the transaction."),
});
export type InitiatePaymentOutput = z.infer<typeof InitiatePaymentOutputSchema>;

export async function initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
  return initiatePaymentFlow(input);
}

// This flow simulates initiating a payment to a merchant
const initiatePaymentFlow = ai.defineFlow(
  {
    name: 'initiatePaymentFlow',
    inputSchema: InitiatePaymentInputSchema,
    outputSchema: InitiatePaymentOutputSchema,
  },
  async (input) => {
    console.log('Initiating payment:', input);
    // In a real app, you would also deduct this from the user's wallet balance.
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newTransactionRef = await addDoc(collection(db, 'transactions'), {
        userId: input.userId,
        type: 'Payment',
        direction: 'sent',
        party: input.merchantId,
        amount: input.amount,
        currency: 'PHP',
        date: serverTimestamp(),
        icon: 'ShoppingCart',
        status: 'Completed',
        notes: input.notes,
        ipAddress: '192.168.1.1', // Mock IP
    });

    return {
        transactionId: newTransactionRef.id,
        status: 'SUCCESS',
        message: `Successfully paid PHP ${input.amount.toFixed(2)} to ${input.merchantId}.`,
    };
  }
);
