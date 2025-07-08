'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDropzone } from 'react-dropzone';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from '@/components/ui/use-toast';
import { Calendar } from '@/components/ui/calendar'; // Ensure this import is present
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the schema for merchant onboarding data
const merchantOnboardingSchema = z.object({
  registeredName: z.string().min(1, 'Registered Name is required.'),
  tradeName: z.string().optional(),
  registeredAddress: z.string().min(1, 'Registered Address is required.'),
  operationAddress: z.string().optional(), // Often same as registered
  dateOfIncorporation: z.date({
    required_error: 'Date of Incorporation is required.',
  }),
  tin: z.string().min(1, 'TIN is required.'),
  bankName: z.string().min(1, 'Bank Name is required.'),
  bankAccountName: z.string().min(1, 'Bank Account Name is required.'),
  bankAccountNumber: z.string().min(1, 'Bank Account Number is required.'),
  // Placeholders for file uploads - actual implementation would handle File objects
  businessRegistrationFiles: z.array(z.string()).optional(), // Store file paths/URLs
  secretaryCertificateFile: z.string().optional(), // Store file path/URL
});

type MerchantOnboardingFormValues = z.infer<typeof merchantOnboardingSchema>;

// Get a reference to the Cloud Function
const functions = getFunctions();
const submitMerchantOnboardingFn = httpsCallable<
  MerchantOnboardingFormValues,
  { status: string; message?: string }
>(functions, 'submitMerchantOnboarding');

