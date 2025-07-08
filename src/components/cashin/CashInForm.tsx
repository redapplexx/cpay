// File: src/components/cashin/CashInForm.tsx

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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const cashInSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive.'),
  sourceMethod: z.enum(['eWallet', 'Bank'], {
    required_error: 'Please select a source method.',
  }),
  // Add more fields based on sourceMethod if needed (e.g., bankName, eWalletProvider)
});

type CashInFormValues = z.infer<typeof cashInSchema>;

// Get a reference to the Cloud Function
const functions = getFunctions();
const initiateCashInFn = httpsCallable<
  CashInFormValues,
  { status: string; message?: string }
>(functions, 'initiateCashIn');

export function CashInForm() {
  const { toast } = useToast();

  const form = useForm<CashInFormValues>({
    resolver: zodResolver(cashInSchema),
    defaultValues: {
      amount: 0,
      sourceMethod: undefined, // Let zod handle the required_error
    },
  });

  const { mutate, isLoading } = useMutation({
    mutationFn: (data: CashInFormValues) => initiateCashInFn(data),
    onSuccess: (data) => {
      form.reset(); // Clear form on success
      toast({
        title: 'Cash-In Initiated',
        description:
          data.message ||
          'Please complete the transaction using your selected method.',
      });
    },
    onError: (error: any) => {
      console.error('Cash-In Error:', error);
      toast({
        title: 'Cash-In Failed',
        description: error.message || 'An error occurred during cash-in.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: CashInFormValues) => {
    mutate(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash-In</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (PHP)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sourceMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="eWallet">eWallet</SelectItem>
                      <SelectItem value="Bank">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Add conditional fields here based on selected sourceMethod if necessary */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Initiate Cash-In
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}