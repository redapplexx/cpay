'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { eLoad } from '@/ai/flows/e-load-flow';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { Loader2, Signal } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const eLoadSchema = z.object({
  mobileNumber: z.string()
    .min(1, 'Mobile number is required.')
    .regex(/^(09|\+639)\d{9}$/, 'Please enter a valid PH mobile number.'),
  amount: z.coerce.number().min(1, 'Please select a load amount.'),
});

type ELoadFormData = z.infer<typeof eLoadSchema>;

const loadAmounts = [
    { value: 50, label: 'PHP 50' },
    { value: 100, label: 'PHP 100' },
    { value: 200, label: 'PHP 200' },
    { value: 300, label: 'PHP 300' },
    { value: 500, label: 'PHP 500' },
];

export default function ELoadPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<ELoadFormData>({
    resolver: zodResolver(eLoadSchema),
    defaultValues: {
      mobileNumber: '',
      amount: undefined,
    },
  });

  const onSubmit = async (values: ELoadFormData) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Not Authenticated' });
        return;
    }
    setIsProcessing(true);
    try {
      const result = await eLoad({
        userId: user.uid,
        mobileNumber: values.mobileNumber,
        amount: values.amount,
      });

      toast({
        title: 'E-Load Successful',
        description: result.message,
      });
      form.reset();
    } catch (error) {
      console.error('E-Load failed:', error);
      toast({
        variant: 'destructive',
        title: 'E-Load Failed',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
            <CardTitle>Buy E-Load</CardTitle>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="pt-0 space-y-4">
              <FormField
                control={form.control}
                name="mobileNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 09171234567" {...field} />
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
                    <FormLabel>Load Amount</FormLabel>
                    <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an amount" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadAmounts.map(item => (
                          <SelectItem key={item.value} value={String(item.value)}>{item.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isProcessing} className="w-full sm:w-auto">
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isProcessing ? 'Processing...' : 'Buy Load'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
