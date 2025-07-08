
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { AppLogo } from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Fingerprint, Lock, KeyRound, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { PatternLock } from '@/components/auth/pattern-lock';
import { cn } from '@/lib/utils';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const mobileSchema = z.object({
  mobileNumber: z.string().min(1, 'Mobile number is required.').regex(/^(09|\+639)\d{9}$/, 'Please enter a valid PH mobile number.'),
});
type MobileForm = z.infer<typeof mobileSchema>;

const otpSchema = z.object({
  otp: z.string().min(6, 'Please enter the 6-digit code.').max(6),
});
type OtpForm = z.infer<typeof otpSchema>;


export default function LoginPage() {
  const { isLoading: isAuthLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState<'mobile' | 'otp' | 'pattern'>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const mobileForm = useForm<MobileForm>({
    resolver: zodResolver(mobileSchema),
    defaultValues: { mobileNumber: '' },
    mode: 'onChange',
  });

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });
  const { formState: { errors: otpErrors } } = otpForm;
  
  const { trigger: triggerMobileForm } = mobileForm;
  useEffect(() => {
    if (step === 'mobile') {
      // When returning to this step, re-validate the form
      // to ensure the button's disabled state is correct.
      triggerMobileForm();
    }
  }, [step, triggerMobileForm]);


  const handleMobileSubmit = async (values: MobileForm) => {
    // In a real app, this would trigger an API call to send the OTP
    setLoginError(null);
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    
    setMobileNumber(values.mobileNumber);
    setStep('otp');
    
    toast({
        title: 'OTP Sent',
        description: `A one-time PIN has been sent to ${values.mobileNumber}. For this demo, the code is 123456.`,
    });
    setIsProcessing(false);
  };

  const handleOtpSubmit = async (values: OtpForm) => {
    setLoginError(null);
    setIsProcessing(true);
    // Mock OTP verification
    if (values.otp !== '123456') {
        otpForm.setError('otp', { type: 'manual', message: 'Invalid OTP. Please try again.' });
        setIsProcessing(false);
        return;
    }
    
    try {
      await signInAnonymously(auth);
      toast({
        title: 'Login Successful',
        description: 'Welcome to your dashboard!',
      });
      router.push('/dashboard');
    } catch (error: any) {
       console.error("Firebase sign-in error:", error);
       let description = 'An unexpected error occurred. Please try again.';
       if (error.code === 'auth/admin-restricted-operation' || error.code === 'auth/operation-not-allowed') {
           description = 'Anonymous sign-in is disabled. Please enable it in the Firebase Console under Authentication > Sign-in method.';
       } else if (error.code === 'auth/api-key-not-valid') {
           description = 'Your Firebase API key is invalid. Please check your .env file.';
       }
       setLoginError(description);
    } finally {
        setIsProcessing(false);
    }
  };
  
  const handlePatternComplete = async (pattern: number[]) => {
    setLoginError(null);
    setIsProcessing(true);
    toast({
        title: "Pattern Received",
        description: `Your pattern is ${pattern.join('-')}. Verifying...`
    });

    try {
      await signInAnonymously(auth);
      toast({
        title: 'Login Successful',
        description: 'Welcome to your dashboard!',
      });
      router.push('/dashboard');
    } catch (error: any) {
       console.error("Firebase sign-in error:", error);
       let description = 'An unexpected error occurred. Please try again.';
        if (error.code === 'auth/admin-restricted-operation' || error.code === 'auth/operation-not-allowed') {
           description = 'Anonymous sign-in is disabled. Please enable it in the Firebase Console under Authentication > Sign-in method.';
       } else if (error.code === 'auth/api-key-not-valid') {
           description = 'Your Firebase API key is invalid. Please check your .env file.';
       }
       setLoginError(description);
    } finally {
      setIsProcessing(false);
    }
  }
  
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-8">
      <div className="w-full max-w-sm space-y-2 text-center">
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
        >
            <AppLogo priority />
        </motion.div>
        
        {loginError && (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Login Failed</AlertTitle>
                <AlertDescription>
                    {loginError}
                </AlertDescription>
            </Alert>
        )}

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="relative h-40 flex items-center"
        >
            <AnimatePresence mode="wait">
                {step === 'mobile' && (
                    <motion.div
                        key="mobile"
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        className="absolute w-full"
                    >
                         <Form {...mobileForm}>
                          <form
                            onSubmit={mobileForm.handleSubmit(handleMobileSubmit)}
                            className="w-full space-y-4"
                          >
                            <FormField
                              control={mobileForm.control}
                              name="mobileNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Mobile number" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" className="w-full" disabled={isProcessing || !mobileForm.formState.isValid || isAuthLoading}>
                              {(isProcessing || isAuthLoading) && <Loader2 className="animate-spin mr-2" />}
                              Continue
                            </Button>
                          </form>
                        </Form>
                    </motion.div>
                )}
                 {step === 'otp' && (
                    <motion.div
                        key="otp"
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        className="absolute w-full"
                    >
                         <h2 className="text-xl font-semibold tracking-tight text-foreground">Enter OTP</h2>
                         <p className="text-muted-foreground text-sm mb-4">A 6-digit code was sent to {mobileNumber}.</p>
                         <Form {...otpForm}>
                          <form
                            onSubmit={otpForm.handleSubmit(handleOtpSubmit)}
                            className="w-full space-y-4"
                          >
                            <FormField
                              control={otpForm.control}
                              name="otp"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <motion.div
                                      animate={otpErrors.otp ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                                      transition={{ duration: 0.4, ease: "easeInOut" }}
                                    >
                                      <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                          placeholder="_ _ _ _ _ _"
                                          className={cn(
                                            "pl-10 text-center tracking-[0.5em]",
                                            otpErrors.otp && "ring-2 ring-destructive"
                                          )}
                                          maxLength={6}
                                          {...field}
                                        />
                                      </div>
                                    </motion.div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" className="w-full" disabled={isProcessing || !otpForm.formState.isValid}>
                              {isProcessing && <Loader2 className="animate-spin mr-2" />}
                              Verify & Sign In
                            </Button>
                          </form>
                        </Form>
                        <Button variant="link" size="sm" className="mt-2 text-muted-foreground" onClick={() => { setLoginError(null); setStep('mobile'); }} disabled={isProcessing}>
                            Use a different mobile number
                        </Button>
                    </motion.div>
                )}
                {step === 'pattern' && (
                     <motion.div
                        key="pattern"
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        className="absolute w-full flex flex-col items-center"
                    >
                        <h2 className="text-xl font-semibold tracking-tight text-foreground">Draw your pattern</h2>
                        <p className="text-muted-foreground text-sm mb-4">to sign in to your account.</p>
                        {isProcessing ? (
                            <div className="h-56 flex items-center justify-center">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            </div>
                        ) : (
                            <PatternLock onComplete={handlePatternComplete} />
                        )}
                         <Button variant="link" size="sm" className="mt-2 text-muted-foreground" onClick={() => { setLoginError(null); setStep('mobile'); }} disabled={isProcessing}>
                            Sign in with OTP instead
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>


        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" disabled>
                <Fingerprint className="mr-2 h-4 w-4" />
                Face ID
            </Button>
             <Button variant="outline" disabled>
                <Lock className="mr-2 h-4 w-4" />
                Sign in with ARC
            </Button>
        </div>

      </div>
    </main>
  );
}
