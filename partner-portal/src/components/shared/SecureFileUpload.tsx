
// /partner-portal/src/components/shared/SecureFileUpload.tsx
'use client';

import React, { useCallback, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { getPartnerKybUploadUrl } from '@/lib/partner-api';
import { useToast } from '@/hooks/useToast';
import { Loader2, UploadCloud, FileCheck2, Paperclip, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';
import { FormMessage } from '../ui/form';

interface SecureFileUploadProps {
  fieldName: any; // Field name from react-hook-form
  uploadPath: string; // GCS folder path
  label: string;
}

export function SecureFileUpload({ fieldName, uploadPath, label }: SecureFileUploadProps) {
  const { setValue, getValues, formState: { errors } } = useFormContext();
  const { toast } = useToast();
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      setUploadProgress(0);
      setFileName(file.name);

      const { data } = await getPartnerKybUploadUrl({
        fileName: file.name,
        fileType: file.type,
        uploadPath,
      });

      await axios.put(data.signedUrl, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });
      return data.finalPath;
    },
    onSuccess: (gcsUrl) => {
      setValue(fieldName, gcsUrl, { shouldValidate: true, shouldDirty: true });
      toast({ title: 'Success', description: `${label} uploaded successfully.` });
    },
    onError: (error: any) => {
      toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
      setFileName(null);
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      mutation.mutate(acceptedFiles[0]);
    }
  }, [mutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled: isUploading,
    accept: { 'image/*': ['.jpeg', '.png'], 'application/pdf': ['.pdf'] }
  });

  const existingUrl = getValues(fieldName);
  const displayFileName = fileName || (existingUrl ? existingUrl.split('%2F').pop()?.split('?')[0] : '');

  const error = errors[fieldName]?.message;

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={cn(`relative flex justify-center rounded-lg border-2 border-dashed p-6 transition-colors`,
          isDragActive && 'border-primary bg-primary/10',
          !isDragActive && !error && 'border-gray-600 hover:border-primary',
          error && 'border-destructive',
          existingUrl && !error && 'border-green-500/50 bg-green-900/20'
        )}
      >
        <div className="text-center">
          {existingUrl && !isUploading ? <FileCheck2 className="mx-auto h-10 w-10 text-green-400" /> : <UploadCloud className="mx-auto h-10 w-10 text-gray-500" />}
          <div className="mt-4 flex text-sm leading-6 text-gray-400">
            <label htmlFor={fieldName} className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80">
              <span>{label}</span>
              <input {...getInputProps()} id={fieldName} name={fieldName} />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs leading-5 text-gray-500">PDF, PNG, JPG up to 10MB</p>
        </div>
      </div>
      {isUploading && <Progress value={uploadProgress} className="h-2" />}
      {existingUrl && !isUploading && (
        <div className="flex items-center justify-between rounded-md border border-gray-700 bg-gray-900/50 p-2 text-sm">
            <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-gray-400"/>
                <span className="truncate">{displayFileName}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.preventDefault(); setValue(fieldName, null); setFileName(null); }}>
                <X className="h-4 w-4"/>
            </Button>
        </div>
      )}
       <FormMessage>{error as React.ReactNode}</FormMessage>
    </div>
  );
}
