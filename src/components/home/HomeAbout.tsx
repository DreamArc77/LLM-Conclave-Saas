import { Info } from 'lucide-react';
import type { Messages } from '@/i18n/messages/en';

type HomeMessages = Messages['home'];

export function HomeAbout({ t }: { t: HomeMessages }) {
  return (
    <section id="about" className="py-32 relative bg-gray-50 border-t border-gray-100 overflow-hidden">
      {/* Dot Matrix Background Pattern */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-50"
        style={{ backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />

      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm">
          <Info className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-bold tracking-widest uppercase text-gray-700">
            {t.nav.about}
          </span>
        </div>

        <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
          {t.about.title}
        </h2>

        <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-cyan-500 rounded mx-auto mb-10 opacity-70" />

        <p className="text-gray-600 text-xl leading-relaxed font-medium">{t.about.desc}</p>
      </div>
    </section>
  );
}
