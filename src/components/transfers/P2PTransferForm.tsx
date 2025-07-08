'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import {
import { Loader2 } from 'lucide-react';

const p2pTransferSchema = z.object({
  recipientMobileNumber: z.string().min(1, 'Recipient mobile number is required.').regex(/^(09|\+639)\d{9}$/, 'Invalid recipient mobile number.'),
  amount: z.preprocess(
    (val) => Number(val),
    z.number().positive('Amount must be positive.')
  ),
});

type P2PTransferFormValues = z.infer<typeof p2pTransferSchema>;

const otpSchema = z.object({
  otp: z.string().min(6, 'OTP must be 6 digits.').max(6, 'OTP must be 6 digits.'),
});

type OTPFormValues = z.infer<typeof otpSchema>;

const functions = getFunctions();
const initiateP2PTransferFn = httpsCallable<
  P2PTransferFormValues,
  { status: string; message: string }
>(functions, 'initiateP2PTransfer');
const confirmFundTransferWithOtpFn = httpsCallable<
  P2PTransferFormValues & OTPFormValues,
  { status: string; message: string }
>(functions, 'confirmFundTransferWithOtp');

export function P2PTransferForm() {
  const { toast } = useToast();
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [transferDetails, setTransferDetails] = useState<P2PTransferFormValues | null>(null);

  const initialForm = useForm<P2PTransferFormValues>({
    resolver: zodResolver(p2pTransferSchema),
    defaultValues: {
      recipientMobileNumber: '',
      amount: 0,
    },
  });
  
  const otpForm = useForm<OTPFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  const { mutate: initiateTransfer, isLoading } = useMutation({
    mutationFn: (data: P2PTransferFormValues) => initiateP2PTransferFn(data),
    onSuccess: (data) => {
      if (data.status === 'otp_sent') {
        setTransferDetails(initialForm.getValues());
        setShowOtpForm(true);
        toast({
          title: 'OTP Sent',
          description: 'Please enter the OTP sent to your mobile number.',
        });
      } else {
      toast({
        title: 'Transfer Successful',
        description: data.message,
      });
      form.reset(); // Clear the form on success
    },
    onError: (error: any) => {
      setShowOtpForm(false);
      console.error('P2P Transfer Error:', error);
      toast({
        title: 'Transfer Failed',
        description: error.message || 'An error occurred during the transfer.',
        variant: 'destructive',
      });
    },
  });

  const { mutate: confirmTransfer, isLoading: isConfirming } = useMutation({
    mutationFn: (data: OTPFormValues) => confirmFundTransferWithOtpFn({ ...transferDetails!, ...data }),
    onSuccess: (data) => {
      toast({
        title: 'Transfer Confirmed',
        description: data.message,
      });
      setShowOtpForm(false);
      setTransferDetails(null);
      initialForm.reset();
      otpForm.reset();
    },
    onError: (error: any) => {
      console.error('OTP Confirmation Error:', error);
      toast({
        title: 'Confirmation Failed',
        description: error.message || 'An error occurred during OTP verification.',
        variant: 'destructive',
      });
    },
  });

  const onInitiateSubmit = (values: P2PTransferFormValues) => {
    initiateTransfer(values);
  };

  const onConfirmSubmit = (values: OTPFormValues) => {
    confirmTransfer(values);
  };

  return (
    <Form {...(showOtpForm ? otpForm : initialForm)}>
      {!showOtpForm ? (
        <form onSubmit={initialForm.handleSubmit(onInitiateSubmit)} className="space-y-4">
          <FormField
            control={initialForm.control}
            name="recipientMobileNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipient Mobile Number</FormLabel>
                <FormControl>
                  <Input placeholder="+639XXXXXXXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={initialForm.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (PHP)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading || !initialForm.formState.isValid}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Funds
          </Button>
        </form>
      ) : (
        <form onSubmit={otpForm.handleSubmit(onConfirmSubmit)} className="space-y-4">
          {/* OTP Input Section - Implement this based on your UI needs */}
          {/* Example: */}
          <FormField
            control={otpForm.control}
            name="otp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enter OTP</FormLabel>
                <FormControl>
                  <Input placeholder="Enter 6-digit OTP" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isConfirming || !otpForm.formState.isValid}>
            {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Transfer
          </Button>
        </form>
      )}
    </Form>
  );
}