"use client";

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from "framer-motion";
import clsx from "clsx";

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  children: React.ReactNode;
}

const hexPulse = {
  rest: { boxShadow: "0 0 0 0 #00A4FF" },
  hover: { boxShadow: "0 0 0 4px #00A4FF33", transition: { duration: 0.3 } },
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <motion.button
        ref={ref}
        className={clsx(
          cn(buttonVariants({ variant, size, className })),
          variant === "primary" &&
            "bg-gradient-to-r from-primary-start to-primary-end text-white shadow-hex",
          variant === "primary" && "after:content-[''] after:absolute after:top-0 after:right-0 after:bottom-0 after:w-2 after:bg-gradient-to-b after:from-primary-end after:to-primary-start after:clip-path-hex-notch",
        )}
        initial="rest"
        whileHover="hover"
        animate="rest"
        variants={hexPulse}
        {...props}
      >
        {children}
        {/* Notch effect using clip-path */}
        <span
          className="absolute right-0 top-0 h-full w-2"
          style={{
            clipPath:
              "polygon(0 0, 100% 4px, 100% calc(100% - 4px), 0 100%)",
            background: "linear-gradient(180deg, #00A4FF 0%, #0083D7 100%)",
          }}
        />
      </motion.button>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
