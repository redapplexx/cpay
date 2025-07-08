'use client';

import { useEffect } from 'react';

export default function RedirectScript() {
  useEffect(() => {
    // Only redirect if we're not already on the target domain
    if (typeof window !== 'undefined' && window.location.hostname !== 'fxtoll.redapplex.com') {
      // Add a small delay to ensure the page loads properly before redirect
      const redirectTimer = setTimeout(() => {
        window.location.href = 'http://fxtoll.redapplex.com';
      }, 100);

      // Cleanup timer if component unmounts
      return () => clearTimeout(redirectTimer);
    }
  }, []);

  return null; // This component doesn't render anything
} 