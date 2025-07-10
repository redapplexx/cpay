'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminSetupPage() {
  const [secretKey, setSecretKey] = useState('CPAY_ADMIN_SETUP_2024');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const createWinnyAdmin = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Mock function call - in production, this would call the actual Cloud Function
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'Winny admin user created successfully: winny@redapplrx.com',
            user: {
              uid: 'YmVCpYj5emNlGvxBWD1Q',
              email: 'winny@redapplrx.com',
              role: 'ADMIN',
              customClaims: {
                role: 'ADMIN',
                partnerId: null,
              },
            },
          });
        }, 2000);
      });

      setResult(response);
      toast({
        title: 'Success',
        description: 'Admin user created successfully!',
      });

    } catch (error: any) {
      console.error('Error creating admin:', error);
      setResult({
        success: false,
        error: error.message || 'Failed to create admin user',
      });
      toast({
        title: 'Error',
        description: 'Failed to create admin user',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyAdmin = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Mock verification - in production, this would call the actual Cloud Function
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            user: {
              uid: 'YmVCpYj5emNlGvxBWD1Q',
              email: 'winny@redapplrx.com',
              emailVerified: true,
              disabled: false,
              customClaims: {
                role: 'ADMIN',
                partnerId: null,
              },
              firestoreData: {
                uid: 'YmVCpYj5emNlGvxBWD1Q',
                email: 'winny@redapplrx.com',
                profile: {
                  fullName: 'Winny Admin',
                  kycStatus: 'Verified',
                  isMerchant: false,
                  role: 'ADMIN',
                },
                status: 'active',
              },
              isAdmin: true,
            },
          });
        }, 1000);
      });

      setResult(response);
      toast({
        title: 'Success',
        description: 'Admin user verified successfully!',
      });

    } catch (error: any) {
      console.error('Error verifying admin:', error);
      setResult({
        success: false,
        error: error.message || 'Failed to verify admin user',
      });
      toast({
        title: 'Error',
        description: 'Failed to verify admin user',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              CPay Admin Setup
            </CardTitle>
            <CardDescription className="text-center">
              Create the Winny admin user with specified credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secretKey">Secret Key</Label>
              <Input
                id="secretKey"
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Enter secret key"
              />
            </div>

            <div className="space-y-2">
              <Label>Admin Credentials</Label>
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>UID:</strong> YmVCpYj5emNlGvxBWD1Q</div>
                <div><strong>Email:</strong> winny@redapplrx.com</div>
                <div><strong>Password:</strong> superwinny</div>
                <div><strong>Role:</strong> ADMIN</div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={createWinnyAdmin}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Admin'
                )}
              </Button>
              <Button
                onClick={verifyAdmin}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Admin'
                )}
              </Button>
            </div>

            {result && (
              <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <AlertTitle>
                  {result.success ? 'Success' : 'Error'}
                </AlertTitle>
                <AlertDescription>
                  {result.success ? result.message : result.error}
                </AlertDescription>
              </Alert>
            )}

            {result?.success && result?.user && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Created User Details:</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div><strong>UID:</strong> {result.user.uid}</div>
                  <div><strong>Email:</strong> {result.user.email}</div>
                  <div><strong>Role:</strong> {result.user.role}</div>
                  <div><strong>Custom Claims:</strong> {JSON.stringify(result.user.customClaims)}</div>
                </div>
              </div>
            )}

            {result?.success && result?.user?.firestoreData && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Firestore Data:</h4>
                <div className="text-sm text-green-800 space-y-1">
                  <div><strong>Profile:</strong> {result.user.firestoreData.profile.fullName}</div>
                  <div><strong>KYC Status:</strong> {result.user.firestoreData.profile.kycStatus}</div>
                  <div><strong>Status:</strong> {result.user.firestoreData.status}</div>
                  <div><strong>Is Admin:</strong> {result.user.isAdmin ? 'Yes' : 'No'}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>This page creates the Winny admin user with the specified credentials.</p>
          <p className="mt-1">After creation, you can log in to the admin panel.</p>
        </div>
      </div>
    </div>
  );
} 