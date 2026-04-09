'use client';

import { Info } from 'lucide-react';

export function LandingTrust() {
  return (
    <section id="about" className="py-32 relative bg-gray-50 border-t border-gray-100 overflow-hidden">
      
      {/* Dot Matrix Background Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-50" 
           style={{ backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        
        <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm">
          <Info className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-bold tracking-widest uppercase text-gray-700">About Us</span>
        </div>
        
        <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
          SurpriseMan
        </h2>
        
        <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-cyan-500 rounded mx-auto mb-10 opacity-70"></div>

        <p className="text-gray-600 text-xl leading-relaxed font-medium">
          SurpriseMan is an AI application startup. We provide various creative AI tools to help everyone use AI more efficiently.
        </p>
        
      </div>
    </section>
  );
}
