'use client';

import { useState, useTransition } from 'react';
import {
  generateFinancialAdvice,
  type FinancialAdviceOutput,
} from '@/ai/flows/ai-driven-financial-advice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';

const defaultTransactionData = JSON.stringify(
  {
    transactions: [
      {
        date: '2024-05-01',
        description: 'Salary Deposit',
        amount: 300000,
        category: 'Income',
        currency: 'KRW',
      },
      {
        date: '2024-05-01',
        description: 'Rent',
        amount: -80000,
        category: 'Housing',
        currency: 'KRW',
      },
      {
        date: '2024-05-03',
        description: 'Groceries',
        amount: -15000,
        category: 'Food',
        currency: 'KRW',
      },
      {
        date: '2024-05-05',
        description: 'Remittance to PH',
        amount: -50000,
        category: 'Family Support',
        currency: 'KRW',
      },
      {
        date: '2024-05-10',
        description: 'Online Shopping',
        amount: -25000,
        category: 'Shopping',
        currency: 'KRW',
      },
      {
        date: '2024-05-15',
        description: 'Utilities',
        amount: -10000,
        category: 'Bills',
        currency: 'KRW',
      },
    ],
  },
  null,
  2,
);

const defaultUserProfile = JSON.stringify(
  {
    userId: 'user_456',
    age: 28,
    income: 300000,
    location: 'Seoul, KR',
    financialGoals: ['Save for a house deposit', 'Invest in stocks'],
    nationality: 'Filipino',
  },
  null,
  2,
);

export function FinancialAdviceForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [transactionData, setTransactionData] = useState(defaultTransactionData);
  const [userProfile, setUserProfile] = useState(defaultUserProfile);
  const [result, setResult] = useState<FinancialAdviceOutput | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(null);

    startTransition(async () => {
      try {
        const output = await generateFinancialAdvice({
          transactionData,
          userProfile,
        });
        setResult(output);
        toast({
          title: 'Advice Generated',
          description: 'Your personalized financial advice is ready.',
        });
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Failed to Get Advice',
          description: 'Could not run the AI financial advisor.',
        });
      }
    });
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="shadow-elegant rounded-3xl">
        <CardHeader>
          <CardTitle>Your Financial Data</CardTitle>
          <CardDescription>Provide data in JSON format.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="transactionData">Transaction History</Label>
              <Textarea
                id="transactionData"
                value={transactionData}
                onChange={(e) => setTransactionData(e.target.value)}
                rows={10}
                className="font-mono text-xs rounded-xl"
                placeholder="Enter transaction data as JSON..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userProfile">User Profile</Label>
              <Textarea
                id="userProfile"
                value={userProfile}
                onChange={(e) => setUserProfile(e.target.value)}
                rows={10}
                className="font-mono text-xs rounded-xl"
                placeholder="Enter user profile data as JSON..."
              />
            </div>
            <Button type="submit" disabled={isPending} className="w-full rounded-xl">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Get Financial Advice
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-elegant rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles />
            AI-Powered Advice
          </CardTitle>
          <CardDescription>Your personalized recommendations from our AI advisor.</CardDescription>
        </CardHeader>
        <CardContent>
          {isPending && (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Generating advice...</p>
            </div>
          )}
          {result ? (
            <div className="space-y-4">
              <div className="text-sm bg-accent/50 p-4 rounded-xl text-accent-foreground/90 whitespace-pre-wrap">
                {result.advice}
              </div>
            </div>
          ) : (
            !isPending && (
              <p className="text-center text-muted-foreground py-16">
                Submit your data to receive personalized advice.
              </p>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
