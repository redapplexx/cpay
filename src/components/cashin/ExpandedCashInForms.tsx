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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const functions = getFunctions();
const initiateCashInFn = httpsCallable<{
  amount: number;
  sourceMethod: string;
  details?: any; // Use a more specific type based on method
}, { status: string; message?: string }>(functions, 'initiateCashIn');

const payoutOutletSchema = z.object({
  amount: z.preprocess(
    (a) => parseFloat(a as string),
    z.number().positive('Amount must be positive.')
  ),
  outletName: z.string().min(1, 'Payout outlet name is required.'),
  referenceCode: z.string().min(1, 'Reference code is required.'),
});

const voucherSchema = z.object({
  amount: z.preprocess(
    (a) => parseFloat(a as string),
    z.number().positive('Amount must be positive.')
  ),
  voucherCode: z.string().min(1, 'Voucher code is required.'),
});

const cryptocurrencySchema = z.object({
  amount: z.preprocess(
    (a) => parseFloat(a as string),
    z.number().positive('Amount must be positive.')
  ),
  cryptoType: z.enum(['C-CASH', 'USDT'], {
    required_error: 'Cryptocurrency type is required.',
  }),
  cryptoAddress: z.string().min(1, 'Cryptocurrency address is required.'),
});

type PayoutOutletForm = z.infer<typeof payoutOutletSchema>;
type VoucherForm = z.infer<typeof voucherSchema>;
type CryptocurrencyForm = z.infer<typeof cryptocurrencySchema>;

export function ExpandedCashInForms() {
  const [activeTab, setActiveTab] = useState('payout-outlet');
  const { toast } = useToast();

  const payoutOutletForm = useForm<PayoutOutletForm>({
    resolver: zodResolver(payoutOutletSchema),
    defaultValues: { amount: 0, outletName: '', referenceCode: '' },
  });

  const voucherForm = useForm<VoucherForm>({
    resolver: zodResolver(voucherSchema),
    defaultValues: { amount: 0, voucherCode: '' },
  });

  const cryptocurrencyForm = useForm<CryptocurrencyForm>({
    resolver: zodResolver(cryptocurrencySchema),
    defaultValues: { amount: 0, cryptoType: 'C-CASH', cryptoAddress: '' },
  });

  const cashInMutation = useMutation({
    mutationFn: (data: {
      amount: number;
      sourceMethod: string;
      details?: any;
    }) => initiateCashInFn(data),
    onSuccess: (response) => {
      toast({
        title: 'Cash-In Initiated',
        description: response.data.message || 'Cash-in process started successfully.',
      });
      // Reset relevant form
      if (activeTab === 'payout-outlet') payoutOutletForm.reset();
      if (activeTab === 'voucher') voucherForm.reset();
      if (activeTab === 'cryptocurrency') cryptocurrencyForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Cash-In Failed',
        description: error.message || 'An error occurred during cash-in.',
        variant: 'destructive',
      });
    },
  });

  const handlePayoutOutletSubmit = (values: PayoutOutletForm) => {
    cashInMutation.mutate({
      amount: values.amount,
      sourceMethod: 'payout-outlet',
      details: {
        outletName: values.outletName,
        referenceCode: values.referenceCode,
      },
    });
  };

  const handleVoucherSubmit = (values: VoucherForm) => {
    cashInMutation.mutate({
      amount: values.amount,
      sourceMethod: 'voucher',
      details: {
        voucherCode: values.voucherCode,
      },
    });
  };

  const handleCryptocurrencySubmit = (values: CryptocurrencyForm) => {
    cashInMutation.mutate({
      amount: values.amount,
      sourceMethod: 'cryptocurrency',
      details: {
        cryptoType: values.cryptoType,
        cryptoAddress: values.cryptoAddress,
      },
    });
  };

  const isSubmitting = cashInMutation.isLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expanded Cash-In Options</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payout-outlet">Payout Outlet</TabsTrigger>
            <TabsTrigger value="voucher">Voucher</TabsTrigger>
            <TabsTrigger value="cryptocurrency">Cryptocurrency</TabsTrigger>
          </TabsList>
          <TabsContent value="payout-outlet" className="mt-4">
            <Form {...payoutOutletForm}>
              <form
                onSubmit={payoutOutletForm.handleSubmit(handlePayoutOutletSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={payoutOutletForm.control}
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
                  control={payoutOutletForm.control}
                  name="outletName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payout Outlet Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 7-Eleven, Palawan Express" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={payoutOutletForm.control}
                  name="referenceCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter reference code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Initiate Cash-In via Outlet
                </Button>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="voucher" className="mt-4">
            <Form {...voucherForm}>
              <form onSubmit={voucherForm.handleSubmit(handleVoucherSubmit)} className="space-y-4">
                <FormField
                  control={voucherForm.control}
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
                  control={voucherForm.control}
                  name="voucherCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voucher Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter voucher code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Redeem Voucher
                </Button>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="cryptocurrency" className="mt-4">
            <Form {...cryptocurrencyForm}>
              <form
                onSubmit={cryptocurrencyForm.handleSubmit(handleCryptocurrencySubmit)}
                className="space-y-4"
              >
                <FormField
                  control={cryptocurrencyForm.control}
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
                  control={cryptocurrencyForm.control}
                  name="cryptoType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cryptocurrency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency type" />
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
                  control={cryptocurrencyForm.control}
                  name="cryptoAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deposit Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter deposit address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Initiate Crypto Cash-In
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}