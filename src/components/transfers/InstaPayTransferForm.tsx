'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Define the schema for the InstaPay transfer form
const formSchema = z.object({
  recipientBank: z.string().min(1, 'Recipient bank is required.'),
  accountNumber: z.string().min(1, 'Account number is required.'),
  amount: z.preprocess(
    (val) => Number(val),
    z.number().positive('Amount must be positive.')
  ),
});

type InstaPayTransferFormValues = z.infer<typeof formSchema>;

// Get a reference to the Cloud Function
const functions = getFunctions();
const initiateInstaPayTransferFn = httpsCallable<
  InstaPayTransferFormValues,
  { status: string; message?: string } // Adjust return type based on your function
>(functions, 'initiateInstaPayTransfer');

export function InstaPayTransferForm() {
  const { toast } = useToast();

  const form = useForm<InstaPayTransferFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientBank: '',
      accountNumber: '',
      amount: 0,
    },
  });

  const { mutate, isLoading } = useMutation({
    mutationFn: async (values: InstaPayTransferFormValues) => {
      const result = await initiateInstaPayTransferFn(values);
      return result.data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Transfer Initiated',
        description: data.message || 'InstaPay transfer initiated successfully.',
      });
      form.reset(); // Clear the form on success
    },
    onError: (error: any) => {
      toast({
        title: 'Transfer Failed',
        description: error.message || 'An error occurred during the transfer.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: InstaPayTransferFormValues) => {
    mutate(values);
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
                <Input placeholder="Recipient account number" {...field} />
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
                <Input type="number" placeholder="e.g., 1000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Initiate InstaPay Transfer
        </Button>
      </form>
    </Form>
  );
}