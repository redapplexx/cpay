'use client';

import { useState, useTransition } from 'react';
import {
  detectFraud,
  type AnalyzeTransactionOutput,
} from '@/ai/flows/ai-powered-fraud-detection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2, Loader2, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const defaultTransactionData = JSON.stringify(
  {
    amount: 50000.0,
    timestamp: '2024-05-21T23:55:00Z',
    sender: 'user_123',
    receiver: 'unknown_beneficiary_99',
    currency: 'KRW',
    location: 'Seoul, KR',
  },
  null,
  2,
);

const defaultUserProfileData = JSON.stringify(
  {
    userId: 'user_123',
    kycStatus: 'VERIFIED',
    riskScore: 15,
    transactionHistory: {
      avgAmount: 25000,
      frequency: 'weekly',
      typicalLocations: ['Manila, PH'],
    },
    loginHistory: [{ ip: '123.45.67.89', location: 'Manila, PH' }],
  },
  null,
  2,
);

export function FraudDetectionForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [transactionData, setTransactionData] = useState(defaultTransactionData);
  const [userProfileData, setUserProfileData] = useState(defaultUserProfileData);
  const [result, setResult] = useState<AnalyzeTransactionOutput | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(null);

    startTransition(async () => {
      try {
        const output = await detectFraud({
          transactionData,
          userProfileData,
        });
        setResult(output);
        toast({
          title: 'Analysis Complete',
          description: 'Fraud detection analysis finished successfully.',
        });
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: 'Could not run the AI fraud detection.',
        });
      }
    });
  };

  const getRiskBadgeVariant = (score: number) => {
    if (score > 70) return 'destructive';
    if (score > 40) return 'secondary';
    return 'default';
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="shadow-elegant rounded-3xl">
        <CardHeader>
          <CardTitle>Input Data</CardTitle>
          <CardDescription>Provide data in JSON format.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="transactionData">Transaction Data</Label>
              <Textarea
                id="transactionData"
                value={transactionData}
                onChange={(e) => setTransactionData(e.target.value)}
                rows={10}
                className="font-code text-xs rounded-xl"
                placeholder="Enter transaction data as JSON..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userProfileData">User Profile Data</Label>
              <Textarea
                id="userProfileData"
                value={userProfileData}
                onChange={(e) => setUserProfileData(e.target.value)}
                rows={10}
                className="font-code text-xs rounded-xl"
                placeholder="Enter user profile data as JSON..."
              />
            </div>
            <Button type="submit" disabled={isPending} className="w-full rounded-xl">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze Transaction
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-elegant rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot />
            AI Analysis Result
          </CardTitle>
          <CardDescription>The model&apos;s assessment of the transaction risk.</CardDescription>
        </CardHeader>
        <CardContent>
          {isPending && (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Analyzing...</p>
            </div>
          )}
          {result ? (
            <div className="space-y-6">
              <div
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{
                  backgroundColor: result.isFraudulent
                    ? 'hsl(var(--destructive) / 0.1)'
                    : 'hsl(var(--primary) / 0.1)',
                  color: result.isFraudulent ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
                }}
              >
                {result.isFraudulent ? (
                  <AlertCircle className="h-8 w-8" />
                ) : (
                  <CheckCircle2 className="h-8 w-8" />
                )}
                <p className="text-lg font-bold">
                  {result.isFraudulent ? 'Potential Fraud Detected' : 'Transaction Appears Normal'}
                </p>
              </div>

              <div>
                <Label>Risk Score</Label>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold font-headline">{result.riskScore}</p>
                  <Badge variant={getRiskBadgeVariant(result.riskScore)}>
                    {result.riskScore > 70 ? 'High' : result.riskScore > 40 ? 'Medium' : 'Low'} Risk
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Suggested Action</Label>
                <p className="font-semibold">{result.suggestedAction}</p>
              </div>

              <div>
                <Label>Explanation</Label>
                <p className="text-sm bg-secondary p-4 rounded-xl">{result.fraudExplanation}</p>
              </div>
            </div>
          ) : (
            !isPending && (
              <p className="text-center text-muted-foreground py-16">
                Submit data to see the AI analysis.
              </p>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
