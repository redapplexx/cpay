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
<<<<<<< HEAD
import { firebaseApp } from '@/lib/firebase';
=======
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3

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
<<<<<<< HEAD
const functions = getFunctions(firebaseApp);
=======
const functions = getFunctions();
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
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
<<<<<<< HEAD
    <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white p-4 font-sans">
      <Card className="w-full max-w-md bg-gray-900 border border-gray-700 shadow-xl rounded-lg overflow-hidden relative">
        {/* Subtle background gradient for premium feel */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-lg opacity-20"></div>

        <CardHeader className="px-6 py-8 bg-gray-800 border-b border-gray-700 relative z-10">
          <CardTitle className="text-3xl font-bold text-center text-primary tracking-tight">CPAY Wallet</CardTitle>
          <CardDescription className="text-center text-gray-400 mt-2">
            Your secure digital wallet for daily transactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center space-x-3 mb-4 justify-center">
              <Label htmlFor="login-method" className="text-gray-300 text-sm">Login with Mobile</Label>
              <Switch
                id="login-method"
                checked={useUsername}
                onCheckedChange={setUseUsername}
                className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-600"
              />
              <Label htmlFor="login-method" className="text-gray-300 text-sm">Login with Username</Label>
            </div>

            {useUsername ? (
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-300 text-sm">Username</Label>
=======
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
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
                <Input
                  id="username"
                  type="text"
                  placeholder="your_username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
<<<<<<< HEAD
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
=======
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
                />
              </div>
            ) : (
              <div className="space-y-2">
<<<<<<< HEAD
                <Label htmlFor="mobileNumber" className="text-gray-300 text-sm">Mobile Number</Label>
=======
                <Label htmlFor="mobileNumber">Mobile Number</Label>
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
                <Input
                  id="mobileNumber"
                  type="tel"
                  placeholder="+639XXXXXXXXX"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  required
<<<<<<< HEAD
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
=======
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
                />
              </div>
            )}
            <div className="space-y-2">
<<<<<<< HEAD
              <Label htmlFor="password" className="text-gray-300 text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}\
                required
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-md transition-all duration-200" disabled={isLoading}>
=======
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
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </form>
        </CardContent>
<<<<<<< HEAD
        <CardFooter className="flex justify-center text-sm text-gray-500 border-t border-gray-800 pt-4 relative z-10">
          <p>Don't have an account?&nbsp;</p>
          <Link href="/auth/register" className="font-semibold text-primary hover:underline">
=======
        <CardFooter className="flex justify-center text-sm">
          <p>Don't have an account?&nbsp;</p>
          <Link href="/auth/register" className="font-semibold text-blue-600 hover:underline">
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
            Register here
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
