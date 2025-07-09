// File: src/components/payments/ELoadForm.tsx

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { useMutation } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { toast } from '@/components/ui/use-toast'; // Assuming you have a toast component

const eLoadSchema = z.object({
  mobileNumber: z.string().min(1, 'Mobile number is required.').regex(/^(09|\+639)\d{9}$/, 'Please enter a valid PH mobile number.'),
  amount: z.preprocess(
    (val) => Number(val),
    z.number().positive('Amount must be positive.')
  ),
});

type ELoadFormValues = z.infer<typeof eLoadSchema>;

// Get a reference to the Cloud Function
const functions = getFunctions();
const processELoadFn = httpsCallable<ELoadFormValues, { status: string; message: string }>(
  functions,
  'processELoad'
);

export function ELoadForm() {
  const form = useForm<ELoadFormValues>({
    resolver: zodResolver(eLoadSchema),
    defaultValues: {
      mobileNumber: '',
      amount: 0,
    },
  });

  const { mutate: processELoad, isLoading } = useMutation({
    mutationFn: (data: ELoadFormValues) => processELoadFn(data),
    onSuccess: (response) => {
      toast({
        title: 'eLoad Successful',
        description: response.data.message || 'eLoad processed successfully.',
      });
      form.reset(); // Clear the form on success
    },
    onError: (error: any) => {
      toast({
        title: 'eLoad Failed',
        description: error.message || 'An error occurred while processing eLoad.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: ELoadFormValues) => {
    processELoad(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="mobileNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 09xxxxxxxxx" {...field} />
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
                <Input type="number" placeholder="e.g., 100" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Process eLoad'}
        </Button>
      </form>
    </Form>
  );
}