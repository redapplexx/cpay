// partner-portal/frontend/src/app/dashboard/kyc/page.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { format } from 'date-fns';
import axios from 'axios';

import { PartnerDashboardLayout } from '@/components/partner/PartnerDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, FileCheck2, UploadCloud, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { firebaseApp } from '@/lib/firebase';
import { AnimatedPageWrapper } from '@/components/ui/AnimatedPageWrapper';

const functions = getFunctions(firebaseApp);
const submitKycFn = httpsCallable(functions, 'submitKycForMerchant');
const getKycSubmissionsFn = httpsCallable(functions, 'getKycSubmissions');
const generateUploadUrlFn = httpsCallable(functions, 'generateUploadUrl'); // For secure file uploads

const kycFormSchema = z.object({
  merchantReferenceId: z.string().min(1, "Merchant Reference ID is required."),
  details: z.object({
      name: z.string().min(1, "Merchant's Registered Name is required."),
      contactEmail: z.string().email("Invalid email address."),
  }),
  // GCS URLs for uploaded files, validated client-side before submission
  businessRegistrationUrl: z.string().url("Business Registration document is required."),
  signatoryIdFrontUrl: z.string().url("Signatory ID Front is required."),
  signatoryIdBackUrl: z.string().url("Signatory ID Back is required."),
});

type KycFormData = z.infer<typeof kycFormSchema>;

type KycSubmission = {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    merchantReferenceId: string;
    createdAt: { toDate: () => Date };
    rejectionReason?: string; // For display if rejected
};

interface SecureFileUploadProps {
    label: string;
    onFileUploaded: (gcsUrl: string) => void; // Callback with GCS URL
    uploadPath: string; // e.g., 'kyc-business-registration', 'kyc-signatory-id'
    acceptedFileTypes: string; // e.g., 'image/*,.pdf'
    isLoadingParent: boolean; // From parent mutation
}

const SecureFileUpload = ({ label, onFileUploaded, uploadPath, acceptedFileTypes, isLoadingParent }: SecureFileUploadProps) => {
    const { toast } = useToast();
    const [currentFile, setCurrentFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            setUploadProgress(0);
            setUploadedUrl(null);
            // 1. Get signed URL
            const { data: { signedUrl, finalPath } } = await (generateUploadUrlFn({
                fileName: file.name,
                fileType: file.type,
                uploadPath: `kyc-documents/${uploadPath}` // Partner ID prefix handled by CF
            }) as Promise<any>);

            // 2. Upload file directly to GCS
            await axios.put(signedUrl, file, {
                headers: { 'Content-Type': file.type || 'application/octet-stream' },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                },
            });
            return finalPath; // Return the GCS URL
        },
        onSuccess: (gcsUrl) => {
            setUploadedUrl(gcsUrl);
            onFileUploaded(gcsUrl); // Inform parent about uploaded URL
            toast({ title: "Upload Complete", description: `${label} uploaded successfully.`, variant: "success" });
        },
        onError: (error: any) => {
            toast({ title: "Upload Failed", description: `Failed to upload ${label}: ${error.message}`, variant: "destructive" });
            setUploadProgress(0);
            setUploadedUrl(null);
        }
    });

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (uploadMutation.isLoading || isLoadingParent) return; // Prevent multiple uploads or if parent is busy
            setCurrentFile(file);
            uploadMutation.mutate(file);
        }
    }, [uploadMutation, isLoadingParent]);

    const isUploading = uploadMutation.isLoading;

    return (
        <div className="space-y-2 p-3 border border-gray-700 rounded-md bg-gray-700/50">
            <Label className="text-gray-300 text-sm">{label}</Label>
            <div className="flex items-center space-x-3">
                <UploadCloud className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <Input 
                    type="file" 
                    accept={acceptedFileTypes} 
                    onChange={handleFileChange}
                    disabled={isUploading || !!uploadedUrl || isLoadingParent}
                    className="flex-grow bg-gray-600 border-gray-500 text-white placeholder:text-gray-400 focus:ring-primary focus:border-primary transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {(uploadedUrl && !isUploading) && <FileCheck2 className="h-5 w-5 text-green-500 flex-shrink-0" />}
                {isUploading && <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />}
            </div>
            {isUploading && uploadProgress > 0 && (
                <div className="w-full bg-gray-600 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }}></div>
                </div>
            )}
            {uploadedUrl && !isUploading && <p className="text-xs text-gray-500 truncate">Uploaded: {currentFile?.name || uploadedUrl.split('/').pop()}</p>}
            {(!uploadedUrl && !isUploading && currentFile) && <p className="text-xs text-red-400">Upload pending or failed.</p>}
        </div>
    );
};

