'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Loader2 } from 'lucide-react';

// This page acts as a router after login, redirecting users based on their role.
export default function AuthRouterPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until loading is false to ensure profile is available
    if (!loading) {
      if (profile?.role === 'admin') {
        router.replace('/admin/dashboard');
      } else if (profile?.role === 'user') {
        router.replace('/user/dashboard');
      } else {
        // If no profile or role (e.g. error fetching profile), default to login
        router.replace('/login');
      }
    }
  }, [profile, loading, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="ml-4">Authenticating...</p>
    </div>
  );
}
