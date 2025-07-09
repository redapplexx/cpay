// src/components/auth/PinLoginForm.tsx

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const pinSchema = z.object({
  pin: z.string().regex(/^\d{6}$/, 'Please enter a 6-digit PIN.'),
});

type PinFormValues = z.infer<typeof pinSchema>;

interface PinLoginFormProps {
  onSubmit: (values: PinFormValues) => void;
  isLoading?: boolean;
}

export function PinLoginForm({ onSubmit, isLoading }: PinLoginFormProps) {
  const form = useForm<PinFormValues>({
    resolver: zodResolver(pinSchema),
    defaultValues: { pin: '' },
    mode: 'onChange',
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
        <FormField
          control={form.control}
          name="pin"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="______"
                  type="password" // Use password type for PIN security
                  maxLength={6}
                  className="text-center tracking-[0.5em]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading || !form.formState.isValid}>
          {isLoading ? 'Verifying PIN...' : 'Login with PIN'}
        </Button>
      </form>
    </Form>
  );
}