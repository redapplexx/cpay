'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  kybDocumentAnalyzer,
  type KybDocumentAnalyzerOutput,
} from '@/ai/flows/kyb-document-analyzer';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building, FileText, CheckCircle, UploadCloud, X, ArrowRight, ArrowLeft, ShieldCheck, Clock, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  businessName: z.string().min(3, 'Business name is required.'),
  businessType: z.string().min(1, 'Please select a business type.'),
  registrationNumber: z.string().min(1, 'Registration number is required.'),
  businessAddress: z.string().min(10, 'Business address is required.'),
  document: z.any().refine(file => file instanceof File, 'A registration document is required.'),
});

type FormData = z.infer<typeof formSchema>;

const steps = [
  { id: 1, name: 'Business Details', icon: Building, fields: ['businessName', 'businessType', 'registrationNumber', 'businessAddress'] },
  { id: 2, name: 'Upload Document', icon: FileText, fields: ['document'] },
  { id: 3, name: 'Review & Submit', icon: CheckCircle },
];

const ResultIcon = ({ status }: { status: KybDocumentAnalyzerOutput['verificationStatus'] }) => {
    switch(status) {
        case 'VERIFIED': return <ShieldCheck className="h-16 w-16 text-green-500 mx-auto" />;
        case 'PENDING_REVIEW': return <Clock className="h-16 w-16 text-amber-500 mx-auto" />;
        case 'REJECTED': return <XCircle className="h-16 w-16 text-destructive mx-auto" />;
        default: return null;
    }
}

