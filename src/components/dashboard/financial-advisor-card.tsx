'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Lightbulb, Loader2, RefreshCcw } from 'lucide-react';
import { getFinancialAdvice, type FinancialAdviceOutput } from '@/ai/flows/financial-advisor-flow';
import { generateFinancialAdvice } from '@/ai/flows/generate-financial-advice-flow';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { formatDistanceToNow, parseISO } from 'date-fns';

export function FinancialAdvisorCard({ isCarouselItem = false }: { isCarouselItem?: boolean }) {
  const [isFetching, setIsFetching] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [advice, setAdvice] = useState<FinancialAdviceOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAdvice = async () => {
    if (!user) return;
    setIsFetching(true);
    setError(null);
    try {
      const result = await getFinancialAdvice({ userId: user.uid });
      setAdvice(result);
    } catch (e) {
      console.error(e);
      setError('Sorry, I couldn\'t retrieve your insights right now.');
      setAdvice(null);
    } finally {
      setIsFetching(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchAdvice();
    }
  }, [user]);


  const handleGenerateAdvice = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateFinancialAdvice({ userId: user.uid });
       if (result.success) {
           toast({ title: "Insights Generated", description: "Your new financial summary is ready." });
           await fetchAdvice(); // Re-fetch the latest advice
       } else {
           setError(result.message);
       }
    } catch (e) {
      console.error(e);
      setError('An unexpected error occurred while generating insights.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const renderContent = () => {
      if (isFetching) {
          return (
             <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 font-medium">Loading your summary...</p>
            </div>
          )
      }

      if (error) {
           return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
      }

      if (advice) {
          return (
            <div className="space-y-4">
                <blockquote className="border-l-2 pl-4 italic text-sm">
                    "{advice.summary}"
                </blockquote>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary">
                    <Lightbulb className="h-5 w-5 text-amber-500 mt-1 shrink-0" />
                    <div>
                        <p className="font-semibold text-sm">Top Category: {advice.topCategory}</p>
                        <p className="text-muted-foreground text-sm">{advice.advice}</p>
                    </div>
                </div>
            </div>
          )
      }

      return (
          <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">You don't have any financial insights yet.</p>
              <Button onClick={handleGenerateAdvice} disabled={isGenerating}>
                 {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 Generate My First Summary
              </Button>
          </div>
      )
  }

  return (
    <Card className={cn(isCarouselItem && "h-full flex flex-col")}>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Sparkles className="h-6 w-6" />
                </div>
                <div>
                    <CardTitle className="font-headline text-xl font-semibold tracking-tight">Financial Advisor</CardTitle>
                    <CardDescription>AI-powered insights on your spending.</CardDescription>
                </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleGenerateAdvice} disabled={isGenerating || isFetching} aria-label="Regenerate advice">
               {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            </Button>
        </div>
      </CardHeader>
      <CardContent className={cn("flex-grow flex flex-col justify-center")}>
        {renderContent()}
      </CardContent>
       {advice?.generatedAt && (
        <CardFooter className="justify-end -mb-2">
            <p className="text-xs text-muted-foreground">
                Last updated: {formatDistanceToNow(parseISO(advice.generatedAt), { addSuffix: true })}
            </p>
        </CardFooter>
       )}
    </Card>
  );
}
