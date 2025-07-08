// File: src/components/transfers/PesoNETTransferForm.tsx

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { useMutation } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast'; // Assuming you have a toast hook

// Define the schema for PesoNET transfer form
const pesoNETTransferSchema = z.object({
  recipientBank: z.string().min(1, 'Recipient bank is required.'),
  accountNumber: z.string().min(1, 'Account number is required.'),
  amount: z.preprocess(
    (val) => Number(val),
    z.number().positive('Amount must be positive.')
  ),
  // Add other PesoNET specific fields if needed
});

type PesoNETTransferFormValues = z.infer<typeof pesoNETTransferSchema>;

// Get a reference to the Cloud Function
const functions = getFunctions();
const initiatePesoNETTransferFn = httpsCallable<
  PesoNETTransferFormValues,
  { status: string; message?: string } // Adjust return type based on your Cloud Function
>(functions, 'initiatePesoNETTransfer');

export function PesoNETTransferForm() {
  const { toast } = useToast(); // Assuming you have a toast hook

  const form = useForm<PesoNETTransferFormValues>({
    resolver: zodResolver(pesoNETTransferSchema),
    defaultValues: {
      recipientBank: '',
      accountNumber: '',
      amount: 0,
    },
  });

  const { mutate: initiateTransfer, isLoading } = useMutation({
    mutationFn: (data: PesoNETTransferFormValues) => initiatePesoNETTransferFn(data),
    onSuccess: (data) => {
      toast({
        title: 'Transfer Initiated',
        description: data.message || 'Your PesoNET transfer is being processed.',
        variant: 'default',
      });
      form.reset(); // Clear the form on success
    },
    onError: (error: any) => {
      toast({
        title: 'Transfer Failed',
        description: error.message || 'An error occurred during the PesoNET transfer.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: PesoNETTransferFormValues) => {
    initiateTransfer(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="recipientBank"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recipient Bank</FormLabel>
              <FormControl>
                <Input placeholder="e.g., BDO, BPI" {...field} />
              </FormControl>
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
                <Input placeholder="Recipient's account number" {...field} />
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
                <Input type="number" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Add other PesoNET specific form fields here */}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Initiate PesoNET Transfer
        </Button>
      </form>
    </Form>
  );
}