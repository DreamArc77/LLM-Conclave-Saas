'use client';

import Link from 'next/link';

export function LandingNavbar() {
  return (
    <nav className="fixed top-0 inset-x-0 h-16 border-b border-gray-100 bg-white/80 backdrop-blur-md z-50">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 transition-colors">
          <img 
            src="/images/logo-transparent.png" 
            alt="LLM Conclave Logo" 
            className="h-8 w-8 object-contain"
          />
          <span className="font-bold text-lg tracking-tight text-gray-900">LLM Conclave</span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
          <a href="#features" className="hover:text-cyan-600 transition-colors">Features</a>
          <a href="#about" className="hover:text-cyan-600 transition-colors">About Us</a>
          <a href="#contact" className="hover:text-cyan-600 transition-colors">Contact</a>
        </div>

        {/* CTA */}
        <div className="flex items-center">
          <a
            href="https://llmconclave.com/"
            className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-500 hover:to-purple-600 rounded-md transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_20px_rgba(138,43,226,0.4)]"
          >
            Try It Free
          </a>
        </div>
      </div>
    </nav>
  );
}
