'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, QrCode } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function ReceivePage() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const mobileNumber = user?.phoneNumber;

  useEffect(() => {
    if (!mobileNumber) {
        setQrCodeDataUrl(null);
        return;
    }

    const generateQrCode = async () => {
      try {
        let qrData: string;
        if (amount && amount > 0) {
          qrData = JSON.stringify({ mobile: mobileNumber, amount });
        } else {
          qrData = mobileNumber;
        }

        const dataUrl = await QRCode.toDataURL(qrData, {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 320,
          color: {
            dark: '#0f172a', // slate-900
            light: '#FFFFFF',
          },
        });
        setQrCodeDataUrl(dataUrl);
      } catch (err) {
        console.error('Failed to generate QR code', err);
        toast({
          variant: 'destructive',
          title: 'QR Code Error',
          description: 'Could not generate a QR code.',
        });
      }
    };
    generateQrCode();
  }, [mobileNumber, amount, toast]);

  const handleCopy = () => {
    if (navigator.clipboard && mobileNumber) {
      navigator.clipboard.writeText(mobileNumber);
      toast({
        title: 'Copied!',
        description: 'Your mobile number has been copied to the clipboard.',
      });
    }
  };
  
  if (isLoading) {
    return (
        <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
                <Skeleton className="h-8 w-48 mx-auto" />
                <Skeleton className="h-4 w-64 mx-auto mt-2" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-6 pt-2">
                 <Skeleton className="h-[352px] w-[352px] rounded-lg" />
                 <div className="text-center w-full space-y-2">
                     <Skeleton className="h-6 w-3/4 mx-auto" />
                     <Skeleton className="h-5 w-1/2 mx-auto" />
                 </div>
            </CardContent>
            <CardFooter>
                 <Skeleton className="h-10 w-full" />
            </CardFooter>
        </Card>
    )
  }

  const formattedAmount = amount ? new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount) : '';

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-2xl tracking-tight">Receive Money</CardTitle>
        <CardDescription>
          Share your QR code to get paid by other CPay users.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-6 pt-2">
        {!mobileNumber ? (
            <Alert variant="destructive">
                <AlertTitle>Missing Mobile Number</AlertTitle>
                <AlertDescription>
                    Your mobile number is not set. Please update your profile to generate a QR code.
                </AlertDescription>
            </Alert>
        ) : (
            <>
                <div className="relative flex h-[352px] w-[352px] items-center justify-center rounded-lg border bg-white p-4 shadow-sm">
                    {qrCodeDataUrl ? (
                        <Image
                        src={qrCodeDataUrl}
                        alt="Your CPay QR Code"
                        width={320}
                        height={320}
                        priority
                        />
                    ) : (
                        <Skeleton className="h-[320px] w-[320px]" />
                    )}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-1.5 border-2 shadow-md">
                        <div className="bg-primary text-primary-foreground rounded-full p-2.5">
                        <QrCode className="h-8 w-8" />
                        </div>
                    </div>
                </div>
                <div className="text-center">
                    <p className="font-semibold text-lg">{user?.displayName}</p>
                    <div className="mt-1 flex items-center justify-center gap-2">
                        <p className="font-mono text-base text-muted-foreground">
                        {mobileNumber}
                        </p>
                        <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleCopy}
                        aria-label="Copy mobile number"
                        >
                        <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    {amount && amount > 0 && <p className="font-bold text-lg mt-2">{formattedAmount}</p>}
                </div>
            </>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <div className="w-full space-y-1.5">
            <Label htmlFor="amount">Set Amount (Optional)</Label>
            <Input 
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount || ''}
                onChange={(e) => setAmount(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                disabled={!mobileNumber}
            />
        </div>
      </CardFooter>
    </Card>
  );
}
