'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define Zod schemas for different payment methods
const basePaymentSchema = z.object({
    amount: z.number().positive("Amount must be positive"),
    currency: z.string().min(1, "Currency is required"), // Assuming currency selection or fixed
});

const cardPaymentSchema = basePaymentSchema.extend({
    paymentMethodType: z.literal('card'),
    cardNumber: z.string().regex(/^\d{13,19}$/, "Invalid card number"),
    expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Invalid expiry date (MM/YY)"),
    cvc: z.string().regex(/^\d{3,4}$/, "Invalid CVC"),
    cardholderName: z.string().min(1, "Cardholder name is required"),
});

const bankPaymentSchema = basePaymentSchema.extend({
    paymentMethodType: z.literal('online-banking'),
    bankName: z.string().min(1, "Bank name is required"),
    accountNumber: z.string().min(1, "Account number is required"),
    // Add more bank-specific fields as needed
});

const ewalletPaymentSchema = basePaymentSchema.extend({
    paymentMethodType: z.literal('ewallet'),
    ewalletProvider: z.string().min(1, "eWallet provider is required"),
    ewalletIdentifier: z.string().min(1, "eWallet identifier (e.g., phone number) is required"),
    // Add more eWallet-specific fields as needed
});

const qrphPaymentSchema = basePaymentSchema.extend({
     paymentMethodType: z.literal('qrph-p2m'),
     qrphIdentifier: z.string().min(1, "QRPh identifier is required"),
});


// Union of all schema types for form validation
const paymentFormSchema = z.discriminatedUnion("paymentMethodType", [
    cardPaymentSchema,
    bankPaymentSchema,
    ewalletPaymentSchema,
    qrphPaymentSchema,
]);

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

const functions = getFunctions();
const initiateOnlinePaymentFn = httpsCallable<PaymentFormValues, any>(functions, 'initiateOnlinePayment');

export function OnlinePaymentForm() {
    const [selectedMethod, setSelectedMethod] = useState<PaymentFormValues['paymentMethodType'] | ''>('');
    const { toast } = useToast();

    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentFormSchema),
        defaultValues: {
             // Default values based on a common payment method or empty
        },
        mode: 'onChange', // Validate on change to enable/disable button
    });

     // Reset form when method changes, but keep amount/currency if possible
    const handleMethodChange = (method: PaymentFormValues['paymentMethodType']) => {
        const currentAmount = form.getValues('amount');
        const currentCurrency = form.getValues('currency');
        form.reset({
            amount: currentAmount,
            currency: currentCurrency,
            paymentMethodType: method,
            // Reset method-specific fields
            cardNumber: '', expiryDate: '', cvc: '', cardholderName: '', // card
            bankName: '', accountNumber: '', // bank
            ewalletProvider: '', ewalletIdentifier: '', // ewallet
            qrphIdentifier: '', // qrph
        } as any); // Use 'as any' due to discriminated union complexity in reset
        setSelectedMethod(method);
    };


    const mutation = useMutation({
        mutationFn: (data: PaymentFormValues) => initiateOnlinePaymentFn(data),
        onSuccess: (result) => {
            // Handle success, potentially involving redirects or showing instructions
            toast({
                title: 'Payment Initiated',
                description: result.data.message || 'Please complete the payment process.',
                variant: 'default',
            });
             form.reset(); // Clear form on success
             setSelectedMethod(''); // Reset method selection
            // If the result includes a redirect URL, navigate the user:
            // if (result.data.redirectUrl) {
            //     window.location.href = result.data.redirectUrl;
            // }
        },
        onError: (error: any) => {
            // Handle errors and display feedback
            toast({
                title: 'Payment Failed',
                description: error.message || 'An error occurred during payment initiation.',
                variant: 'destructive',
            });
        },
    });

    const onSubmit = (values: PaymentFormValues) => {
        mutation.mutate(values);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Initiate Online Payment</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                         <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="Enter amount"
                                            {...field}
                                             onChange={(e) => {
                                                const value = parseFloat(e.target.value);
                                                field.onChange(isNaN(value) ? '' : value);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Currency</FormLabel>
                                    <FormControl>
                                         <Input placeholder="e.g., PHP" {...field} />
                                         {/* Or use a Select for predefined currencies */}
                                         {/* <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select currency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PHP">PHP</SelectItem>
                                                <SelectItem value="KRW">KRW</SelectItem>
                                                <SelectItem value="USD">USD</SelectItem>
                                            </SelectContent>
                                        </Select> */}
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />


                        <FormItem>
                            <FormLabel>Payment Method</FormLabel>
                            <Select onValueChange={handleMethodChange} value={selectedMethod}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="qrph-p2m">QRPh P2M</SelectItem>
                                    <SelectItem value="ewallet">Direct eWallet</SelectItem>
                                    <SelectItem value="online-banking">Online Banking</SelectItem>
                                    <SelectItem value="card">Debit/Credit Card</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>

                        {/* Conditional Rendering based on selectedMethod */}
                        {selectedMethod === 'card' && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="cardNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Card Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter card number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="expiryDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Expiry Date (MM/YY)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="MM/YY" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="cvc"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>CVC</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="CVC" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="cardholderName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cardholder Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter name on card" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                         {selectedMethod === 'online-banking' && (
                             <>
                                 <FormField
                                     control={form.control}
                                     name="bankName"
                                     render={({ field }) => (
                                         <FormItem>
                                             <FormLabel>Bank Name</FormLabel>
                                             <FormControl>
                                                 <Input placeholder="Enter bank name" {...field} />
                                                 {/* Or a Select for common banks */}
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
                                                 <Input placeholder="Enter account number" {...field} />
                                             </FormControl>
                                             <FormMessage />
                                         </FormItem>
                                     )}
                                 />
                             </>
                         )}

                        {selectedMethod === 'ewallet' && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="ewalletProvider"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>eWallet Provider</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., GCash, PayMaya" {...field} />
                                                {/* Or a Select for common eWallets */}
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="ewalletIdentifier"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>eWallet Identifier (Phone Number)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter eWallet phone number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                         {selectedMethod === 'qrph-p2m' && (
                             <>
                                <FormField
                                    control={form.control}
                                    name="qrphIdentifier"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>QRPh Identifier</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Scan QRPh code or enter identifier" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {/* In a real app, this would integrate a QR scanner */}
                             </>
                         )}


                        <Button type="submit" className="w-full" disabled={!form.formState.isValid || mutation.isLoading}>
                            {mutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Pay Now
                        </Button>

                         {mutation.error && (
                             <p className="text-sm text-red-600 mt-2">{(mutation.error as Error).message}</p>
                         )}

                         {mutation.isSuccess && !mutation.data?.data.redirectUrl && (
                             <p className="text-sm text-green-600 mt-2">Payment initiated successfully. Check your transaction history for updates.</p>
                         )}

                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}