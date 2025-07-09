// partner-portal/frontend/src/app/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Assuming a shared component library and lib setup
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { firebaseApp } from '@/lib/firebase'; // Ensure this is correctly configured

const auth = getAuth(firebaseApp);

export default function PartnerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  const { mutate: login, isLoading } = useMutation({
    mutationFn: async () => {
      return signInWithEmailAndPassword(auth, email, password);
    },
    onSuccess: async (userCredential) => {
      const idTokenResult = await userCredential.user.getIdTokenResult(true); // Force refresh
      
      if (idTokenResult.claims.partnerId) {
        toast({ title: 'Login Successful', description: `Welcome, ${userCredential.user.email}` });
        router.push('/dashboard'); // Redirect to partner dashboard
      } else {
        await auth.signOut();
        throw new Error('This user account is not associated with a partner.');
      }
    },
    onError: (error: any) => {
      let errorMessage = 'An unknown error occurred.';
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password.';
            break;
          default:
            errorMessage = error.message;
            break;
        }
      }
      toast({ title: 'Login Failed', description: errorMessage, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Input Missing', description: 'Please enter both email and password.', variant: 'destructive' });
      return;
    }
    login();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white p-4 font-sans">
      <Card className="w-full max-w-md bg-gray-900 border border-gray-700 shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="px-6 py-8 bg-gray-800 border-b border-gray-700">
          <CardTitle className="text-3xl font-headline text-center text-primary tracking-tight">CPAY Partner Portal</CardTitle>
          <CardDescription className="text-center text-gray-400 mt-2">
            Securely access your integration dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 text-sm">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@partner.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-md transition-all duration-200" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-gray-500 border-t border-gray-800 pt-4">
          <p>Need access? Contact CPay Admin.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
