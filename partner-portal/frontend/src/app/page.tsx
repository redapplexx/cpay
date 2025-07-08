// partner-portal/frontend/src/app/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Initialize Firebase Auth (assuming it's set up in @/lib/firebase)
import { firebaseApp } from '@/lib/firebase'; // Make sure this exports the Firebase App instance
const auth = getAuth(firebaseApp);

// Define types for Cloud Function interaction
interface LoginPartnerPayload {
  email: string;
  password: string;
}

interface LoginPartnerResponse {
  status: 'success' | 'error';
  message: string;
  token?: string; // Custom token from backend to sign in client
  partnerId?: string;
  role?: string;
}

// Get a reference to the Cloud Function
const functions = getFunctions(firebaseApp);
const loginPartnerUserFn = httpsCallable<LoginPartnerPayload, LoginPartnerResponse>(
  functions,
  'loginPartnerUser'
);

export default function PartnerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  const { mutate: login, isLoading } = useMutation({
    mutationFn: async (data: LoginPartnerPayload) => {
      // First, sign in with email/password via Firebase Auth client SDK
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      // Then, call the Cloud Function to get custom claims / refresh token
      const result = await loginPartnerUserFn({ email: data.email, password: data.password });
      
      // If the cloud function returns a custom token, sign in with it client-side
      if (result.data.status === 'success' && result.data.token) {
        await auth.signInWithCustomToken(result.data.token);
      }
      return result.data; // Return the full data from the Cloud Function
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        toast({ title: 'Login Successful', description: data.message });
        router.push('/dashboard'); // Redirect to partner dashboard on success
      } else {
        toast({ title: 'Login Failed', description: data.message, variant: 'destructive' });
      }
    },
    onError: (error: any) => {
      console.error("Login error:", error);
      // Log out user if client-side auth succeeded but cloud function failed
      signOut(auth);
      toast({ title: 'Login Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Input Missing', description: 'Please enter your email and password.', variant: 'destructive' });
      return;
    }
    login({ email, password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Partner Login</CardTitle>
          <CardDescription>
            Access your Partner Admin Portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="partner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
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
          <p>New partner user? Please contact CPay Admin for registration.</p>
          {/* A registration link for partners might be here if self-service registration is allowed */}
        </CardFooter>
      </Card>
    </div>
  );
}
