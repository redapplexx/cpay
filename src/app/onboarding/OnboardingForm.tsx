// /app/onboarding/OnboardingForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast'; // Assuming you have a toast hook
import { Loader2 } from 'lucide-react'; // Assuming you have lucide-react installed

// Define the schema for validation
const onboardingSchema = z.object({
  fullName: z.string().min(1, 'Full Name is required.'),
  // Using string for birthdate input for now, will need conversion before sending to backend
  birthDate: z.string().min(1, 'Birth Date is required.'),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

// Get a reference to the Cloud Function
const functions = getFunctions();
const onboardUser = httpsCallable<OnboardingFormValues, { status: string; message: string }>(functions, 'onboardNewUser');


export function OnboardingForm() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: '',
      birthDate: '', // Consider using a date picker component for better UX
    },
    mode: 'onChange',
  });

  const { mutate, isLoading } = useMutation({
    mutationFn: async (data: OnboardingFormValues) => {
      // Convert birthDate string to a format suitable for backend (e.g., ISO string or Timestamp object)
      // For simplicity in this example, we'll pass the string and handle conversion in the backend if needed,
      // or ideally, use a proper date input/picker component.
      // A better approach would be: const birthDateTimestamp = new Date(data.birthDate);
      return onboardUser(data);
    },
    onSuccess: (data) => {
      toast({
        title: 'Onboarding Successful',
        description: data.message,
      });
      // Redirect to dashboard or next step
      router.push('/dashboard');
    },
    onError: (error: any) => {
      console.error('Onboarding error:', error);
      toast({
        title: 'Onboarding Failed',
        description: error.message || 'An error occurred during onboarding.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: OnboardingFormValues) => {
    mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="fullName">Full Name</Label>
              <FormControl>
                <Input id="fullName" placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="birthDate"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="birthDate">Birth Date</Label>
              <FormControl>
                {/* Consider using a date picker component here */}
                <Input id="birthDate" type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Complete Profile
        </Button>
      </form>
    </Form>
  );
}