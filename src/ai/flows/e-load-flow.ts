'use server';
/**
 * @fileOverview Simulates a cellular e-load transaction.
 *
 * - eLoad - A function that handles the e-load process.
 * - ELoadInput - The input type for the eLoad function.
 * - ELoadOutput - The return type for the eLoad function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const ELoadInputSchema = z.object({
  userId: z.string().describe("The ID of the user buying load."),
  mobileNumber: z.string().describe("The mobile number to be loaded."),
  amount: z.number().min(1).describe('The load amount.'),
});
export type ELoadInput = z.infer<typeof ELoadInputSchema>;

const ELoadOutputSchema = z.object({
    transactionId: z.string().describe("The unique ID for the transaction."),
    status: z.enum(['SUCCESS', 'FAILED', 'PENDING']).describe("The status of the transaction."),
    message: z.string().describe("A message describing the result of the transaction."),
});
export type ELoadOutput = z.infer<typeof ELoadOutputSchema>;

export async function eLoad(input: ELoadInput): Promise<ELoadOutput> {
  return eLoadFlow(input);
}

const eLoadFlow = ai.defineFlow(
  {
    name: 'eLoadFlow',
    inputSchema: ELoadInputSchema,
    outputSchema: ELoadOutputSchema,
  },
  async (input) => {
    console.log('Initiating e-load:', input);
    // In a real app, you would also deduct this from the user's wallet balance.
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newTransactionRef = await addDoc(collection(db, 'transactions'), {
        userId: input.userId,
        type: 'E-Load',
        direction: 'sent',
        party: input.mobileNumber,
        amount: input.amount,
        currency: 'PHP',
        date: serverTimestamp(),
        icon: 'Signal',
        status: 'Completed',
        ipAddress: '192.168.1.1', // Mock IP
    });

    return {
        transactionId: newTransactionRef.id,
        status: 'SUCCESS',
        message: `Successfully loaded PHP ${input.amount.toFixed(2)} to ${input.mobileNumber}.`,
    };
  }
);
