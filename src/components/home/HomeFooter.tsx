import Link from 'next/link';
import { Mail, MapPin } from 'lucide-react';
import type { Messages } from '@/i18n/messages/en';

type HomeMessages = Messages['home'];

export function HomeFooter({ t }: { t: HomeMessages }) {
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
                width={28}
                height={28}
                loading="lazy"
              />
              <span className="font-bold text-lg tracking-tight text-gray-900">LLM Conclave</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{t.footer.tagline}</p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4">{t.footer.contact}</h4>
            <ul className="space-y-3 text-sm text-gray-500 border-l-2 border-gray-100 pl-3 md:border-none md:pl-0">
              <li>
                <a
                  href="mailto:surprise@flora-vita.com"
                  className="flex flex-col md:flex-row md:items-center gap-2 hover:text-cyan-600 transition-colors group"
                >
                  <Mail className="w-4 h-4 text-gray-400 group-hover:text-cyan-500" />
                  <span>surprise@flora-vita.com</span>
                </a>
              </li>
              <li>
                <div className="flex flex-col md:flex-row md:items-start gap-2 group">
                  <MapPin className="w-4 h-4 text-gray-400 group-hover:text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug max-w-[200px]">
                    3rd Floor, No. 180 Longtai Road, Xuhui District, Shanghai
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4">{t.footer.legal}</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li>
                <Link href="/privacy" className="hover:text-cyan-600 transition-colors">
                  {t.footer.privacy}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-cyan-600 transition-colors">
                  {t.footer.terms}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-sm text-gray-400">
            {t.footer.copyright.replace('{year}', String(new Date().getFullYear()))}
          </p>
          <div className="text-sm text-gray-400">{t.footer.powered}</div>
        </div>
      </div>
    </footer>
  );
}
