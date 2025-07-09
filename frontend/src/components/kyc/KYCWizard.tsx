// frontend/src/components/kyc/KYCWizard.tsx
'use client';

import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input'; // Assuming Input exists
import { Label } from '@/components/ui/label'; // Assuming Label exists
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Assuming Card exists
import { firebaseApp } from '@/lib/firebase';

const functions = getFunctions(firebaseApp);
const submitKycFn = httpsCallable(functions, 'submitKycDocuments');
const getKycUploadUrlFn = httpsCallable(functions, 'getKycUploadUrl');

// --- Zod Schemas for KYC Form --- //
const step1Schema = z.object({
  fullName: z.string().min(1, "Full name is required."),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Birth date must be YYYY-MM-DD."),
  address: z.string().min(1, "Address is required."),
});

// Simplified for demonstration. In reality, this would involve file objects.
const step2Schema = z.object({
  idFrontFile: z.any().refine(file => file, "ID Front image is required."),
  idBackFile: z.any().refine(file => file, "ID Back image is required."),
  selfieFile: z.any().refine(file => file, "Selfie image is required."),
});

const kycFormSchema = step1Schema.and(step2Schema); // Combine schemas
type KYCFormData = z.infer<typeof kycFormSchema>;

// --- Helper Component for File Upload with Signed URL --- //
interface SecureFileUploadProps {
    label: string;
    onChange: (file: File | null) => void;
    currentFile: File | null;
    isUploading: boolean;
    uploadProgress: number;
    fileName?: string;
    gcsUrl?: string; // Optional: show if already uploaded
}

