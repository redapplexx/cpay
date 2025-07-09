'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getFxQuote, type FxQuoteOutput } from '@/ai/flows/fx-quote-flow';
import { initiateRemittance } from '@/ai/flows/initiate-remittance-flow';
import { Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PHFlag, KRFlag } from '@/components/ui/flags';
import { useAuth } from '@/hooks/use-auth';

type Query = {
  amount: string;
  from: 'KRW' | 'PHP';
};

const formSchema = z.object({
  recipientMobile: z.string().min(1, 'Recipient mobile number is required.'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function RemitPage() {
  const [krwAmount, setKrwAmount] = useState('100000');
  const [phpAmount, setPhpAmount] = useState('');
  const [query, setQuery] = useState<Query>({ amount: '100000', from: 'KRW' });
  const [quote, setQuote] = useState<FxQuoteOutput | null>(null);
  const [isFetchingQuote, setIsFetchingQuote] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientMobile: '',
      notes: '',
    },
  });

  const handleKrwChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setKrwAmount(newAmount);
    setQuery({ amount: newAmount, from: 'KRW' });
  };

  const handlePhpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setPhpAmount(newAmount);
    setQuery({ amount: newAmount, from: 'PHP' });
  };

  const onSubmit = (values: FormData) => {
    if (!quote) {
      toast({
        variant: 'destructive',
        title: 'Cannot Send',
        description: 'Please wait for a valid quote before sending.',
      });
      return;
    }
    setIsConfirmOpen(true);
  };
  
  const handleProceedToOtp = () => {
    setIsConfirmOpen(false);
    setIsOtpOpen(true);
    setOtpValue('');
    setOtpError('');
    toast({
        title: 'OTP Sent (Demo)',
        description: `A one-time PIN has been sent to your mobile number. For this demo, the code is 123456.`,
    });
  };

  const handleFinalSubmit = async () => {
     if (otpValue !== '123456') {
        setOtpError('Invalid OTP. Please try again.');
        return;
    }
    if (!user) {
        toast({ variant: 'destructive', title: 'Not Authenticated' });
        return;
    }

    setOtpError('');
    setIsSending(true);

    const values = form.getValues();
    try {
      const result = await initiateRemittance({
        userId: user.uid,
        sourceAmount: quote!.sourceAmount,
        sourceCurrency: query.from,
        targetAmount: quote!.targetAmount,
        targetCurrency: query.from === 'KRW' ? 'PHP' : 'KRW',
        recipientMobile: values.recipientMobile,
        notes: values.notes,
        exchangeRate: quote!.exchangeRate,
      });

      toast({
        title: 'Remittance Sent!',
        description: result.message,
      });
      form.reset();
      setKrwAmount('100000');
      setQuery({ amount: '100000', from: 'KRW' });
    } catch (error) {
      console.error('Remittance failed:', error);
      toast({
        variant: 'destructive',
        title: 'Remittance Failed',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSending(false);
      setIsOtpOpen(false);
    }
  };


  useEffect(() => {
    const fetchQuote = async () => {
      const amount = parseFloat(query.amount);
      if (!amount || isNaN(amount) || amount <= 0) {
        setQuote(null);
        if (query.from === 'KRW') setPhpAmount('');
        else setKrwAmount('');
        return;
      }

      setIsFetchingQuote(true);
      try {
        const result = await getFxQuote({ amount, from: query.from });
        setQuote(result);
        if (query.from === 'KRW') {
          setPhpAmount(result.targetAmount.toFixed(2));
        } else {
          setKrwAmount(result.targetAmount.toFixed(2));
        }
      } catch (err) {
        console.error(err);
        toast({
          variant: 'destructive',
          title: 'Error fetching quote',
          description: 'Could not retrieve the latest exchange rate.',
        });
      } finally {
        setIsFetchingQuote(false);
      }
    };

    const handler = setTimeout(() => {
      fetchQuote();
    }, 500);

    return () => clearTimeout(handler);
  }, [query, toast]);
  
  const formattedSourceAmount = new Intl.NumberFormat(query.from === 'KRW' ? 'ko-KR' : 'en-PH', {
    style: 'currency',
    currency: query.from,
  }).format(quote?.sourceAmount || 0);

  const formattedTargetAmount = new Intl.NumberFormat(query.from === 'KRW' ? 'en-PH' : 'ko-KR', {
    style: 'currency',
    currency: query.from === 'KRW' ? 'PHP' : 'KRW',
  }).format(quote?.targetAmount || 0);

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold tracking-tight font-headline">Send Money Abroad</CardTitle>
              <CardDescription>
                Send money from South Korea to the Philippines and vice-versa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="p-6 rounded-xl border bg-secondary/50 space-y-2">
                   <FormLabel htmlFor="krw-amount" className="flex items-center gap-2 font-semibold">
                      <KRFlag /> You Send
                   </FormLabel>
                   <Input
                    id="krw-amount"
                    type="number"
                    value={krwAmount}
                    onChange={handleKrwChange}
                    placeholder="100,000"
                    className="h-16 border-0 bg-transparent px-0 text-4xl font-bold tracking-tight shadow-none focus-visible:ring-0"
                    />
                    <p className="text-xs text-muted-foreground">South Korean Won (KRW)</p>
                 </div>
                 <div className="p-6 rounded-xl border bg-secondary/50 space-y-2 relative">
                   {isFetchingQuote && query.from === 'KRW' && <div className="absolute inset-0 bg-background/50 rounded-lg animate-pulse"></div>}
                   <FormLabel htmlFor="php-amount" className="flex items-center gap-2 font-semibold">
                      <PHFlag /> Recipient Gets
                   </FormLabel>
                   <Input
                    id="php-amount"
                    type="number"
                    value={phpAmount}
                    onChange={handlePhpChange}
                    placeholder="4,200.00"
                    className="h-16 border-0 bg-transparent px-0 text-4xl font-bold tracking-tight shadow-none focus-visible:ring-0"
                    />
                    <p className="text-xs text-muted-foreground">Philippine Peso (PHP)</p>
                 </div>
              </div>

              <Card className="bg-secondary/50 font-code text-sm">
                <CardContent className="p-4 space-y-2">
                  {isFetchingQuote && (
                    <div className="flex items-center text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fetching latest quote...
                    </div>
                  )}
                  {!isFetchingQuote && quote && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Exchange Rate</span>
                        <span>1 {query.from === 'KRW' ? 'KRW' : 'PHP'} = {quote.exchangeRate.toFixed(4)} {query.from === 'KRW' ? 'PHP' : 'KRW'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fee</span>
                        <span>- {quote.fee.toFixed(2)} {query.from === 'KRW' ? 'PHP' : 'KRW'}</span>
                      </div>
                      <div className="flex justify-between font-bold text-foreground border-t border-dashed pt-2 mt-2">
                        <span>You get this rate</span>
                        <span>1 {query.from === 'KRW' ? 'KRW' : 'PHP'} ≈ {quote.finalRate.toFixed(4)} {query.from === 'KRW' ? 'PHP' : 'KRW'}</span>
                      </div>
                    </>
                  )}
                  {!isFetchingQuote && !quote && (
                    <div className="flex items-center text-muted-foreground">
                      Enter an amount to see a quote.
                    </div>
                  )}
                </CardContent>
              </Card>

              <FormField
                control={form.control}
                name="recipientMobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient's CPay Mobile Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+63 9XX XXX XXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

               <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., For family expenses" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Button
                type="submit"
                size="lg"
                className="w-full sm:w-auto"
                disabled={
                  isFetchingQuote ||
                  isSending ||
                  !quote ||
                  !form.formState.isValid
                }
              >
                {(isSending || isFetchingQuote) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSending ? 'Sending...' : 'Send Remittance'}
              </Button>
               <p className="text-xs text-muted-foreground">
                Live exchange rates provided by our partner.
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Remittance</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to send{' '}
              <span className="font-bold font-mono text-foreground">{formattedSourceAmount}</span>
              {' to receive '}
              <span className="font-bold font-mono text-foreground">{formattedTargetAmount}</span>
              {' for '}
              <span className="font-bold text-foreground">{form.watch('recipientMobile')}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleProceedToOtp}>
              Confirm & Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isOtpOpen} onOpenChange={setIsOtpOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enter OTP</AlertDialogTitle>
            <AlertDialogDescription>
              For your security, please enter the 6-digit code sent to your mobile number to complete the remittance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={otpValue}
                onChange={(e) => {
                    setOtpValue(e.target.value);
                    setOtpError('');
                }}
                maxLength={6}
                placeholder="_ _ _ _ _ _"
                className="pl-10 text-center tracking-[0.5em]"
              />
            </div>
            {otpError && <p className="text-destructive text-sm mt-2 text-center">{otpError}</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalSubmit} disabled={isSending}>
              {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSending ? 'Verifying...' : 'Verify & Send'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
