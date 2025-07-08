// File: src/components/cashout/CashOutForm.tsx
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Define the schema for the cash-out form
const cashOutSchema = z.object({
  amount: z.preprocess(
    (val) => Number(val),
    z.number().positive("Amount must be positive.")
  ),
  destinationMethod: z.enum(['eWallet', 'Bank'], {
    errorMap: () => ({ message: "Please select a destination method." }),
  }),
  accountNumber: z.string().min(1, "Account number is required."), // Add other relevant details validation
});

type CashOutFormValues = z.infer<typeof cashOutSchema>;

// Get a reference to the Cloud Function
const functions = getFunctions();
const initiateCashOutFn = httpsCallable<CashOutFormValues, any>(functions, 'initiateCashOut');

export function CashOutForm() {
  const { toast } = useToast();

  const form = useForm<CashOutFormValues>({
    resolver: zodResolver(cashOutSchema),
    defaultValues: {
      amount: 0,
      destinationMethod: 'eWallet', // Default value
      accountNumber: '',
    },
  });

  const { handleSubmit, formState: { errors }, reset } = form;

  // Use useMutation hook for calling the Cloud Function
  const { mutate, isLoading, error } = useMutation({
    mutationFn: initiateCashOutFn,
    onSuccess: () => {
      toast({
        title: "Cash Out Initiated",
        description: "Your cash out request is being processed.",
      });
      reset(); // Clear the form on success
    },
    onError: (err: any) => {
      console.error("Cash Out Error:", err);
      toast({
        title: "Cash Out Failed",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: CashOutFormValues) => {
    mutate(values);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Cash Out</CardTitle>
        <CardDescription>Transfer funds from your CPay wallet to an eWallet or Bank account.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (PHP)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} onChange={event => field.onChange(+event.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="destinationMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="eWallet">eWallet</SelectItem>
                      <SelectItem value="Bank">Bank Account</SelectItem>
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
                  <FormLabel>{form.watch('destinationMethod') === 'Bank' ? 'Bank Account Number' : 'eWallet Account Number'}</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter account number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Add more fields here for specific destination details if needed */}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Initiate Cash Out
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}