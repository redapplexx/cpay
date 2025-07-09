'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { initiatePayment } from '@/ai/flows/initiate-payment-flow';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardFooter,
  CardTitle,
} from '@/components/ui/card';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { QrCode, Store, Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QrScannerDialog } from '@/components/dashboard/qr-scanner-dialog';
import { useAuth } from '@/hooks/use-auth';

const formSchema = z.object({
  merchantId: z
    .string()
    .min(1, 'Merchant ID is required.'),
  amount: z.coerce
    .number({ invalid_type_error: 'Please enter a valid amount.' })
    .min(1, 'Amount must be at least PHP 1.00.'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function PayMerchantPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');

  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      merchantId: '',
      amount: undefined,
      notes: '',
    },
  });
  
  const formattedAmount = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(form.watch('amount') || 0);

  const onSubmit = (values: FormData) => {
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
    setIsLoading(true);

    const values = form.getValues();
    try {
      const result = await initiatePayment({
        userId: user.uid,
        merchantId: values.merchantId,
        amount: values.amount,
        notes: values.notes,
      });

      toast({
        title: 'Payment Successful!',
        description: result.message,
      });
      form.reset();
    } catch (error) {
      console.error('Payment failed:', error);
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
      setIsOtpOpen(false);
    }
  };

  const handleScanSuccess = (data: string) => {
    form.setValue('merchantId', data, { shouldValidate: true });
    setIsScannerOpen(false);
    toast({
      title: 'QR Code Scanned',
      description: `Merchant ID has been filled in.`,
    });
  };
  
  return (
    <>
      <div className="max-w-xl mx-auto">
        <Card>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle>Pay Merchant</CardTitle>
                <CardDescription>
                  Pay a merchant by entering their ID or scanning their QR code.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="merchantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Merchant ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Merchant ID" {...field} />
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
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., For coffee and cake" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex-col sm:flex-row gap-2">
                <Button type="submit" className="w-full sm:w-auto" disabled={!form.formState.isValid}>
                  <Store className="mr-2 h-4 w-4" />
                  Pay Now
                </Button>
                <Button variant="outline" className="w-full sm:w-auto" type="button" onClick={() => setIsScannerOpen(true)}>
                  <QrCode className="mr-2 h-4 w-4" />
                  Scan QR Code
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to pay{' '}
              <span className="font-bold font-mono text-foreground">{formattedAmount}</span> to merchant{' '}
              <span className="font-bold text-foreground">{form.watch('merchantId')}</span>?
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
              For your security, please enter the 6-digit code sent to your mobile number to complete the payment.
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
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalSubmit} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Verifying...' : 'Verify & Pay'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <QrScannerDialog open={isScannerOpen} onOpenChange={setIsScannerOpen} onScanSuccess={handleScanSuccess} />
    </>
  );
}
