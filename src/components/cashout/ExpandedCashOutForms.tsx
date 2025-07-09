'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useMutation } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast'; // Assuming you have a toast hook

const functions = getFunctions();
const initiateCashOutFn = httpsCallable(functions, 'initiateCashOut'); // Assuming this function exists and is modified

// --- Schemas for different cash-out methods ---

const payoutOutletSchema = z.object({
  amount: z.preprocess(
    (val) => Number(val),
    z.number().positive('Amount must be positive.')
  ),
  outletDetails: z.string().min(1, 'Outlet details are required.'),
});

const cryptocurrencySchema = z.object({
  amount: z.preprocess(
    (val) => Number(val),
    z.number().positive('Amount must be positive.')
  ),
  cryptoType: z.enum(['C-CASH', 'USDT'], {
    errorMap: () => ({ message: 'Please select a valid cryptocurrency.' }),
  }),
  cryptoAddress: z.string().min(1, 'Cryptocurrency address is required.'),
});

// --- Component ---

type CashOutMethod = 'payout-outlet' | 'cryptocurrency';

export function ExpandedCashOutForms() {
  const [selectedMethod, setSelectedMethod] = useState<CashOutMethod>('payout-outlet');
  const { toast } = useToast();

  const payoutForm = useForm<z.infer<typeof payoutOutletSchema>>({
    resolver: zodResolver(payoutOutletSchema),
    defaultValues: { amount: 0, outletDetails: '' },
  });

  const cryptoForm = useForm<z.infer<typeof cryptocurrencySchema>>({
    resolver: zodResolver(cryptocurrencySchema),
    defaultValues: { amount: 0, cryptoType: 'USDT', cryptoAddress: '' },
  });

  const { mutate: initiateCashOut, isLoading } = useMutation({
    mutationFn: (data: any) => initiateCashOutFn(data),
    onSuccess: () => {
      toast({
        title: 'Cash Out Initiated',
        description: `Your cash-out request via ${selectedMethod} has been submitted.`,
      });
      if (selectedMethod === 'payout-outlet') {
        payoutForm.reset();
      } else {
        cryptoForm.reset();
      }
    },
    onError: (error: any) => {
      console.error('Cash Out Error:', error);
      toast({
        title: 'Cash Out Failed',
        description: error.message || 'An error occurred during cash out.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmitPayout = (values: z.infer<typeof payoutOutletSchema>) => {
    initiateCashOut({ ...values, destinationMethod: 'payout-outlet' });
  };

  const handleSubmitCrypto = (values: z.infer<typeof cryptocurrencySchema>) => {
    initiateCashOut({ ...values, destinationMethod: 'cryptocurrency' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expanded Cash Out</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="cash-out-method">Select Method</Label>
          <Select value={selectedMethod} onValueChange={(value: CashOutMethod) => setSelectedMethod(value)}>
            <SelectTrigger id="cash-out-method">
              <SelectValue placeholder="Select a cash-out method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="payout-outlet">Payout Outlet</SelectItem>
              <SelectItem value="cryptocurrency">Cryptocurrency (C-CASH, USDT)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedMethod === 'payout-outlet' && (
          <Form {...payoutForm}>
            <form onSubmit={payoutForm.handleSubmit(handleSubmitPayout)} className="space-y-4">
              <FormField
                control={payoutForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (PHP)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter amount" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={payoutForm.control}
                name="outletDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outlet Details</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Branch name, Reference number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Processing...' : 'Initiate Payout'}
              </Button>
            </form>
          </Form>
        )}

        {selectedMethod === 'cryptocurrency' && (
          <Form {...cryptoForm}>
            <form onSubmit={cryptoForm.handleSubmit(handleSubmitCrypto)} className="space-y-4">
              <FormField
                control={cryptoForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter amount" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={cryptoForm.control}
                name="cryptoType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cryptocurrency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="C-CASH">C-CASH</SelectItem>
                        <SelectItem value="USDT">USDT</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={cryptoForm.control}
                name="cryptoAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter crypto address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Processing...' : 'Initiate Crypto Cash Out'}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}