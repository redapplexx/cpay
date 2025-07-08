'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUploadKYCDocument, useProcessKYC } from '@/hooks/useFirebaseFunctions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';

export function KYCManagement() {
  const { toast } = useToast();
  const [userId, setUserId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState('');

  const uploadDocument = useUploadKYCDocument();
  const processKYC = useProcessKYC();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || !userId) {
      toast({
        title: 'Error',
        description: 'Please select a file and enter user ID',
        variant: 'destructive',
      });
      return;
    }

    const result = await uploadDocument.execute({ file: selectedFile, userId });
    if (result) {
      setUploadedUrl(result.url);
      toast({
        title: 'Document Uploaded',
        description: `Document ID: ${result.documentId}`,
      });
    }
  };

  const handleProcessKYC = async () => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'Please enter a user ID',
        variant: 'destructive',
      });
      return;
    }

    const result = await processKYC.execute({ userId });
    if (result) {
      toast({
        title: 'KYC Processed',
        description: `Status: ${result.status}`,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>KYC Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload KYC Document */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Upload KYC Document</h3>
          <div className="space-y-4">
            <Input
              placeholder="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <div>
              <Label htmlFor="file-upload">Select Document</Label>
              <Input
                id="file-upload"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleUploadDocument} 
              disabled={uploadDocument.loading}
              className="w-full"
            >
              {uploadDocument.loading ? (
                <LoadingSpinner size="sm" text="Uploading..." />
              ) : (
                'Upload Document'
              )}
            </Button>
          </div>
          {uploadDocument.error && (
            <p className="text-red-600 text-sm">{uploadDocument.error.message}</p>
          )}
          {uploadedUrl && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">Document uploaded successfully!</p>
              <p className="text-green-600 text-xs mt-1">URL: {uploadedUrl}</p>
            </div>
          )}
        </div>

        {/* Process KYC */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Process KYC</h3>
          <div className="space-y-4">
            <Input
              placeholder="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <Button 
              onClick={handleProcessKYC} 
              disabled={processKYC.loading}
              className="w-full"
            >
              {processKYC.loading ? (
                <LoadingSpinner size="sm" text="Processing..." />
              ) : (
                'Process KYC'
              )}
            </Button>
          </div>
          {processKYC.error && (
            <p className="text-red-600 text-sm">{processKYC.error.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default KYCManagement; 