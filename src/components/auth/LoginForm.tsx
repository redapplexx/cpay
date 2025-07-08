'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from './AuthProvider';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Logo } from '@/components/shared/Logo';
import Link from 'next/link';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, loading } = useAuth();

  // Demo credentials (replace with your actual demo user credentials)
  const DEMO_EMAIL = "demo@cpay.com";
  const DEMO_PASSWORD = "demopassword";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }

    try {
      await signIn(email, password);
      // Redirect will be handled by the auth state change
    } catch (error) {
      // Error is handled by the AuthProvider
      console.error('Login failed:', error);
    }
  };

  const handleDemoLogin = async () => {
    try {
      await signIn(DEMO_EMAIL, DEMO_PASSWORD);
      // Redirect will be handled by the auth state change
    } catch (error) {
      console.error('Demo login failed:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div style={{ width: '100%', maxWidth: 400 }}>
        <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
              <Logo size="md" />
          </div>
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <p className="text-gray-600">Welcome back to CPay</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <LoadingSpinner size="sm" text="Signing in..." />
              ) : (
                'Sign In'
              )}
            </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full mt-2"
                onClick={handleDemoLogin}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Demo Access (Investors)'}
              </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <Link 
              href="/forgot-password" 
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot your password?
            </Link>
            <div className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link 
                href="/register" 
                className="text-blue-600 hover:underline"
              >
                Sign up
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
