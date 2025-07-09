'use server';
/**
 * @fileOverview Simulates a cash-out transaction to a bank account.
 *
 * - cashOut - A function that handles the cash-out process.
 * - CashOutInput - The input type for the cashOut function.
 * - CashOutOutput - The return type for the cashOut function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';


const CashOutInputSchema = z.object({
  userId: z.string().describe("The ID of the user cashing out."),
  bank: z.string().describe("The destination bank name."),
  accountNumber: z.string().describe("The destination bank account number."),
  accountName: z.string().describe("The name of the account holder."),
  amount: z.number().min(1).describe('The amount to cash out.'),
});
export type CashOutInput = z.infer<typeof CashOutInputSchema>;

const CashOutOutputSchema = z.object({
    transactionId: z.string().describe("The unique ID for the transaction."),
    status: z.enum(['SUCCESS', 'FAILED', 'PENDING']).describe("The status of the transaction."),
    message: z.string().describe("A message describing the result of the transaction."),
});
export type CashOutOutput = z.infer<typeof CashOutOutputSchema>;

export async function cashOut(input: CashOutInput): Promise<CashOutOutput> {
  return cashOutFlow(input);
}

const cashOutFlow = ai.defineFlow(
  {
    name: 'cashOutFlow',
    inputSchema: CashOutInputSchema,
    outputSchema: CashOutOutputSchema,
  },
  async (input) => {
    console.log('Initiating cash out:', input);
    // In a real app, you would also deduct this from the user's wallet balance.
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newTransactionRef = await addDoc(collection(db, 'transactions'), {
        userId: input.userId,
        type: 'Cash Out',
        direction: 'sent',
        party: input.bank,
        amount: input.amount,
        currency: 'PHP',
        date: serverTimestamp(),
        icon: 'Landmark',
        status: 'Completed',
        notes: `To account ending in ${input.accountNumber.slice(-4)}`,
        ipAddress: '192.168.1.1', // Mock IP
    });

    return {
        transactionId: newTransactionRef.id,
        status: 'SUCCESS',
        message: `Successfully sent PHP ${input.amount.toFixed(2)} to your ${input.bank} account.`,
    };
  }
);
