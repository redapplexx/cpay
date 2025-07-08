
'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  kycDocumentAnalyzer,
  type KycDocumentAnalyzerOutput,
} from '@/ai/flows/kyc-document-analyzer';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Camera, CheckCircle, XCircle, RefreshCcw, User, FileText, ScanFace, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { useAuth } from '@/hooks/use-auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  fullName: z.string().min(2, 'Full name is required.'),
  dob: z.string().min(1, 'Date of birth is required.'),
  address: z.string().min(10, 'Address is required.'),
});

const steps = [
    { id: 1, name: 'Personal Info', icon: User },
    { id: 2, name: 'ID Document', icon: FileText },
    { id: 3, name: 'Liveness Check', icon: ScanFace },
];

export function KycForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<KycDocumentAnalyzerOutput | null>(null);
  const [documentUri, setDocumentUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | undefined>(undefined);
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [livenessMessage, setLivenessMessage] = useState('Position your face in the oval');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: '', dob: '', address: '' },
  });

  useEffect(() => {
    if (currentStep > 1) {
      const getCameraPermission = async () => {
        if (typeof window !== 'undefined' && navigator.mediaDevices) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
            setHasCameraPermission(true);
          } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
          }
        } else {
          setHasCameraPermission(false);
        }
      };
      getCameraPermission();
    }
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [currentStep]);
  
  const handleNextStep = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    }
  };
  const handlePrevStep = () => {
    setDirection(-1);
    setCurrentStep(prev => prev - 1);
  }

  const takePhoto = (setter: (uri: string) => void) => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video.videoWidth === 0) return toast({ variant: 'destructive', title: 'Camera Not Ready' });
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        setter(canvas.toDataURL('image/jpeg'));
      }
    }
  };
  
  const handleLivenessCheck = () => {
    takePhoto(setSelfieUri);
    setLivenessMessage('Look straight...');
    setTimeout(() => setLivenessMessage('Blinking...'), 1000);
    setTimeout(() => setLivenessMessage('Scan complete!'), 2000);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!documentUri || !selfieUri) return toast({ variant: 'destructive', title: 'Missing photos' });
    if (!user) return toast({ variant: 'destructive', title: 'Not authenticated' });
    
    setIsLoading(true);
    setResult(null);

    try {
      const analysisResult = await kycDocumentAnalyzer({ 
        documentDataUri: documentUri, 
        selfieDataUri: selfieUri, 
        enteredInformation: {
          fullName: values.fullName,
          dob: values.dob,
          address: values.address,
        }
      });
      setResult(analysisResult);
      
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        profile: {
          fullName: values.fullName,
          dob: values.dob,
          address: values.address,
          kycStatus: analysisResult.verificationStatus === 'VERIFIED' ? 'Verified' : 'Pending',
        }
      }, { merge: true });
      
      toast({ title: 'Application Submitted', description: 'Your information is being reviewed.' });
      setDirection(1);
      setCurrentStep(4);
    } catch (error) {
      console.error('KYC Analysis Error:', error);
      toast({ variant: 'destructive', title: 'Analysis Failed' });
    } finally {
      setIsLoading(false);
    }
  }
  
  const ResultIcon = () => {
    if (!result) return null;
    switch(result.verificationStatus) {
        case 'VERIFIED': return <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />;
        case 'PENDING_REVIEW': return <Clock className="h-16 w-16 text-amber-500 mx-auto" />;
        case 'REJECTED': return <XCircle className="h-16 w-16 text-destructive mx-auto" />;
        default: return <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto" />;
    }
  }
  
  const animationVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 30 : -30, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 30 : -30, opacity: 0 }),
  };

  const renderStepContent = () => {
     switch (currentStep) {
        case 1:
          return (
            <motion.div key={1} className="space-y-6">
              <FormField control={form.control} name="fullName" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Juan dela Cruz" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="dob" render={({ field }) => ( <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="123 Rizal St, Manila, Philippines" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </motion.div>
          );
        case 2:
        case 3:
            const isDocStep = currentStep === 2;
            const photoUri = isDocStep ? documentUri : selfieUri;
            const setPhotoUri = isDocStep ? setDocumentUri : setSelfieUri;
            const title = isDocStep ? 'ID Document Photo' : 'Liveness Check';
            const description = isDocStep ? 'Take a clear photo of your ID (e.g., Passport, Driver\'s License).' : 'Follow the instructions to verify you are a real person.';

            return (
                <motion.div key={currentStep}>
                    <FormLabel>{title}</FormLabel>
                    <Card className="mt-2">
                        <CardContent className="p-4">
                        <div className="relative w-full aspect-video">
                            <video ref={videoRef} className={cn("w-full h-full rounded-md bg-muted object-cover", photoUri ? "hidden" : "block")} autoPlay muted playsInline />
                            {photoUri && <img src={photoUri} alt="KYC Snapshot" className="absolute inset-0 w-full h-full rounded-md object-cover" />}
                            <canvas ref={canvasRef} className="hidden" />

                            {!isDocStep && !selfieUri && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-2/3 h-5/6 border-4 border-dashed border-white/50 rounded-[50%] animate-pulse" />
                                </div>
                            )}

                            {hasCameraPermission === undefined && !photoUri && <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md"><p>Requesting camera...</p></div>}
                        </div>
                        {!isDocStep && !selfieUri && <p className="text-center font-medium mt-4">{livenessMessage}</p>}
                        {hasCameraPermission === false && <Alert variant="destructive" className="mt-4"><AlertTitle>Camera Access Required</AlertTitle><AlertDescription>Please allow camera access in your browser.</AlertDescription></Alert>}
                        </CardContent>
                    </Card>
                    <div className="flex gap-2 pt-2">
                        {!photoUri ? (
                        <Button type="button" onClick={() => isDocStep ? takePhoto(setPhotoUri) : handleLivenessCheck()} disabled={!hasCameraPermission}>
                            <Camera className="mr-2 h-4 w-4" />{isDocStep ? 'Snap Photo' : 'Start Scan'}
                        </Button>
                        ) : (
                        <Button type="button" variant="outline" onClick={() => setPhotoUri(null)}><RefreshCcw className="mr-2 h-4 w-4" />Retake</Button>
                        )}
                    </div>
                    <FormDescription>{description}</FormDescription>
                </motion.div>
            );
        case 4:
            return (
                <motion.div key={4} className="text-center">
                    <ResultIcon />
                    <h2 className="mt-4 text-2xl font-bold font-headline">{result?.verificationStatus.replace('_', ' ')}</h2>
                    <p className="mt-2 text-muted-foreground">{result?.summary}</p>
                    <Card className="mt-6 text-left">
                        <CardContent className="space-y-4 p-4">
                        <div><Label>Overall Matching Score</Label><div className="flex items-center gap-4"><Progress value={result!.overallMatchingScore * 100} className="w-full" /><span className="font-bold font-mono">{`${(result!.overallMatchingScore * 100).toFixed(0)}%`}</span></div></div>
                        <div><Label className="flex items-center">{result!.discrepancies.toLowerCase() === 'none' || !result!.discrepancies ? <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> : <XCircle className="mr-2 h-4 w-4 text-destructive" />}Discrepancies</Label><pre className="mt-1 w-full whitespace-pre-wrap rounded-md bg-muted p-3 text-xs font-code">{result!.discrepancies || 'None'}</pre></div>
                        </CardContent>
                    </Card>
                    <Button onClick={() => router.push('/dashboard/profile')} className="mt-6">Return to Profile</Button>
                </motion.div>
            )
        default: return null;
      }
  };

  return (
    <div className="space-y-8">
      {currentStep < 4 && (
        <div className="flex items-center justify-between">
            {steps.map((step, index) => (
            <React.Fragment key={step.id}>
                <div className="flex flex-col items-center text-center">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                    currentStep > step.id ? "bg-primary border-primary text-primary-foreground" :
                    currentStep === step.id ? "border-primary text-primary" : "bg-muted border-muted-foreground/20 text-muted-foreground"
                )}>
                    {currentStep > step.id ? <CheckCircle /> : <step.icon />}
                </div>
                <p className={cn("text-xs mt-2 font-medium transition-colors", currentStep >= step.id ? "text-primary" : "text-muted-foreground")}>{step.name}</p>
                </div>
                {index < steps.length - 1 && <div className={cn("flex-1 h-0.5 -mt-8 mx-2 transition-colors", currentStep > step.id ? "bg-primary" : "bg-muted-foreground/20")} />}
            </React.Fragment>
            ))}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={animationVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'tween', ease: 'easeInOut', duration: 0.4 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {currentStep < 4 && (
            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={handlePrevStep} disabled={currentStep === 1 || isLoading}>Back</Button>
              {currentStep === 1 && <Button type="button" onClick={handleNextStep}>Continue</Button>}
              {currentStep === 2 && <Button type="button" onClick={() => { setDirection(1); setCurrentStep(3); }} disabled={!documentUri}>Continue</Button>}
              {currentStep === 3 && <Button type="submit" disabled={isLoading || !selfieUri}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Analyze & Submit</Button>}
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
