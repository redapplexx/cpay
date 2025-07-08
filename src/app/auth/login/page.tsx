// src/app/auth/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

// Define types for Cloud Function interaction
interface SignInPayload {
  mobileNumber?: string;
  username?: string;
  password?: string;
}

interface SignInResponse {
  status: 'success' | 'error';
  message: string;
}

// Get a reference to the Cloud Function
const functions = getFunctions();
const signInFn = httpsCallable<SignInPayload, SignInResponse>('signInWithUsernameAndPassword');

export default function LoginPage() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [useUsername, setUseUsername] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const { mutate: signIn, isLoading } = useMutation({
    mutationFn: (data: SignInPayload) => signInFn(data),
    onSuccess: (response) => {
      const data = response.data;
      if (data.status === 'success') {
        toast({ title: 'Login Successful', description: data.message });
        router.push('/dashboard');
      } else {
        toast({ title: 'Login Failed', description: data.message, variant: 'destructive' });
      }
    },
    onError: (error: any) => {
      toast({ title: 'Login Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: SignInPayload = { password };
    if (useUsername) {
      payload.username = username;
    } else {
      payload.mobileNumber = mobileNumber;
    }
    signIn(payload);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login to CPay</CardTitle>
          <CardDescription>
            Enter your credentials to access your wallet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Label htmlFor="login-method">Use Mobile</Label>
            <Switch
              id="login-method"
              checked={useUsername}
              onCheckedChange={setUseUsername}
            />
            <Label htmlFor="login-method">Use Username</Label>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {useUsername ? (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="your_username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input
                  id="mobileNumber"
                  type="tel"
                  placeholder="+639XXXXXXXXX"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <p>Don't have an account?&nbsp;</p>
          <Link href="/auth/register" className="font-semibold text-blue-600 hover:underline">
            Register here
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
