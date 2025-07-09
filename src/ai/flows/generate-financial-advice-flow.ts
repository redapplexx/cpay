'use server';
/**
 * @fileOverview Generates and saves AI-driven financial advice to Firestore.
 * This flow is intended to be run by a scheduler.
 *
 * - generateFinancialAdvice - A function that generates advice and saves it.
 * - GenerateFinancialAdviceInput - The input type for the function.
 * - GenerateFinancialAdviceOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getTransactions } from './get-transactions-flow';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const GenerateFinancialAdviceInputSchema = z.object({
  userId: z.string().describe("The user's ID."),
});
export type GenerateFinancialAdviceInput = z.infer<typeof GenerateFinancialAdviceInputSchema>;

const FinancialAdviceDataSchema = z.object({
  summary: z.string().describe("A one-sentence summary of the user's spending behavior for the period."),
  topCategory: z.string().describe("The spending category with the highest total amount."),
  advice: z.string().describe("A short, actionable piece of financial advice for the user based on their spending."),
});

const GenerateFinancialAdviceOutputSchema = z.object({
    success: z.boolean(),
    insightId: z.string().optional(),
    message: z.string(),
});
export type GenerateFinancialAdviceOutput = z.infer<typeof GenerateFinancialAdviceOutputSchema>;

export async function generateFinancialAdvice(input: GenerateFinancialAdviceInput): Promise<GenerateFinancialAdviceOutput> {
  return generateFinancialAdviceFlow(input);
}

const generateFinancialAdviceFlow = ai.defineFlow(
  {
    name: 'generateFinancialAdviceFlow',
    inputSchema: GenerateFinancialAdviceInputSchema,
    outputSchema: GenerateFinancialAdviceOutputSchema,
  },
  async (input) => {
    const transactions = await getTransactions({userId: input.userId});

    if (transactions.length < 3) {
      return {
        success: false,
        message: "Not enough transaction data to generate insights.",
      };
    }

    const transactionsString = JSON.stringify(transactions, null, 2);

    const {output} = await ai.generate({
      prompt: `You are a friendly and encouraging financial advisor for an app called CPay.
        Analyze the following transaction history for a user. Your goal is to provide a concise, helpful, and positive financial summary.

        Transaction History (JSON format):
        ${transactionsString}

        Based on this data, provide the following in a JSON object:
        1. 'summary': A one-sentence summary of their spending this period.
        2. 'topCategory': The single category they spent the most on (e.g., 'Food', 'Shopping', 'Transport').
        3. 'advice': A short (1-2 sentences), actionable piece of advice. Frame it positively. For example, instead of "You spend too much on coffee," say "You're a real coffee lover! Have you considered brewing at home a few times a week to save?"

        Today's date is ${new Date().toDateString()}.
        `,
      output: {
          schema: FinancialAdviceDataSchema,
      }
    });

    if (!output) {
         return {
            success: false,
            message: "Failed to generate insights from the AI model.",
        };
    }
    
    // Save the generated insight to Firestore
    const newInsightRef = await addDoc(collection(db, 'users', input.userId, 'ai_insights'), {
        ...output,
        generatedAt: serverTimestamp(),
    });

    return {
        success: true,
        insightId: newInsightRef.id,
        message: "Successfully generated and saved new financial insights.",
    };
  }
);