export function MerchantOnboardingForm() {
  const form = useForm<MerchantOnboardingFormValues>({
    resolver: zodResolver(merchantOnboardingSchema),
    defaultValues: {
      registeredName: '',
      tradeName: '',
      registeredAddress: '',
      operationAddress: '',
      tin: '',
      bankName: '',
      bankAccountName: '',
      bankAccountNumber: '',
      // Initialize file fields
      businessRegistrationFiles: [],
      secretaryCertificateFile: undefined,
    },
  });

  const { mutate: submitOnboarding, isLoading } = useMutation({
    mutationFn: (data: MerchantOnboardingFormValues) => submitMerchantOnboardingFn(data),
    onSuccess: (data) => {
      toast({
        title: 'Onboarding Submitted',
        description: data.message || 'Your merchant onboarding application has been submitted for review.',
      });
      form.reset();
      // Optionally redirect or show a success page
    },
    onError: (error: any) => {
      toast({
        title: 'Submission Failed',
        description: error.message || 'An error occurred during submission. Please check your details and try again.',
        variant: 'destructive',
      });
    },
  });

  // File upload logic using react-dropzone and Firebase Storage
  const storage = getStorage();

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  };

  const { getRootProps: getBusinessRegRootProps, getInputProps: getBusinessRegInputProps, isDragActive: isBusinessRegDragActive, acceptedFiles: businessRegFiles } = useDropzone({
    onDrop: (acceptedFiles) => {
      // Update form state with file objects (temporarily)
      // The actual upload happens on form submit
      form.setValue('businessRegistrationFiles', acceptedFiles as any); // Store File objects initially
    },
    multiple: true,
  });

  const { getRootProps: getSecretaryCertRootProps, getInputProps: getSecretaryCertInputProps, isDragActive: isSecretaryCertDragActive, acceptedFiles: secretaryCertFile } = useDropzone({
    onDrop: (acceptedFiles) => {
      // Update form state with the file object (temporarily)
      // The actual upload happens on form submit
      if (acceptedFiles.length > 0) {
         form.setValue('secretaryCertificateFile', acceptedFiles[0] as any); // Store the single File object initially
      }
    },
    multiple: false, // Only accept one file
  });

  const handleFileUploads = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(file => {
      const filePath = `merchant_kyb/${form.getValues('tin')}/${file.name}`; // Use TIN for folder structure
      return uploadFile(file, filePath);
    });
    return Promise.all(uploadPromises);
  };

   const handleSingleFileUpload = async (file: File): Promise<string> => {
     const filePath = `merchant_kyb/${form.getValues('tin')}/secretary-certificate/${file.name}`;
     return uploadFile(file, filePath);
   };


  const onSubmit = async (values: MerchantOnboardingFormValues) => {
    setIsLoading(true); // Manually set loading true during file uploads
    try {
      // Upload files first
      const businessRegUrls = await handleFileUploads(businessRegFiles as File[]);
      const secretaryCertUrl = secretaryCertFile.length > 0 ? await handleSingleFileUpload(secretaryCertFile[0] as File) : undefined;

      // Prepare data with file URLs for the Cloud Function
      const dataToSubmit = {
        ...values,
        businessRegistrationFiles: businessRegUrls,
        secretaryCertificateFile: secretaryCertUrl,
      };
      submitOnboarding(dataToSubmit); // Call the Cloud Function mutation
    } catch (error: any) {
       setIsLoading(false); // Set loading false if file upload fails
       toast({
        title: 'File Upload Failed',
        description: error.message || 'An error occurred during file upload. Please try again.',
        variant: 'destructive',
       });
    }
  });

  function onSubmit(values: MerchantOnboardingFormValues) {
    // In a real app, handle file uploads here and get references/URLs
    // For this example, we'll omit file data in the function call
    const dataToSubmit = {
        ...values,
        // Omit file fields as they are placeholders
        businessRegistrationFile: undefined,
        secretaryCertificateFile: undefined,
    };
    submitOnboarding(dataToSubmit as MerchantOnboardingFormValues);
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Merchant Onboarding</CardTitle>
        <CardDescription>
          Provide your business details to complete merchant verification.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField // Added missing FormField for dateOfIncorporation
              control={form.control}
              name="registeredName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registered Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., ABC Trading Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tradeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trade Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., ABC Store" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateOfIncorporation"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Incorporation</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="registeredAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registered Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., 123 Main St, Brgy. 1, City" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="operationAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operation Address (Optional, leave blank if same as Registered)</FormLabel>
                  <FormControl>
                     <Textarea placeholder="e.g., 456 Side St, Brgy. 2, Town" {...field} />
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
                  <FormLabel>Business TIN</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 000-000-000-000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
                <h3 className="mb-2 text-lg font-semibold">Bank Account Details for Settlement</h3>
                <div className="space-y-4 pl-4 border-l-2">
                    <FormField
                        control={form.control}
                        name="bankName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Bank Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., BDO Unibank" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="bankAccountName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Account Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., ABC Trading Inc." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="bankAccountNumber"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Account Number</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., 000000000000" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            <div>
                 <h3 className="mb-2 text-lg font-semibold">Required Documents</h3>
                 <p className="text-sm text-muted-foreground mb-4">
                     Please prepare digital copies of the following: Business Registration Files (e.g., SEC, DTI, CDA) and Secretary's Certificate.
                 </p>
                {/* File Upload Placeholders */}
                <div className="space-y-4 pl-4 border-l-2">
                    <div className="space-y-2">
                        <Label htmlFor="businessRegistrationFile">Business Registration File(s)</Label>
                        {/* In a real implementation, use a file input component */}
                         <Input id="businessRegistrationFile" type="file" multiple disabled />
                         <p className="text-sm text-muted-foreground">Placeholder for file upload. Actual upload logic needed.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="secretaryCertificateFile">Secretary's Certificate</Label>
                         {/* In a real implementation, use a file input component */}
                        <Input id="secretaryCertificateFile" type="file" disabled />
                        <p className="text-sm text-muted-foreground">Placeholder for file upload. Actual upload logic needed.</p>
                    </div>
                </div>
            </div>


            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Application
            </Button>
          </form>
        </Form>
      </CardContent>
       <CardFooter>
           <p className="text-sm text-muted-foreground">
               After submission, your application will be reviewed. You may be contacted for further verification.
           </p>
       </CardFooter>
    </Card>
  );
}