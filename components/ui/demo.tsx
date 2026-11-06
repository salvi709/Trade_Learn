import React from 'react';
import { Footer } from '@/components/ui/footer-section';

export default function DemoOne() {
  return (
    <div className="relative flex min-h-svh flex-col bg-black text-white">
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-emerald-500 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-emerald-500/25">
          TQ
        </div>
        <h1 className="font-mono text-2xl font-bold text-white">ShareMarket Footer Demo</h1>
        <p className="text-gray-400 text-sm">Scroll Down to explore the footer!</p>
      </div>
      <Footer />
    </div>
  );
}

export { DemoOne };
