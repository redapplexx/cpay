import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation } from '@tanstack/react-query';
import { completeBasicKyc } from '@/lib/firebase-functions';

const kycSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  placeOfBirth: z.string().min(1, 'Place of birth is required'),
  currentAddress: z.string().min(1, 'Current address is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  termsAccepted: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
  privacyPolicyAccepted: z.literal(true, { errorMap: () => ({ message: 'You must accept the privacy policy' }) }),
});

type KycFormData = z.infer<typeof kycSchema>;

export function BasicKycForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<KycFormData>({
    resolver: zodResolver(kycSchema),
  });

  const mutation = useMutation(async (data: KycFormData) => {
    return completeBasicKyc(data);
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
          <p className="text-gray-600">For security and compliance, please complete your KYC.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" {...register('fullName')} />
              {errors.fullName && <span className="text-red-500 text-xs">{errors.fullName.message}</span>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
              {errors.dateOfBirth && <span className="text-red-500 text-xs">{errors.dateOfBirth.message}</span>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="placeOfBirth">Place of Birth</Label>
              <Input id="placeOfBirth" {...register('placeOfBirth')} />
              {errors.placeOfBirth && <span className="text-red-500 text-xs">{errors.placeOfBirth.message}</span>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentAddress">Current Address</Label>
              <Input id="currentAddress" {...register('currentAddress')} />
              {errors.currentAddress && <span className="text-red-500 text-xs">{errors.currentAddress.message}</span>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Input id="nationality" {...register('nationality')} />
              {errors.nationality && <span className="text-red-500 text-xs">{errors.nationality.message}</span>}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="termsAccepted" {...register('termsAccepted')} />
              <Label htmlFor="termsAccepted">I accept the Terms and Conditions</Label>
            </div>
            {errors.termsAccepted && <span className="text-red-500 text-xs">{errors.termsAccepted.message}</span>}
            <div className="flex items-center space-x-2">
              <Checkbox id="privacyPolicyAccepted" {...register('privacyPolicyAccepted')} />
              <Label htmlFor="privacyPolicyAccepted">I accept the Privacy Policy</Label>
            </div>
            {errors.privacyPolicyAccepted && <span className="text-red-500 text-xs">{errors.privacyPolicyAccepted.message}</span>}
            <Button type="submit" className="w-full" disabled={mutation.isLoading}>
              {mutation.isLoading ? 'Submitting...' : 'Submit'}
            </Button>
            {mutation.isError && <span className="text-red-500 text-xs">Submission failed. Please try again.</span>}
            {mutation.isSuccess && <span className="text-green-600 text-xs">KYC completed successfully!</span>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 