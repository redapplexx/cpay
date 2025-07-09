'use server';
/**
 * @fileOverview Simulates an international remittance.
 *
 * - initiateRemittance - A function that handles the remittance process.
 * - InitiateRemittanceInput - The input type for the initiateRemittance function.
 * - InitiateRemittanceOutput - The return type for the initiateRemittance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const InitiateRemittanceInputSchema = z.object({
  userId: z.string().describe("The ID of the user initiating the remittance."),
  sourceAmount: z.number().describe("The amount in the source currency."),
  sourceCurrency: z.string().describe("The source currency code (e.g., 'KRW')."),
  targetAmount: z.number().describe("The amount in the target currency."),
  targetCurrency: z.string().describe("The target currency code (e.g., 'PHP')."),
  recipientMobile: z.string().describe("The recipient's mobile number."),
  notes: z.string().optional().describe('Optional notes for the transaction.'),
  exchangeRate: z.number().describe("The exchange rate used."),
});
export type InitiateRemittanceInput = z.infer<typeof InitiateRemittanceInputSchema>;

const InitiateRemittanceOutputSchema = z.object({
    transactionId: z.string().describe("The unique ID for the transaction."),
    status: z.enum(['SUCCESS', 'FAILED', 'PENDING']).describe("The status of the transaction."),
    message: z.string().describe("A message describing the result of the transaction."),
});
export type InitiateRemittanceOutput = z.infer<typeof InitiateRemittanceOutputSchema>;

export async function initiateRemittance(input: InitiateRemittanceInput): Promise<InitiateRemittanceOutput> {
  return initiateRemittanceFlow(input);
}

const initiateRemittanceFlow = ai.defineFlow(
  {
    name: 'initiateRemittanceFlow',
    inputSchema: InitiateRemittanceInputSchema,
    outputSchema: InitiateRemittanceOutputSchema,
  },
  async (input) => {
    console.log('Initiating remittance:', input);
    // In a real app, you would also deduct this from the user's wallet balance.
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newTransactionRef = await addDoc(collection(db, 'transactions'), {
        userId: input.userId,
        type: 'Remittance',
        direction: 'sent',
        party: input.recipientMobile,
        amount: input.sourceAmount,
        currency: input.sourceCurrency,
        date: serverTimestamp(),
        icon: 'Globe',
        status: 'Completed',
        notes: input.notes,
        ipAddress: '192.168.1.1', // Mock IP
        fxDetails: {
            rate: input.exchangeRate,
            sourceAmount: input.sourceAmount,
            targetAmount: input.targetAmount,
            sourceCurrency: input.sourceCurrency,
            targetCurrency: input.targetCurrency,
        }
    });

    return {
        transactionId: newTransactionRef.id,
        status: 'SUCCESS',
        message: `Successfully sent ${input.sourceAmount.toFixed(2)} ${input.sourceCurrency} (for ${input.targetAmount.toFixed(2)} ${input.targetCurrency}) to ${input.recipientMobile}.`,
    };
  }
);
