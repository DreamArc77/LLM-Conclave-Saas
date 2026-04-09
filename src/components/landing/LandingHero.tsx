'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function LandingHero() {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-24 overflow-hidden bg-white">
      
      {/* Geometric Network Pattern Background matching the Logo (Lines and Nodes) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0l100 100M100 0L0 100\' stroke=\'%23000\' stroke-width=\'1\' fill=\'none\'/%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'4\' fill=\'%23000\'/%3E%3C/svg%3E")', backgroundSize: '120px 120px' }}>
      </div>

      {/* Hero Logo Faint Watermark representation of the geometric C */}
      <div className="absolute -right-32 top-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none z-0">
        <img 
          src="/images/logo-transparent.png" 
          alt="Geometric Background" 
          className="w-[800px] h-auto object-contain transform -rotate-12 blur-[2px]"
        />
      </div>
      
      {/* Extracted Logo Gradients as glowing ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-300/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-300/10 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 w-full flex flex-col items-center text-center">
        
        <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-cyan-200 bg-cyan-50/80 text-cyan-700 text-sm md:text-base font-bold tracking-wide uppercase mb-8 shadow-sm shadow-cyan-100/50 backdrop-blur-sm">
          A Multi-AI Debate & Decision Platform
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-8">
          Make better <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Decisions.</span>
        </h1>

        <p className="max-w-2xl text-lg text-gray-500 mb-10 leading-relaxed z-10 relative">
          LLM Conclave is an easy-to-use AI collaboration platform where multiple top AI models discuss and analyze your questions to deliver balanced insights for research, decisions, and study.
        </p>

        <div className="flex justify-center w-full">
          <a
            href="https://llmconclave.com/"
            className="group flex items-center gap-2 px-8 py-3.5 rounded-md bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-500 hover:to-purple-600 text-white font-bold transition-all duration-300 shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(138,43,226,0.3)] hover:-translate-y-0.5"
          >
            Try It Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
}
