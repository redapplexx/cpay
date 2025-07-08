'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { payBill } from '@/ai/flows/pay-bill-flow';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const payBillSchema = z.object({
  category: z.string().min(1, 'Please select a category.'),
  biller: z.string().min(1, 'Please select a biller.'),
  accountNumber: z.string().min(1, 'Account number is required.'),
  amount: z.coerce
    .number({ invalid_type_error: 'Please enter a valid amount.' })
    .min(1, 'Amount must be at least PHP 1.00.'),
});

type PayBillFormData = z.infer<typeof payBillSchema>;

const billerData = {
  'Utilities': [
    { value: 'meralco', label: 'Meralco' },
    { value: 'manila_water', label: 'Manila Water' },
    { value: 'maynilad', label: 'Maynilad Water Services' },
  ],
  'Telecom': [
    { value: 'pldt', label: 'PLDT' },
    { value: 'globe_postpaid', label: 'Globe Postpaid' },
    { value: 'converge', label: 'Converge ICT' },
  ],
  'Credit Card': [
    { value: 'bpi_card', label: 'BPI Credit Card' },
    { value: 'bdo_card', label: 'BDO Credit Card' },
    { value: 'citibank_card', label: 'Citibank Credit Card' },
  ],
  'Government': [
    { value: 'sss', label: 'SSS Contribution' },
    { value: 'pagibig', label: 'Pag-IBIG Fund' },
  ],
};

export default function PayBillsPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<PayBillFormData>({
    resolver: zodResolver(payBillSchema),
    defaultValues: {
      category: '',
      biller: '',
      accountNumber: '',
      amount: undefined,
    },
  });

  const selectedCategory = form.watch('category');
  
  useEffect(() => {
      form.setValue('biller', '');
  }, [selectedCategory, form]);

  const onSubmit = async (values: PayBillFormData) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Not Authenticated' });
        return;
    }
    setIsProcessing(true);
    try {
      const selectedBiller = billerData[values.category as keyof typeof billerData]?.find(b => b.value === values.biller);
      const result = await payBill({
        userId: user.uid,
        biller: selectedBiller?.label || values.biller,
        accountNumber: values.accountNumber,
        amount: values.amount,
      });

      toast({
        title: 'Payment Successful',
        description: result.message,
      });
      form.reset();
    } catch (error) {
      console.error('Bills payment failed:', error);
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Pay Bills</CardTitle>
              <CardDescription>
                Settle your bills quickly and conveniently.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biller Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.keys(billerData).map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="biller"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biller</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategory}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a biller" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedCategory && billerData[selectedCategory as keyof typeof billerData]?.map(biller => (
                          <SelectItem key={biller.value} value={biller.value}>{biller.label}</SelectItem>
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
                    <FormLabel>Account / Reference Number</FormLabel>
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
                      <Input type="number" placeholder="0.00" {...field} onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isProcessing} className="w-full sm:w-auto">
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isProcessing ? 'Processing...' : 'Pay Now'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
