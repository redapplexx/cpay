
// /partner-portal/src/components/onboarding/Step2_DocumentUpload.tsx
'use client';
import { useFormContext } from 'react-hook-form';
import { SecureFileUpload } from '@/components/shared/SecureFileUpload';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, ShieldAlert } from 'lucide-react';
import { FormField } from '../ui/form';

export function Step2_DocumentUpload() {
  const { watch, control } = useFormContext();
  const businessType = watch('businessProfile.type');

  return (
    <div className="space-y-6">
      <Alert className="bg-gray-700/50 border-gray-600">
        <FileText className="h-4 w-4 text-gray-300" />
        <AlertTitle className="text-white">Upload Your Documents</AlertTitle>
        <AlertDescription className="text-gray-400">
          Please provide clear copies of your official business documents. This helps us verify your business securely.
        </AlertDescription>
      </Alert>
      <FormField
        control={control}
        name="kybDocuments.businessRegistrationFileUrl"
        render={({ field }) => (
           <SecureFileUpload
            fieldName={field.name}
            label="Business Registration (DTI/SEC)"
            uploadPath="kyb-registration"
          />
        )}
      />
      
      {businessType === 'CORPORATION' && (
        <div>
            <Alert variant="destructive" className="mb-4 bg-yellow-900/50 border-yellow-500/50 text-yellow-300 [&>svg]:text-yellow-300">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Additional Document Required</AlertTitle>
                <AlertDescription>As a corporation, you must also upload your Secretary's Certificate.</AlertDescription>
            </Alert>
            <FormField
              control={control}
              name="kybDocuments.secretaryCertificateUrl"
              render={({ field }) => (
                <SecureFileUpload
                    fieldName={field.name}
                    label="Secretary's Certificate"
                    uploadPath="kyb-secretary-cert"
                />
              )}
            />
        </div>
      )}
    </div>
  );
}
