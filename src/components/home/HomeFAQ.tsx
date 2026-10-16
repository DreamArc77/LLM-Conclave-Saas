import type { Messages } from '@/i18n/messages/en';

type HomeMessages = Messages['home'];

export function HomeFAQ({ t }: { t: HomeMessages }) {
  return (
    <section id="faq" className="py-24 relative bg-white border-t border-gray-100">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-12 tracking-tight text-center">
          {t.faq.title}
        </h2>

        <div className="space-y-4">
          {t.faq.items.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-100 bg-gray-50/50 px-6 py-5 hover:border-cyan-200 transition-colors"
            >
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">{item.q}</h3>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
