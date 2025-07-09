
// /partner-portal/src/components/onboarding/Step3_SettlementAccount.tsx
'use client';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Landmark } from 'lucide-react';

export function Step3_SettlementAccount() {
  const { control } = useFormContext();

  return (
    <div className="space-y-6">
      <Alert className="bg-gray-700/50 border-gray-600">
        <Landmark className="h-4 w-4 text-gray-300" />
        <AlertTitle className="text-white">Settlement Bank Account</AlertTitle>
        <AlertDescription className="text-gray-400">
          This is the bank account where your funds will be sent. Please ensure the details are correct.
        </AlertDescription>
      </Alert>
      <FormField
        control={control}
        name="settlementAccount.bankName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bank Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g., BDO Unibank, Inc." {...field} className="bg-gray-700 border-gray-600" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="settlementAccount.accountName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bank Account Name</FormLabel>
            <FormControl>
              <Input placeholder="Must match your registered business name" {...field} className="bg-gray-700 border-gray-600" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="settlementAccount.accountNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bank Account Number</FormLabel>
            <FormControl>
              <Input placeholder="Enter your bank account number" {...field} className="bg-gray-700 border-gray-600" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
