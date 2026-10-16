import { FileText, MessageSquare, Users } from 'lucide-react';
import type { Messages } from '@/i18n/messages/en';

type HomeMessages = Messages['home'];

export function HowItWorks({ t }: { t: HomeMessages }) {
  const steps = [
    { icon: <MessageSquare className="w-6 h-6 text-cyan-500" />, title: t.how.step1Title, desc: t.how.step1Desc },
    { icon: <Users className="w-6 h-6 text-purple-500" />, title: t.how.step2Title, desc: t.how.step2Desc },
    { icon: <FileText className="w-6 h-6 text-cyan-500" />, title: t.how.step3Title, desc: t.how.step3Desc },
  ];

  return (
    <section id="how" className="py-24 relative bg-white border-t border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            {t.how.title}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">{t.how.subtitle}</p>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <li
              key={i}
              className="relative p-8 rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-100"
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-50 to-purple-50 border border-cyan-100/50 flex items-center justify-center">
                  {step.icon}
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
