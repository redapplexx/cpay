
// /partner-portal/src/components/onboarding/OnboardingWizard.tsx
'use client';

import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitKybData } from '@/lib/partner-api';

import { Step1_BusinessInfo } from './Step1_BusinessInfo';
import { Step2_DocumentUpload } from './Step2_DocumentUpload';
import { Step3_SettlementAccount } from './Step3_SettlementAccount';
import { Step4_Review } from './Step4_Review';
import { Stepper } from '@/components/ui/Stepper';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { kybFormSchema, KYCFormData } from '@/schemas/kybForm';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';

const steps = ['Business Information', 'Document Upload', 'Bank Details', 'Review & Submit'];

export function OnboardingWizard() {
  const { partner } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);

  const methods = useForm<KYCFormData>({
    resolver: zodResolver(kybFormSchema),
    mode: 'onChange',
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: KYCFormData) => submitKybData({ partnerId: partner!.partnerId, ...data }),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Your application has been submitted for review.' });
      queryClient.invalidateQueries({ queryKey: ['partner'] });
      // In a real app, this would trigger a refetch of the partner status
      // and likely redirect the user to a "Pending Review" page.
    },
    onError: (error: any) => {
      toast({ title: 'Submission Failed', description: error.message, variant: 'destructive' });
    },
  });

  const handleNext = async () => {
    const fieldsPerStep = [
      ['businessProfile.type', 'businessProfile.registeredName', 'businessProfile.tin', 'businessProfile.address'],
      ['kybDocuments.businessRegistrationFileUrl'],
      ['settlementAccount.bankName', 'settlementAccount.accountName', 'settlementAccount.accountNumber']
    ];
    const fieldsToValidate = fieldsPerStep[currentStep] || [];

    const isValid = await methods.trigger(fieldsToValidate as any);
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    } else {
      toast({ title: 'Incomplete Form', description: 'Please fill out all required fields for this step.', variant: 'destructive'})
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const onSubmit = (data: KYCFormData) => {
    mutate(data);
  };

  return (
    <Card className="max-w-4xl mx-auto bg-gray-800 border-gray-700 text-white shadow-lg">
        <CardContent className="p-8">
            <div className="mb-12">
                <Stepper steps={steps} currentStep={currentStep} />
            </div>
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)} className="mt-8">
                <div className="min-h-[350px]">
                  <AnimatePresence mode="wait">
                      <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        {currentStep === 0 && <Step1_BusinessInfo />}
                        {currentStep === 1 && <Step2_DocumentUpload />}
                        {currentStep === 2 && <Step3_SettlementAccount />}
                        {currentStep === 3 && <Step4_Review />}
                      </motion.div>
                  </AnimatePresence>
                </div>

                <div className="mt-12 flex justify-between items-center pt-5 border-t border-gray-700">
                    <Button variant="outline" type="button" onClick={handleBack} disabled={currentStep === 0 || isPending} className="bg-gray-700 hover:bg-gray-600 border-gray-600">
                    Back
                    </Button>
                    {currentStep < steps.length - 1 ? (
                    <Button type="button" onClick={handleNext} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        Next
                    </Button>
                    ) : (
                    <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white">
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit for Review
                    </Button>
                    )}
                </div>
                </form>
            </FormProvider>
        </CardContent>
    </Card>
  );
}
