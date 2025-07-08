'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cashOut } from '@/ai/flows/cash-out-flow';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Landmark, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

const cashOutSchema = z.object({
  bank: z.string().min(1, 'Please select a bank.'),
  accountNumber: z.string().min(1, 'Account number is required.'),
  accountName: z.string().min(1, 'Account holder name is required.'),
  amount: z.coerce
    .number({ invalid_type_error: 'Please enter a valid amount.' })
    .min(100, 'Minimum cash out is PHP 100.00.'),
});

type CashOutFormData = z.infer<typeof cashOutSchema>;

const banks = [
    { value: 'bdo', label: 'BDO Unibank' },
    { value: 'bpi', label: 'Bank of the Philippine Islands (BPI)' },
    { value: 'metrobank', label: 'Metrobank' },
    { value: 'security_bank', label: 'Security Bank' },
    { value: 'unionbank', label: 'UnionBank of the Philippines' },
];

export default function CashInOutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'cash-in');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');


  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && (tab === 'cash-in' || tab === 'cash-out')) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`${pathname}?tab=${value}`, { scroll: false });
  };

  const form = useForm<CashOutFormData>({
    resolver: zodResolver(cashOutSchema),
    defaultValues: {
      bank: '',
      accountNumber: '',
      accountName: '',
      amount: undefined,
    },
  });

  const formattedAmount = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(form.watch('amount') || 0);

  const onSubmit = (values: CashOutFormData) => {
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
    setIsProcessing(true);
    
    const values = form.getValues();
    try {
      const selectedBank = banks.find((b) => b.value === values.bank);
      const result = await cashOut({
        userId: user.uid,
        bank: selectedBank?.label || values.bank,
        accountNumber: values.accountNumber,
        accountName: values.accountName,
        amount: values.amount,
      });

      toast({
        title: 'Cash Out Successful',
        description: result.message,
      });

      form.reset();
    } catch (error) {
      console.error('Cash out failed:', error);
      toast({
        variant: 'destructive',
        title: 'Cash Out Failed',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsProcessing(false);
      setIsOtpOpen(false);
    }
  };


  return (
    <div className="max-w-2xl mx-auto">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cash-in">Cash In</TabsTrigger>
          <TabsTrigger value="cash-out">Cash Out</TabsTrigger>
        </TabsList>
        <TabsContent value="cash-in">
          <Card>
            <CardHeader>
              <CardTitle>Cash In via InstaPay/PesoNet</CardTitle>
              <CardDescription>
                Add funds to your CPay Wallet from your bank account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4 rounded-lg border p-4">
                <Landmark className="h-8 w-8 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">From Your Banking App</h3>
                  <p className="text-sm text-muted-foreground">
                    1. Open your preferred bank or e-wallet app.
                    <br />
                    2. Select 'Transfer to other bank/e-wallet' via InstaPay or PesoNet.
                    <br />
                    3. Choose 'CPay Wallet' from the list of banks/e-wallets.
                    <br />
                    4. Enter your CPay Wallet mobile number and the amount.
                    <br />
                    5. Confirm the transaction. Funds will reflect in your wallet shortly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="cash-out">
          <Card>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader>
                      <CardTitle>Cash Out to Bank Account</CardTitle>
                      <CardDescription>
                        Withdraw funds from your wallet to a bank account.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                          control={form.control}
                          name="bank"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Destination Bank</FormLabel>
                               <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a bank" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {banks.map(bank => (
                                        <SelectItem key={bank.value} value={bank.value}>{bank.label}</SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                            control={form.control}
                            name="accountNumber"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Account Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter account number" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="accountName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Account Holder Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="As it appears on your bank account" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Amount (PHP)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="0.00" {...field} onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isProcessing || !form.formState.isValid} className="w-full sm:w-auto">
                            {isProcessing ? 'Processing...' : 'Cash Out Now'}
                        </Button>
                    </CardFooter>
                 </form>
             </Form>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Cash Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cash out{' '}
              <span className="font-bold font-mono text-foreground">{formattedAmount}</span> to bank account{' '}
              <span className="font-bold text-foreground">{form.watch('accountNumber')}</span>?
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
              For your security, please enter the 6-digit code sent to your mobile number to complete the cash out.
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
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalSubmit} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isProcessing ? 'Verifying...' : 'Verify & Cash Out'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
