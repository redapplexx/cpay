'use server';

/**
 * @fileOverview Analyzes KYC documents, extracts data, and compares it with user-entered information.
 *
 * - kycDocumentAnalyzer - A function that handles the KYC document analysis process.
 * - KycDocumentAnalyzerInput - The input type for the kycDocumentAnalyzer function.
 * - KycDocumentAnalyzerOutput - The return type for the kycDocumentAnalyzer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const KycDocumentAnalyzerInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      'A KYC document image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
  selfieDataUri: z
    .string()
    .describe(
      'A selfie image for liveness verification, as a data URI that must include a MIME type and use Base64 encoding.'
    ),
  enteredInformation: z.object({
      fullName: z.string(),
      dob: z.string(),
      address: z.string(),
      permanentAddress: z.string(),
      sourceOfFunds: z.string(),
      nationality: z.string(),
      tin: z.string().optional(),
      sss: z.string().optional(),
      passport: z.string().optional(),
  }).describe('The information entered by the user.'),
});
export type KycDocumentAnalyzerInput = z.infer<typeof KycDocumentAnalyzerInputSchema>;

const KycDocumentAnalyzerOutputSchema = z.object({
  verificationStatus: z.enum(['VERIFIED', 'PENDING_REVIEW', 'REJECTED']).describe("The final verification status based on the analysis."),
  overallMatchingScore: z.number().min(0).max(1).describe('The overall matching score between the document, selfie, and entered information (0-1).'),
  discrepancies: z.string().describe('A summary of any discrepancies found. Should be "None" if no issues are found.'),
  summary: z.string().describe("A brief summary of the verification results, explaining the status."),
});
export type KycDocumentAnalyzerOutput = z.infer<typeof KycDocumentAnalyzerOutputSchema>;

export async function kycDocumentAnalyzer(input: KycDocumentAnalyzerInput): Promise<KycDocumentAnalyzerOutput> {
  return kycDocumentAnalyzerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'kycDocumentAnalyzerPrompt',
  input: {schema: KycDocumentAnalyzerInputSchema},
  output: {schema: KycDocumentAnalyzerOutputSchema},
  prompt: `You are an expert in KYC (Know Your Customer) document analysis for financial institutions.

You will receive a KYC document image, a selfie for liveness verification, and the information entered by the user. Your task is to analyze these materials, verify the information, identify discrepancies, and provide a verification decision and summary.

KYC Document:
{{media url=documentDataUri}}

User's Selfie:
{{media url=selfieDataUri}}

Entered Information:
- Full Name: {{{enteredInformation.fullName}}}
- Date of Birth: {{{enteredInformation.dob}}}
- Address: {{{enteredInformation.address}}}
- Permanent Address: {{{enteredInformation.permanentAddress}}}
- Source of Funds: {{{enteredInformation.sourceOfFunds}}}
- Nationality: {{{enteredInformation.nationality}}}
- TIN: {{{enteredInformation.tin}}}
- SSS: {{{enteredInformation.sss}}}
- Passport: {{{enteredInformation.passport}}}


Instructions:
1.  Extract all relevant information from the KYC document, including name, address, and date of birth.
2.  Analyze the selfie to ensure it is of a live person and not a photo of a photo.
3.  Compare the face in the selfie with the photo on the KYC document to ensure they match.
4.  Compare the extracted information from the document with the user-provided information.
5.  Calculate an 'overallMatchingScore' (0-1) based on the accuracy of entered info, document validity, and selfie match.
6.  Detail any mismatches in the 'discrepancies' field. If everything matches, this should be "None".
7.  Based on the score and discrepancies, determine a 'verificationStatus'.
    - If the score is high (e.g., > 0.9) and discrepancies are "None", set status to 'VERIFIED'.
    - If there are minor issues, the document is unclear, or the score is moderate (e.g., 0.6-0.9), set it to 'PENDING_REVIEW'.
    - If there are major mismatches or a very low score (< 0.6), set it to 'REJECTED'.
8.  Provide a concise 'summary' of your findings that justifies the final status.
`,
});

const kycDocumentAnalyzerFlow = ai.defineFlow(
  {
    name: 'kycDocumentAnalyzerFlow',
    inputSchema: KycDocumentAnalyzerInputSchema,
    outputSchema: KycDocumentAnalyzerOutputSchema,
  },
  async input => {
    // In a real scenario, you might add steps here to check against an anti-fraud database.
    const {output} = await prompt(input);
    return output!;
  }
);
