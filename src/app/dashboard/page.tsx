'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, Shield, Users, BarChart3 } from 'lucide-react';

export default function DashboardRouter() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // Check user's role and redirect accordingly
      const customClaims = user.customClaims;
      
      if (customClaims?.role === 'ADMIN') {
        router.push('/admin');
      } else if (customClaims?.partnerId) {
        router.push('/partner');
      } else {
        router.push('/user');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Required</CardTitle>
            <CardDescription>
              Please sign in to access your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => router.push('/')} 
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show dashboard options while determining role
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to CPay</h1>
          <p className="text-gray-600">Choose your dashboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Dashboard */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/user')}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">User Dashboard</CardTitle>
              </div>
              <CardDescription>
                Manage your transactions and account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Access User Dashboard
              </Button>
            </CardContent>
          </Card>

          {/* Partner Dashboard */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/partner')}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Partner Portal</CardTitle>
              </div>
              <CardDescription>
                Manage your business and transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Access Partner Portal
              </Button>
            </CardContent>
          </Card>

          {/* Admin Dashboard */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin')}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-red-600" />
                <CardTitle className="text-lg">Admin Panel</CardTitle>
              </div>
              <CardDescription>
                System administration and monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Access Admin Panel
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            You'll be automatically redirected to the appropriate dashboard based on your role.
          </p>
        </div>
      </div>
    </div>
  );
}