const KycSubmissionForm = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const methods = useForm<KycFormData>({ resolver: zodResolver(kycFormSchema) });

    // States to hold the GCS URLs for each uploaded document
    const [businessRegistrationUrl, setBusinessRegistrationUrl] = useState<string | null>(null);
    const [signatoryIdFrontUrl, setSignatoryIdFrontUrl] = useState<string | null>(null);
    const [signatoryIdBackUrl, setSignatoryIdBackUrl] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: (data: KycFormData) => {
            const payload = {
                ...data,
                type: 'BUSINESS', // Assuming Business for this portal. Could be dynamic.
                documentUrls: [
                    { type: 'BUSINESS_REGISTRATION', url: data.businessRegistrationUrl },
                    { type: 'SIGNATORY_ID_FRONT', url: data.signatoryIdFrontUrl },
                    { type: 'SIGNATORY_ID_BACK', url: data.signatoryIdBackUrl },
                ],
            };
            return submitKycFn(payload);
        },
        onSuccess: () => {
            toast({ title: "Submission Successful", description: "KYC information has been sent for review." });
            methods.reset(); // Reset form fields
            setBusinessRegistrationUrl(null); // Clear uploaded file states
            setSignatoryIdFrontUrl(null);
            setSignatoryIdBackUrl(null);
            queryClient.invalidateQueries({ queryKey: ['kycSubmissions'] });
        },
        onError: (error: any) => {
            toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
        }
    });

    // Register GCS URLs with react-hook-form using setValue
    // These useEffects ensure the form schema validation picks up the GCS URLs
    React.useEffect(() => {
        if (businessRegistrationUrl) methods.setValue('businessRegistrationUrl', businessRegistrationUrl, { shouldValidate: true });
    }, [businessRegistrationUrl, methods]);
    React.useEffect(() => {
        if (signatoryIdFrontUrl) methods.setValue('signatoryIdFrontUrl', signatoryIdFrontUrl, { shouldValidate: true });
    }, [signatoryIdFrontUrl, methods]);
    React.useEffect(() => {
        if (signatoryIdBackUrl) methods.setValue('signatoryIdBackUrl', signatoryIdBackUrl, { shouldValidate: true });
    }, [signatoryIdBackUrl, methods]);

    const isSubmitDisabled = mutation.isLoading || !businessRegistrationUrl || !signatoryIdFrontUrl || !signatoryIdBackUrl;

    return (
        <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg">
            <CardHeader><CardTitle className="text-xl">Submit Merchant KYC/KYB</CardTitle><CardDescription className="text-gray-300">Onboard a new merchant by providing their details and required documents.</CardDescription></CardHeader>
            <CardContent>
                <form onSubmit={methods.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="merchantReferenceId" className="text-gray-300 text-sm">Merchant Reference ID</Label>
                        <Input id="merchantReferenceId" {...methods.register("merchantReferenceId")} placeholder="Unique ID from your system" className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent" />
                        {methods.formState.errors.merchantReferenceId && <p className="text-red-400 text-sm">{methods.formState.errors.merchantReferenceId.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="merchantName" className="text-gray-300 text-sm">Merchant's Registered Name</Label>
                        <Input id="merchantName" {...methods.register("details.name")} placeholder="e.g., ABC Trading Inc." className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent" />
                         {methods.formState.errors.details?.name && <p className="text-red-400 text-sm">{methods.formState.errors.details.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contactEmail" className="text-gray-300 text-sm">Merchant's Contact Email</Label>
                        <Input id="contactEmail" {...methods.register("details.contactEmail")} placeholder="contact@merchant.com" className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent" />
                         {methods.formState.errors.details?.contactEmail && <p className="text-red-400 text-sm">{methods.formState.errors.details.contactEmail.message}</p>}
                    </div>
                    
                    <div className="space-y-4 pt-2">
                        <Label className="text-gray-300 text-sm">Required Documents</Label>
                        <SecureFileUpload 
                            label="Business Registration (e.g., DTI, SEC)" 
                            onFileUploaded={setBusinessRegistrationUrl}
                            uploadPath="business-registration"
                            acceptedFileTypes=".pdf,image/*"
                            isLoadingParent={mutation.isLoading}
                        />
                         <SecureFileUpload 
                            label="Authorized Signatory ID (Front)" 
                            onFileUploaded={setSignatoryIdFrontUrl}
                            uploadPath="signatory-id-front"
                            acceptedFileTypes="image/*"
                            isLoadingParent={mutation.isLoading}
                        />
                         <SecureFileUpload 
                            label="Authorized Signatory ID (Back)" 
                            onFileUploaded={setSignatoryIdBackUrl}
                            uploadPath="signatory-id-back"
                            acceptedFileTypes="image/*"
                            isLoadingParent={mutation.isLoading}
                        />
                    </div>

                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-md transition-all duration-200 mt-6" disabled={isSubmitDisabled}>
                        {mutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit for Review
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

const KycStatusTable = () => {
    const { data: submissions, isLoading, error } = useQuery<KycSubmission[]>({
        queryKey: ['kycSubmissions'],
        queryFn: async () => (await getKycSubmissionsFn()).data as KycSubmission[],
        refetchInterval: 10000, // Refresh status every 10 seconds
    });

    const statusVariant = {
        PENDING: 'secondary',
        APPROVED: 'default',
        REJECTED: 'destructive',
    } as const;

    if (isLoading) return <div className="flex justify-center mt-6"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (error) return <div className="text-red-500 mt-6">Error loading submissions: {(error as Error).message}</div>;

    return (
         <Card className="mt-6 bg-gray-800 border border-gray-700 text-white shadow-lg">
            <CardHeader><CardTitle className="text-xl">KYC Submission Status</CardTitle><CardDescription className="text-gray-300">Track the approval status of your merchant onboarding submissions.</CardDescription></CardHeader>
            <CardContent>
                 <div className="overflow-x-auto rounded-md border border-gray-700">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Submitted On</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Merchant Ref. ID</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {submissions?.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-4 text-gray-400">No KYC submissions found.</td>
                                </tr>
                            ) : (
                                submissions?.map(sub => (
                                    <tr key={sub.id} className="hover:bg-gray-700 transition-colors duration-150">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{format(sub.createdAt.toDate(), 'PPpp')}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-primary-foreground">{sub.merchantReferenceId}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <Badge variant={statusVariant[sub.status] || 'secondary'} className="min-w-[80px]">
                                                {sub.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            {sub.status === 'REJECTED' && (
                                                <Button size="sm" variant="outline" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:text-white">
                                                    <Send className="mr-2 h-3 w-3" /> Resubmit
                                                </Button>
                                            )}
                                            {sub.status === 'APPROVED' && (
                                                <Button size="sm" variant="ghost" className="text-gray-500 cursor-default">
                                                    <FileCheck2 className="mr-2 h-3 w-3" /> Approved
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
             {submissions?.some(sub => sub.rejectionReason) && ( // Show rejection reasons if any exist
                <CardFooter className="text-sm text-red-400 border-t border-gray-700 pt-4 mt-4">
                    <AlertCircle className="h-4 w-4 mr-2"/> Some submissions were rejected. Review details in the table.
                </CardFooter>
            )}
        </Card>
    );
};

export default function PartnerKycPage() {
    return (
        <PartnerDashboardLayout>
            <AnimatedPageWrapper>
                <h1 className="text-3xl font-bold mb-6 text-white">Merchant Onboarding (KYC)</h1>
                <KycSubmissionForm />
                <KycStatusTable />
            </AnimatedPageWrapper>
        </PartnerDashboardLayout>
    );
}
