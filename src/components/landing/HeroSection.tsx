"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center h-screen bg-slate-950 overflow-hidden">
      {/* TODO: Add animated plexus background here */}
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-5xl md:text-7xl font-serif font-bold text-center mb-6"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        Redefining Financial Velocity.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="max-w-3xl text-lg text-slate-400 text-center mb-10"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        CPay is a BSP-licensed digital finance platform, engineered to command the flow of capital within the Philippines and create the definitive financial bridge to Asia.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.7 }}
      >
        <a href="/login">
          <Button size="lg" className="text-lg font-semibold px-8 py-4">
            Sign In to CPay
          </Button>
        </a>
      </motion.div>
    </section>
  );
} 