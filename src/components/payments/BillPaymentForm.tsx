'use client';

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Define the shape of the form data
const billPaymentSchema = z.object({
  biller: z.string().min(1, 'Please select a biller.'),
  accountNumber: z.string().min(1, 'Account number is required.'),
  amount: z.preprocess(
    (a) => parseFloat(z.string().refine((s) => !isNaN(parseFloat(s))).parse(a)),
    z.number().positive('Amount must be positive.')
  ),
});

type BillPaymentFormValues = z.infer<typeof billPaymentSchema>;

// Get a reference to the Cloud Function
const functions = getFunctions();
const processBillPaymentFn = httpsCallable<
  BillPaymentFormValues,
  { status: string; message: string }
>(functions, 'processBillPayment');

// Mock biller list for the select input
const mockBillers = [
  { value: 'meralco', label: 'Meralco' },
  { value: 'maynilad', label: 'Maynilad' },
  { value: 'globe', label: 'Globe Postpaid' },
  { value: 'pldt', label: 'PLDT' },
];

export function BillPaymentForm() {
  const { toast } = useToast();

  const form = useForm<BillPaymentFormValues>({
    resolver: zodResolver(billPaymentSchema),
    defaultValues: {
      biller: '',
      accountNumber: '',
      amount: 0,
    },
  });

  const { mutate: processPayment, isLoading } = useMutation({
    mutationFn: processBillPaymentFn,
    onSuccess: (data) => {
      toast({
        title: 'Payment Successful',
        description: data.message,
      });
      form.reset(); // Clear the form on success
    },
    onError: (error: any) => {
      toast({
        title: 'Payment Failed',
        description: error.message || 'An error occurred during payment processing.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: BillPaymentFormValues) => {
    // Call the backend function with form values
    processPayment(values);
  };

  return (
    <Card> {/* Assuming you have a Card component for structure */}
      <CardHeader>
        <CardTitle>Pay Bills</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="biller"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biller</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a biller" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mockBillers.map((biller) => (
                        <SelectItem key={biller.value} value={biller.value}>
                          {biller.label}
                        </SelectItem>
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
                  <FormLabel>Account Number / Reference Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter account or reference number" {...field} />
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
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value)} // react-hook-form needs string for number input
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Process Payment
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Add Card import if not already available in your setup
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';