const SecureFileUpload = ({ label, onChange, currentFile, isUploading, uploadProgress, fileName, gcsUrl }: SecureFileUploadProps) => {
    return (
        <div className="space-y-2">
            <Label className="text-gray-300 text-sm">{label}</Label>
            <div className="flex items-center space-x-2">
                <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
                    disabled={isUploading || !!gcsUrl}
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {isUploading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                {gcsUrl && !isUploading && <FileCheck2 className="h-5 w-5 text-green-500" />}
            </div>
            {isUploading && uploadProgress > 0 && (
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                </div>
            )}
            {gcsUrl && <p className="text-xs text-gray-500 truncate">Uploaded: {fileName || gcsUrl.split('/').pop()}</p>}
        </div>
    );
};

// --- KYC Wizard Component --- //
export function KYCWizard() {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const methods = useForm<KYCFormData>({
    resolver: zodResolver(kycFormSchema),
    mode: 'onChange',
  });

  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  const [uploadStates, setUploadStates] = useState({
      idFront: { isUploading: false, progress: 0, url: '' as string, fileName: '' as string },
      idBack: { isUploading: false, progress: 0, url: '' as string, fileName: '' as string },
      selfie: { isUploading: false, progress: 0, url: '' as string, fileName: '' as string },
  });

  const uploadFileMutation = useMutation({
      mutationFn: async ({ file, uploadType }: { file: File, uploadType: 'idFront' | 'idBack' | 'selfie' }) => {
          setUploadStates(prev => ({ ...prev, [uploadType]: { ...prev[uploadType], isUploading: true, fileName: file.name } }));

          const { data: { signedUrl, finalPath } } = await (getKycUploadUrlFn({ fileName: file.name, fileType: file.type }) as Promise<any>);

          await axios.put(signedUrl, file, {
              headers: { 'Content-Type': file.type || 'application/octet-stream' },
              onUploadProgress: (progressEvent) => {
                  if (progressEvent.total) {
                      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                      setUploadStates(prev => ({ ...prev, [uploadType]: { ...prev[uploadType], progress: percentCompleted } }));
                  }
              },
          });
          setUploadStates(prev => ({ ...prev, [uploadType]: { ...prev[uploadType], isUploading: false, url: finalPath, progress: 100 } }));
          return finalPath; // Return the GCS URL
      },
      onError: (error: any, variables) => {
          toast({ title: "Upload Failed", description: `Failed to upload ${variables.uploadType}: ${error.message}`, variant: "destructive" });
          setUploadStates(prev => ({ ...prev, [variables.uploadType]: { ...prev[variables.uploadType], isUploading: false, progress: 0 } }));
      }
  });

  const submitKycMutation = useMutation({
    mutationFn: (data: KYCFormData) => submitKycFn(data),
    onSuccess: () => {
      toast({ title: "Success!", description: "Your verification application has been submitted." });
      queryClient.invalidateQueries({ queryKey: ['kycStatus'] }); // Invalidate to refetch KYC status
      methods.reset();
      setStep(1); // Reset wizard
      setUploadStates({ idFront: { isUploading: false, progress: 0, url: '' as string, fileName: '' as string }, idBack: { isUploading: false, progress: 0, url: '' as string, fileName: '' as string }, selfie: { isUploading: false, progress: 0, url: '' as string, fileName: '' as string } });
    },
    onError: (error: any) => {
      toast({ title: "Submission Error", description: error.message, variant: 'destructive' });
    },
  });

  const handleFormSubmit = async (data: KYCFormData) => {
    // Ensure all files are uploaded before submitting main form
    if (!uploadStates.idFront.url || !uploadStates.idBack.url || !uploadStates.selfie.url) {
        toast({ title: "Missing Documents", description: "Please upload all required documents.", variant: "destructive" });
        return;
    }

    const payload = {
        ...data,
        idFrontUrl: uploadStates.idFront.url,
        idBackUrl: uploadStates.idBack.url,
        selfieUrl: uploadStates.selfie.url,
    };
    submitKycMutation.mutate(payload);
  };

  return (
    <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-primary">Step {step} of 3: Identity Verification</CardTitle>
        <CardDescription className="text-gray-400">
          {step === 1 && "Please provide your personal information."
          || step === 2 && "Upload clear photos of your identity documents and a selfie."
          || step === 3 && "Review your application before submitting."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleFormSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-gray-300 text-sm">Full Name</Label>
                  <Input id="fullName" {...methods.register("fullName")} placeholder="As per ID" className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent" />
                  {methods.formState.errors.fullName && <p className="text-red-400 text-sm">{methods.formState.errors.fullName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-gray-300 text-sm">Date of Birth (YYYY-MM-DD)</Label>
                  <Input id="birthDate" {...methods.register("birthDate")} type="date" className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent" />
                  {methods.formState.errors.birthDate && <p className="text-red-400 text-sm">{methods.formState.errors.birthDate.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-gray-300 text-sm">Residential Address</Label>
                  <Input id="address" {...methods.register("address")} placeholder="House/Unit No., Street, City, Province, Zip Code" className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent" />
                  {methods.formState.errors.address && <p className="text-red-400 text-sm">{methods.formState.errors.address.message}</p>}
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-gray-400 text-sm">Please upload high-quality images. Max size 5MB per file.</p>
                <SecureFileUpload 
                    label="Valid ID (Front)" 
                    onChange={file => file && uploadFileMutation.mutate({ file, uploadType: 'idFront' })} 
                    currentFile={idFrontFile}
                    isUploading={uploadStates.idFront.isUploading}
                    uploadProgress={uploadStates.idFront.progress}
                    gcsUrl={uploadStates.idFront.url}
                    fileName={uploadStates.idFront.fileName}
                />
                <SecureFileUpload 
                    label="Valid ID (Back)" 
                    onChange={file => file && uploadFileMutation.mutate({ file, uploadType: 'idBack' })} 
                    currentFile={idBackFile}
                    isUploading={uploadStates.idBack.isUploading}
                    uploadProgress={uploadStates.idBack.progress}
                    gcsUrl={uploadStates.idBack.url}
                    fileName={uploadStates.idBack.fileName}
                />
                <SecureFileUpload 
                    label="Selfie (holding ID)" 
                    onChange={file => file && uploadFileMutation.mutate({ file, uploadType: 'selfie' })} 
                    currentFile={selfieFile}
                    isUploading={uploadStates.selfie.isUploading}
                    uploadProgress={uploadStates.selfie.progress}
                    gcsUrl={uploadStates.selfie.url}
                    fileName={uploadStates.selfie.fileName}
                />
                {submitKycMutation.isError && <p className="text-red-400 text-sm mt-4">Submission error: {submitKycMutation.error?.message}</p>}
              </div>
            )}
            {step === 3 && (
              <div className="space-y-4 text-gray-300">
                <h3 className="text-lg font-semibold text-primary-foreground">Review Your Information</h3>
                <p><strong>Full Name:</strong> {methods.watch('fullName')}</p>
                <p><strong>Date of Birth:</strong> {methods.watch('birthDate')}</p>
                <p><strong>Address:</strong> {methods.watch('address')}</p>
                <p><strong>ID Front:</strong> {uploadStates.idFront.url ? 'Uploaded' : 'Missing'}</p>
                <p><strong>ID Back:</strong> {uploadStates.idBack.url ? 'Uploaded' : 'Missing'}</p>
                <p><strong>Selfie:</strong> {uploadStates.selfie.url ? 'Uploaded' : 'Missing'}</p>
                <p className="text-sm text-yellow-400 flex items-center"><AlertCircle className="h-4 w-4 mr-2"/> Please ensure all details are accurate before submitting.</p>
              </div>
            )}

            <div className="flex justify-between pt-6 border-t border-gray-700">
              <Button type="button" onClick={() => setStep(s => s - 1)} disabled={step === 1 || uploadFileMutation.isLoading || submitKycMutation.isLoading} variant="outline" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                Back
              </Button>
              {step < 3 ? (
                <Button type="button" onClick={() => methods.trigger().then(isValid => {
                    if (isValid) {
                        if (step === 2 && (!uploadStates.idFront.url || !uploadStates.idBack.url || !uploadStates.selfie.url)) {
                            toast({ title: "Missing Documents", description: "Please upload all required documents before proceeding.", variant: "destructive" });
                        } else {
                            setStep(s => s + 1);
                        }
                    } else {
                       toast({ title: "Validation Error", description: "Please correct the highlighted fields.", variant: "destructive" });
                    }
                })} disabled={uploadFileMutation.isLoading || submitKycMutation.isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={submitKycMutation.isLoading || !uploadStates.idFront.url || !uploadStates.idBack.url || !uploadStates.selfie.url} className="bg-green-600 hover:bg-green-700 text-white font-semibold">
                  {submitKycMutation.isLoading ? 'Submitting...' : 'Submit Application'}
                </Button>
              )}
            </div>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
