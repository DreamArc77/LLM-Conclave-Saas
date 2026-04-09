'use client';

import { Mail, MapPin } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer id="contact" className="pt-16 pb-8 border-t border-gray-100 relative bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/images/logo-transparent.png" 
                alt="LLM Conclave Logo" 
                className="h-7 w-7 object-contain"
              />
              <span className="font-bold text-lg tracking-tight text-gray-900">LLM Conclave</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed font-normal">
              A Multi-AI Debate & Decision Platform.
              Gathering insights from multiple AIs to empower your work, life, and learning decisions.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-gray-500 font-normal border-l-2 border-gray-100 pl-3 md:border-none md:pl-0">
              <li>
                <a href="mailto:surprise@flora-vita.com" className="flex flex-col md:flex-row md:items-center gap-2 hover:text-cyan-600 transition-colors group">
                  <Mail className="w-4 h-4 text-gray-400 group-hover:text-cyan-500" />
                  <span>surprise@flora-vita.com</span>
                </a>
              </li>
              <li>
                <div className="flex flex-col md:flex-row md:items-start gap-2 hover:text-cyan-600 transition-colors group">
                  <MapPin className="w-4 h-4 text-gray-400 group-hover:text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug max-w-[200px]">3rd Floor, No. 180 Longtai Road, Xuhui District, Shanghai</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-gray-500 font-normal">
              <li><a href="https://llmconclave.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 transition-colors">Privacy Policy</a></li>
              <li><a href="https://llmconclave.com/terms" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 transition-colors">Terms of Service</a></li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-sm text-gray-400 font-normal">
            © {new Date().getFullYear()} Shanghai SurpriseMan Technology Co., LTD. All rights reserved.
          </p>
          <div className="text-sm text-gray-400">
            Powered by SurpriseMan.
          </div>
        </div>
      </div>
    </footer>
  );
}
