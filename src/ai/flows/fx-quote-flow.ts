'use server';
/**
 * @fileOverview Provides a mock foreign exchange (FX) quote.
 *
 * - getFxQuote - A function that returns a mock FX quote.
 * - FxQuoteInput - The input type for the getFxQuote function.
 * - FxQuoteOutput - The return type for the getFxQuote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FxQuoteInputSchema = z.object({
  amount: z.number().min(0).describe('The amount to convert.'),
  from: z.enum(['KRW', 'PHP']).describe('The source currency.'),
});
export type FxQuoteInput = z.infer<typeof FxQuoteInputSchema>;

const FxQuoteOutputSchema = z.object({
    sourceAmount: z.number().describe("The original amount in the source currency."),
    targetAmount: z.number().describe("The final amount in the target currency after fees."),
    exchangeRate: z.number().describe("The raw exchange rate before fees."),
    fee: z.number().describe("The fee applied to the transaction, in the target currency."),
    finalRate: z.number().describe("The effective exchange rate after fees."),
});
export type FxQuoteOutput = z.infer<typeof FxQuoteOutputSchema>;

export async function getFxQuote(input: FxQuoteInput): Promise<FxQuoteOutput> {
  return getFxQuoteFlow(input);
}

// This flow simulates calling an external FX service
const getFxQuoteFlow = ai.defineFlow(
  {
    name: 'getFxQuoteFlow',
    inputSchema: FxQuoteInputSchema,
    outputSchema: FxQuoteOutputSchema,
  },
  async (input) => {
    // This is a mock implementation
    const baseRateKRWtoPHP = 0.042;
    const baseRatePHPtoKRW = 1 / baseRateKRWtoPHP;
    const feePercentage = 0.005; // 0.5%

    let sourceAmount: number = input.amount;
    let targetAmountBeforeFee: number;
    let exchangeRate: number;

    if (input.from === 'KRW') {
        exchangeRate = baseRateKRWtoPHP;
        targetAmountBeforeFee = sourceAmount * exchangeRate;
    } else { // from PHP
        exchangeRate = baseRatePHPtoKRW;
        targetAmountBeforeFee = sourceAmount * exchangeRate;
    }
    
    const feeInTargetCurrency = targetAmountBeforeFee * feePercentage;
    const finalTargetAmount = targetAmountBeforeFee - feeInTargetCurrency;
    const finalRate = (sourceAmount > 0) ? finalTargetAmount / sourceAmount : 0;

    return {
        sourceAmount: sourceAmount,
        targetAmount: finalTargetAmount,
        exchangeRate: exchangeRate,
        fee: feeInTargetCurrency,
        finalRate: finalRate,
    };
  }
);
