import React, { useState } from 'react';
import { Info } from 'lucide-react';

export function DemoModeBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-between px-6 py-3 shadow-md">
      <div className="flex items-center gap-3">
        <Info className="h-5 w-5 text-white" />
        <span className="font-semibold">Demo Mode:</span>
        <span className="opacity-90">You are viewing CPay in Demo Mode. Data is for demonstration purposes only.</span>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="ml-4 text-white hover:text-gray-200 focus:outline-none"
        aria-label="Dismiss demo mode banner"
      >
        ×
      </button>
    </div>
  );
} 