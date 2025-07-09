
// /partner-portal/src/components/ui/Stepper.tsx
'use client';
import { cn } from '@/lib/utils';
import { Check, type LucideIcon } from 'lucide-react';

interface StepperProps {
  steps: string[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-start">
        {steps.map((step, stepIdx) => (
          <li key={step} className={cn('relative flex-1', stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-12' : '')}>
            {stepIdx <= currentStep ? (
              <>
                <div className="absolute inset-0 top-4 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-primary" />
                </div>
                <a
                  href="#"
                  className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold"
                >
                  {stepIdx < currentStep ? <Check className="h-5 w-5" /> : <span>{stepIdx + 1}</span>}
                  <span className="sr-only">{step}</span>
                </a>
              </>
            ) : (
              <>
                <div className="absolute inset-0 top-4 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-700" />
                </div>
                <a
                  href="#"
                  className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-600 bg-gray-800 text-gray-400"
                >
                  <span>{stepIdx + 1}</span>
                  <span className="sr-only">{step}</span>
                </a>
              </>
            )}
             <p className={cn("text-xs font-medium text-center mt-2", stepIdx <= currentStep ? 'text-primary' : 'text-gray-500')}>{step}</p>
          </li>
        ))}
      </ol>
    </nav>
  );
}
