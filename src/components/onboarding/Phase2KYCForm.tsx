// src/components/kyc/Phase2KYCForm.tsx

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

// Define the schema for Phase 2 KYC data
const phase2KycSchema = z.object({
  gender: z.string().min(1, 'Gender is required.'),
  civilStatus: z.string().min(1, 'Civil Status is required.'),
  permanentAddress: z.string().min(1, 'Permanent Address is required.'),
  sourceOfFunds: z.string().min(1, 'Source of Funds is required.'),
  passportNumber: z.string().optional(), // Optional as per BRD
  tin: z.string().optional(),          // Optional as per BRD
  sssNumber: z.string().optional(),     // Optional as per BRD
  // Placeholder for file uploads/video validation - actual implementation needed
  // kycDocuments: z.array(z.any()).optional(), // e.g., array of File objects
  // videoValidation: z.any().optional(), // e.g., video file or confirmation
});

type Phase2KYCFormValues = z.infer<typeof phase2KycSchema>;

// Get a reference to the Cloud Function
const functions = getFunctions();
const submitPhase2KYCFn = httpsCallable<Phase2KYCFormValues, { status: string; message: string }>(
  functions,
  'submitPhase2KYC'
);

export function Phase2KYCForm() {
  const { toast } = useToast();

  const form = useForm<Phase2KYCFormValues>({
    resolver: zodResolver(phase2KycSchema),
    defaultValues: {
      gender: '',
      civilStatus: '',
      permanentAddress: '',
      sourceOfFunds: '',
      passportNumber: '',
      tin: '',
      sssNumber: '',
    },
  });

  const { mutate, isLoading } = useMutation({
    mutationFn: (data: Phase2KYCFormValues) => submitPhase2KYCFn(data),
    onSuccess: (data) => {
      toast({
        title: 'KYC Submission Successful',
        description: data.message,
      });
      // TODO: Handle next steps, e.g., show status page, wait for verification
    },
    onError: (error: any) => {
      console.error("Phase 2 KYC submission error:", error);
      toast({
        title: 'KYC Submission Failed',
        description: error.message || 'An error occurred during submission.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: Phase2KYCFormValues) => {
    // In a real app, you would handle document uploads and video validation here
    // before calling the backend function or using separate functions for those steps.
    // For now, we simulate submission of form data.
    mutate(values);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your KYC (Phase 2)</CardTitle>
        <CardDescription>
          Provide additional information to upgrade your account level.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* Example genders, adjust as needed */}
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="civilStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Civil Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your civil status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* Example civil statuses, adjust as needed */}
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="permanentAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permanent Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter your permanent address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sourceOfFunds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source of Funds</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your source of funds" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* Example sources of funds, adjust as needed */}
                      <SelectItem value="salary">Salary</SelectItem>
                      <SelectItem value="business_income">Business Income</SelectItem>
                      <SelectItem value="remittance">Remittance</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="passportNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passport Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter passport number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>TIN (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter TIN" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sssNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SSS Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter SSS number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Placeholder for Document Upload */}
            <div className="space-y-2">
              <Label htmlFor="kycDocuments">Upload Supporting Documents</Label>
              <Input id="kycDocuments" type="file" multiple disabled />
              <p className="text-sm text-muted-foreground">
                (Placeholder: Actual file upload implementation needed.)
              </p>
            </div>

             {/* Placeholder for Video Validation */}
            <div className="space-y-2">
              <Label>Video Validation</Label>
               <Button variant="outline" className="w-full" disabled>
                 Start Video Validation
               </Button>
              <p className="text-sm text-muted-foreground">
                (Placeholder: Actual video recording/upload implementation needed.)
              </p>
            </div>


            <Button type="submit" className="w-full" disabled={isLoading || !form.formState.isDirty || !form.formState.isValid}>
              {isLoading ? 'Submitting...' : 'Submit KYC'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}