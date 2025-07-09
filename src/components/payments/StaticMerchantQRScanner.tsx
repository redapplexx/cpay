'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Assume QR code data structure (example)
interface StaticMerchantQRData {
  merchantId: string;
  // Optional: amount if embedded in QR
  // amount?: number;
}

const formSchema = z.object({
  qrCodeData: z.string().min(1, 'QR Code data is required.'), // Simulated scanned data
  amount: z.preprocess(
    (val) => Number(val),
    z.number().positive('Amount must be positive.')
  ),
});

type FormValues = z.infer<typeof formSchema>;

const functions = getFunctions();
const processStaticMerchantQR = httpsCallable<FormValues, any>(functions, 'processStaticMerchantQR Payment');

export function StaticMerchantQRScanner() {
  const [scannedData, setScannedData] = useState<StaticMerchantQRData | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      qrCodeData: '', // Will be populated on simulated scan
      amount: 0,
    },
    disabled: !scannedData, // Disable form until scanned
  });

  const { handleSubmit, control, reset, formState: { isSubmitting, isValid } } = form;

  const mutation = useMutation({
    mutationFn: processStaticMerchantQR,
    onSuccess: (data) => {
      toast({
        title: 'Payment Successful',
        description: 'Your payment to the merchant was successful.', // Customize based on backend response
      });
      reset();
      setScannedData(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Payment Failed',
        description: error.message || 'An error occurred during payment.',
        variant: 'destructive',
      });
    },
  });

  const handleSimulateScan = () => {
    // Simulate scanning a QR code and extracting data
    const mockQRData: StaticMerchantQRData = {
      merchantId: 'merchant123', // Example Merchant ID
      // amount: 100, // Uncomment if amount is embedded in QR
    };
    setScannedData(mockQRData);
    form.setValue('qrCodeData', JSON.stringify(mockQRData)); // Set mock data in hidden field
    // If amount is embedded, set it here:
    // if (mockQRData.amount) {
    //   form.setValue('amount', mockQRData.amount);
    // }
    toast({
      title: 'QR Code Scanned',
      description: `Merchant ID: ${mockQRData.merchantId}. Please enter amount to pay.`,
    });
  };

  const onSubmit = (values: FormValues) => {
    // We only need merchantId and amount for the backend call
    const payload = {
        qrCodeData: values.qrCodeData, // Pass the original scanned data
        amount: values.amount,
    };
    mutation.mutate(payload);
  };

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Pay Merchant QR</CardTitle>
      </CardHeader>
      <CardContent>
        {!scannedData ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <p className="text-center text-muted-foreground">Tap below to simulate scanning a static merchant QR code.</p>
            <Button onClick={handleSimulateScan}>
              Simulate Scan QR
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                 <Label>Scanned Merchant ID</Label>
                 <Input value={scannedData.merchantId} readOnly disabled />
                 {/* Hidden field to pass scanned data */}
                 <FormField
                    control={control}
                    name="qrCodeData"
                    render={({ field }) => (
                      <FormItem className="hidden">
                         <FormControl>
                           <Input {...field} />
                         </FormControl>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              <FormField
                control={control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount to Pay</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        {...field}
                        onChange={(e) => {
                           // Prevent input of non-numeric values and negative numbers
                           const value = parseFloat(e.target.value);
                           if (!isNaN(value) && value >= 0) {
                             field.onChange(value);
                           } else if (e.target.value === '') {
                              field.onChange(0); // Allow clearing the input
                           }
                        }}
                        disabled={mutation.isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={mutation.isLoading || !isValid}>
                {mutation.isLoading && <Loader2 className="animate-spin mr-2" />}
                Pay Merchant
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}