'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { initiateTransfer } from '@/ai/flows/initiate-transfer-flow';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
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
import { QrCode, ArrowUpRight, Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QrScannerDialog } from '@/components/dashboard/qr-scanner-dialog';
import { useAuth } from '@/hooks/use-auth';

const formSchema = z.object({
  recipient: z
    .string()
    .min(1, 'Recipient mobile number is required.'),
  amount: z.coerce
    .number({ invalid_type_error: 'Please enter a valid amount.' })
    .min(1, 'Amount must be at least PHP 1.00.'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function TransferPage() {
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
      recipient: '',
      amount: undefined,
      notes: '',
    },
  });
  
  const formattedAmount = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(form.watch('amount') || 0);

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
      const result = await initiateTransfer({
        userId: user.uid,
        recipientMobile: values.recipient,
        amount: values.amount,
        notes: values.notes,
      });

      if (result.status === 'SUCCESS') {
        toast({
          title: 'Transfer Successful!',
          description: result.message,
        });
        form.reset();
      } else { // This will catch FLAGGED and any other non-SUCCESS, non-error statuses
        toast({
          variant: result.status === 'FLAGGED' ? 'default' : 'destructive',
          title: result.status === 'FLAGGED' ? 'Transaction Under Review' : 'Transfer Failed',
          description: result.message,
        });
      }

    } catch (error) {
      console.error('Transfer failed:', error);
      toast({
        variant: 'destructive',
        title: 'Transfer Failed',
        description: 'An unexpected server error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
      setIsOtpOpen(false);
    }
  };

  const onSubmit = (values: FormData) => {
    setIsConfirmOpen(true);
  };

  const handleScanSuccess = (data: string) => {
    let recipientFilled = false;
    let amountFilled = false;

    try {
      const qrData = JSON.parse(data);
      if (qrData.mobile && typeof qrData.mobile === 'string') {
        form.setValue('recipient', qrData.mobile, { shouldValidate: true });
        recipientFilled = true;
      }
      if (qrData.amount && typeof qrData.amount === 'number') {
        form.setValue('amount', qrData.amount, { shouldValidate: true });
        amountFilled = true;
      }
    } catch (error) {
      // Not a JSON object, treat as plain text
      form.setValue('recipient', data, { shouldValidate: true });
      recipientFilled = true;
    }

    setIsScannerOpen(false);

    if (recipientFilled && amountFilled) {
      toast({
        title: 'QR Code Scanned',
        description: `Recipient and amount have been filled in.`,
      });
    } else if (recipientFilled) {
       toast({
        title: 'QR Code Scanned',
        description: `Recipient's number has been filled in.`,
      });
    } else {
       toast({
        variant: 'destructive',
        title: 'Invalid QR Code',
        description: 'The scanned QR code does not contain valid recipient information.',
      });
    }
  };
  
  return (
    <>
      <div className="max-w-xl mx-auto">
        <Card>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle>Send Money</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="recipient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient's Mobile Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+63 9XX XXX XXXX" {...field} />
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
                        <Input placeholder="e.g., For dinner" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex-col sm:flex-row gap-2">
                <Button type="submit" className="w-full sm:w-auto" disabled={!form.formState.isValid}>
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Send Now
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
            <AlertDialogTitle>Confirm Transfer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to send{' '}
              <span className="font-bold font-mono text-foreground">{formattedAmount}</span> to{' '}
              <span className="font-bold text-foreground">{form.watch('recipient')}</span>? This action cannot be undone.
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
              For your security, please enter the 6-digit code sent to your mobile number to complete the transfer.
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
              {isLoading ? 'Verifying...' : 'Verify & Send'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <QrScannerDialog open={isScannerOpen} onOpenChange={setIsScannerOpen} onScanSuccess={handleScanSuccess} />
    </>
  );
}
