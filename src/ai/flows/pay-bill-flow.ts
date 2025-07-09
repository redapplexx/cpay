'use server';
/**
 * @fileOverview Simulates a bills payment transaction.
 *
 * - payBill - A function that handles the bills payment process.
 * - PayBillInput - The input type for the payBill function.
 * - PayBillOutput - The return type for the payBill function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const PayBillInputSchema = z.object({
  userId: z.string().describe("The ID of the user paying the bill."),
  biller: z.string().describe("The name of the biller being paid."),
  accountNumber: z.string().describe("The account or reference number for the bill."),
  amount: z.number().min(1).describe('The amount to pay.'),
});
export type PayBillInput = z.infer<typeof PayBillInputSchema>;

const PayBillOutputSchema = z.object({
    transactionId: z.string().describe("The unique ID for the transaction."),
    status: z.enum(['SUCCESS', 'FAILED', 'PENDING']).describe("The status of the transaction."),
    message: z.string().describe("A message describing the result of the transaction."),
});
export type PayBillOutput = z.infer<typeof PayBillOutputSchema>;

export async function payBill(input: PayBillInput): Promise<PayBillOutput> {
  return payBillFlow(input);
}

const payBillFlow = ai.defineFlow(
  {
    name: 'payBillFlow',
    inputSchema: PayBillInputSchema,
    outputSchema: PayBillOutputSchema,
  },
  async (input) => {
    console.log('Initiating bills payment:', input);
    // In a real app, you would also deduct this from the user's wallet balance.
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newTransactionRef = await addDoc(collection(db, 'transactions'), {
        userId: input.userId,
        type: 'Bills Payment',
        direction: 'sent',
        party: input.biller,
        amount: input.amount,
        currency: 'PHP',
        date: serverTimestamp(),
        icon: 'ReceiptText',
        status: 'Completed',
        notes: `Account #: ${input.accountNumber}`,
        ipAddress: '192.168.1.1', // Mock IP
    });

    return {
        transactionId: newTransactionRef.id,
        status: 'SUCCESS',
        message: `Successfully paid PHP ${input.amount.toFixed(2)} to ${input.biller}.`,
    };
  }
);
