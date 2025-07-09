'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Assuming the Cloud Function expects data like this
interface QRScanData {
  recipientId: string;
  amount: number;
}

// Assuming the Cloud Function returns a success message
interface QRProcessResponse {
  status: 'success' | 'error';
  message: string;
}

// Get a reference to the Cloud Function
const functions = getFunctions();
const processClosedLoopQR = httpsCallable<
  { qrCodeData: QRScanData },
  QRProcessResponse
>(functions, 'processClosedLoopQR Payment'); // Note: Check actual function name and data structure

export function ClosedLoopQRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (qrCodeData: QRScanData) => processClosedLoopQR({ qrCodeData }),
    onSuccess: (data) => {
      if (data.status === 'success') {
        toast({
          title: 'Payment Successful',
          description: data.message,
        });
      } else {
        toast({
          title: 'Payment Failed',
          description: data.message,
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Payment Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsScanning(false);
    },
  });

  // Simulate scanning a QR code
  const handleSimulateScan = () => {
    setIsScanning(true);
    // Simulate delay for scanning
    setTimeout(() => {
      // Mock QR code data - Replace with actual data structure expected by backend
      const mockQrData: QRScanData = {
        recipientId: 'recipient123', // Replace with a valid recipient UID/identifier
        amount: 500.00, // Replace with a mock amount
      };
      mutation.mutate(mockQrData);
    }, 1000); // Simulate 1 second scan time
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h2 className="text-xl font-semibold mb-4">Scan QR Code</h2>
      <div
        className="w-64 h-64 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 cursor-pointer hover:border-gray-400 transition-colors"
        onClick={handleSimulateScan}
      >
        {mutation.isLoading || isScanning ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : (
          'Tap to Simulate Scan'
        )}
      </div>
      {mutation.error && (
        <p className="text-sm text-red-600 mt-2">
          Error: {(mutation.error as Error).message}
        </p>
      )}
       {mutation.data && mutation.data.status === 'success' && (
        <p className="text-sm text-green-600 mt-2">
            {mutation.data.message}
        </p>
       )}
    </div>
  );
}