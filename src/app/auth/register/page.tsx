'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Register for CPay</CardTitle>
          <CardDescription>
            Enter your details to create a new CPay wallet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Placeholder for basic Phase 1 onboarding form */}
          <div className="space-y-4">
            <p className="text-center text-muted-foreground">
              Basic registration form goes here (Phase 1: Mobile Number, Name, DOB, Address, T&Cs)
            </p>
            {/* Actual form components will be integrated here */}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <p>Already have an account? </p>
          <Link href="/" className="font-semibold text-blue-600 hover:underline">
            Login here
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}