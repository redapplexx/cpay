
// /partner-portal/src/components/onboarding/Step4_Review.tsx
'use client';

import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';

export function Step4_Review() {
  const { getValues } = useFormContext();
  const values = getValues();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-headline">Review Your Application</h2>
      <p className="text-muted-foreground">
        Please review all the information carefully before submitting.
      </p>

      <Card className="bg-gray-700/50 border-gray-600">
        <CardHeader><CardTitle className="text-lg">Business Information</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Business Name:</span> <strong className="text-right">{values.businessProfile?.registeredName}</strong></div>
          <Separator className="bg-gray-600" />
          <div className="flex justify-between"><span className="text-muted-foreground">Business Type:</span> <strong className="text-right">{values.businessProfile?.type}</strong></div>
           <Separator className="bg-gray-600" />
          <div className="flex justify-between"><span className="text-muted-foreground">TIN:</span> <strong className="text-right">{values.businessProfile?.tin}</strong></div>
           <Separator className="bg-gray-600" />
          <div className="flex justify-between"><span className="text-muted-foreground">Address:</span> <strong className="text-right">{values.businessProfile?.address}</strong></div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-700/50 border-gray-600">
        <CardHeader><CardTitle className="text-lg">Settlement Account</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Bank Name:</span> <strong className="text-right">{values.settlementAccount?.bankName}</strong></div>
           <Separator className="bg-gray-600" />
          <div className="flex justify-between"><span className="text-muted-foreground">Account Name:</span> <strong className="text-right">{values.settlementAccount?.accountName}</strong></div>
           <Separator className="bg-gray-600" />
          <div className="flex justify-between"><span className="text-muted-foreground">Account Number:</span> <strong className="text-right">{values.settlementAccount?.accountNumber}</strong></div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-700/50 border-gray-600">
        <CardHeader><CardTitle className="text-lg">Uploaded Documents</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Business Registration:</span> <strong className="truncate text-right">{values.kybDocuments?.businessRegistrationFileUrl?.split('%2F').pop()?.split('?')[0] || 'Not Uploaded'}</strong></div>
            {values.kybDocuments?.secretaryCertificateUrl && (
              <>
              <Separator className="bg-gray-600" />
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Secretary's Certificate:</span> <strong className="truncate text-right">{values.kybDocuments?.secretaryCertificateUrl?.split('%2F').pop()?.split('?')[0]}</strong></div>
              </>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
