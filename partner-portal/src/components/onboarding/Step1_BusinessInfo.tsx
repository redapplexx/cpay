
// /partner-portal/src/components/onboarding/Step1_BusinessInfo.tsx
'use client';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export function Step1_BusinessInfo() {
  const { control } = useFormContext();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={control}
        name="businessProfile.type"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Business Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Select the legal form of your business" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-gray-800 text-white border-gray-700">
                <SelectItem value="SOLE_PROPRIETORSHIP">Sole Proprietorship (DTI)</SelectItem>
                <SelectItem value="PARTNERSHIP">Partnership (SEC)</SelectItem>
                <SelectItem value="CORPORATION">Corporation (SEC)</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="businessProfile.registeredName"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Registered Business Name</FormLabel>
            <FormControl>
              <Input placeholder="As it appears on your registration documents" {...field} className="bg-gray-700 border-gray-600" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="businessProfile.tin"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tax Identification Number (TIN)</FormLabel>
            <FormControl>
              <Input placeholder="e.g., 123-456-789-000" {...field} className="bg-gray-700 border-gray-600" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="businessProfile.address"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Registered Business Address</FormLabel>
            <FormControl>
              <Input placeholder="House/Unit No., Street, City, Province, Zip Code" {...field} className="bg-gray-700 border-gray-600" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