export function MerchantOnboardingForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [documentUri, setDocumentUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<KybDocumentAnalyzerOutput | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: '',
      businessType: '',
      registrationNumber: '',
      businessAddress: '',
      document: null,
    },
  });

  const handleNextStep = async () => {
    const fields = steps[currentStep - 1].fields;
    const isValid = await form.trigger(fields as (keyof FormData)[]);
    if (isValid) {
      if (currentStep === 2) {
        const file = form.getValues('document');
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setDocumentUri(e.target?.result as string);
            setCurrentStep(prev => prev + 1);
          };
          reader.readAsDataURL(file);
        }
      } else {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handlePrevStep = () => setCurrentStep(prev => prev - 1);

  const onSubmit = async (values: FormData) => {
    if (!documentUri) {
      toast({ variant: 'destructive', title: 'Error', description: 'Document not processed correctly.' });
      return;
    }
     if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to register.' });
        return;
    }
    setIsLoading(true);
    setResult(null);
    try {
      const analysisResult = await kybDocumentAnalyzer({
        businessName: values.businessName,
        businessType: values.businessType,
        registrationNumber: values.registrationNumber,
        businessAddress: values.businessAddress,
        documentDataUri: documentUri,
      });
      setResult(analysisResult);
      
      if (analysisResult.verificationStatus === 'VERIFIED' || analysisResult.verificationStatus === 'PENDING_REVIEW') {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, { profile: { isMerchant: true } }, { merge: true });
          toast({ title: 'Application Submitted', description: 'Your business information has been sent for verification.' });
      } else {
           toast({ title: 'Application Submitted', description: 'There were issues with your submission.', variant: 'destructive' });
      }

      setCurrentStep(4);
    } catch (error) {
      console.error('KYB Analysis Error:', error);
      toast({ variant: 'destructive', title: 'Submission Failed' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const progress = (currentStep / (steps.length + 1)) * 100;

  const motionProps = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
    transition: { duration: 0.3, ease: 'easeInOut' },
  };

  return (
    <div className="space-y-8">
      <Progress value={progress} className="h-2" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="overflow-x-hidden">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div key={1} {...motionProps} className="space-y-6">
                <FormField control={form.control} name="businessName" render={({ field }) => ( <FormItem><FormLabel>Legal Business Name</FormLabel><FormControl><Input placeholder="e.g., CPay FinTech Corp." {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="businessType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a business type" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="sole_proprietorship">Sole Proprietorship (DTI)</SelectItem>
                        <SelectItem value="partnership">Partnership (SEC)</SelectItem>
                        <SelectItem value="corporation">Corporation (SEC)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="registrationNumber" render={({ field }) => ( <FormItem><FormLabel>SEC / DTI Registration Number</FormLabel><FormControl><Input placeholder="Enter your registration number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="businessAddress" render={({ field }) => ( <FormItem><FormLabel>Registered Business Address</FormLabel><FormControl><Input placeholder="As stated in your registration document" {...field} /></FormControl><FormMessage /></FormItem> )} />
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key={2} {...motionProps} className="space-y-4">
                <FormField control={form.control} name="document" render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Business Registration Document</FormLabel>
                    <FormControl>
                        <div className="relative flex justify-center w-full h-48 border-2 border-dashed rounded-lg">
                           <Input id="document-upload" type="file" className="sr-only" onChange={e => onChange(e.target.files?.[0])} accept="image/*,application/pdf" {...rest} />
                           <Label htmlFor="document-upload" className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-muted-foreground hover:bg-accent">
                               <UploadCloud className="h-8 w-8 mb-2" />
                               <span>Click to upload or drag & drop</span>
                               <p className="text-xs">PNG, JPG, or PDF</p>
                           </Label>
                        </div>
                    </FormControl>
                    <FormMessage />
                    {form.watch('document') && (
                        <div className="flex items-center gap-2 p-2 text-sm rounded-md bg-muted">
                            <FileText className="h-4 w-4 shrink-0" />
                            <span className="flex-grow truncate">{form.watch('document').name}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => form.setValue('document', null)}><X className="h-4 w-4" /></Button>
                        </div>
                    )}
                  </FormItem>
                )} />
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key={3} {...motionProps} className="space-y-4">
                <h3 className="text-lg font-semibold">Review Your Application</h3>
                <Card>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><Label>Business Name</Label><p className="font-medium">{form.watch('businessName')}</p></div>
                        <div><Label>Business Type</Label><p className="font-medium">{form.watch('businessType').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p></div>
                        <div><Label>Registration Number</Label><p className="font-medium">{form.watch('registrationNumber')}</p></div>
                        <div><Label>Business Address</Label><p className="font-medium">{form.watch('businessAddress')}</p></div>
                        <div className="md:col-span-2"><Label>Document</Label><p className="font-medium flex items-center gap-2"><FileText className="h-4 w-4" />{form.watch('document')?.name}</p></div>
                    </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 4 && result && (
              <motion.div key={4} {...motionProps} className="space-y-4 text-center">
                 <ResultIcon status={result.verificationStatus} />
                 <h3 className="text-2xl font-bold font-headline">{result.verificationStatus.replace(/_/g, ' ')}</h3>
                 <p className="text-muted-foreground">{result.summary}</p>
                 <Card>
                    <CardContent className="p-6 text-left space-y-2">
                        <div><Label>Risk Score</Label><p className="font-medium">{(result.riskScore * 100).toFixed(0)}%</p></div>
                        <div><Label>Discrepancies</Label><p className="font-medium font-code">{result.discrepancies}</p></div>
                    </CardContent>
                 </Card>
                 <Button onClick={() => router.push('/dashboard/business')}>
                    Go to Business Dashboard
                </Button>
              </motion.div>
            )}

          </AnimatePresence>

          {currentStep < 4 && (
            <div className="flex justify-between pt-8">
              <Button type="button" variant="outline" onClick={handlePrevStep} disabled={currentStep === 1}>
                <ArrowLeft className="mr-2" /> Back
              </Button>
              {currentStep < 3 ? (
                 <Button type="button" onClick={handleNextStep}>
                    Continue <ArrowRight className="ml-2" />
                 </Button>
              ) : (
                 <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 animate-spin" />}
                    Submit Application
                 </Button>
              )}
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
