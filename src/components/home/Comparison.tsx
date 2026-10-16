import { Check, X } from 'lucide-react';
import type { Messages } from '@/i18n/messages/en';

type HomeMessages = Messages['home'];

export function Comparison({ t }: { t: HomeMessages }) {
  return (
    <section className="py-24 relative bg-white border-t border-gray-100 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">
            {t.comparison.title}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">
            {t.comparison.subtitle}
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
          <table className="w-full min-w-[640px] text-sm md:text-base border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th scope="col" className="w-[22%] px-5 py-4 text-left" aria-label="Aspect" />
                <th scope="col" className="px-5 py-4 text-left font-semibold text-gray-500">
                  {t.comparison.left}
                </th>
                <th
                  scope="col"
                  className="px-5 py-4 text-left font-bold bg-gradient-to-r from-cyan-50 to-purple-50 text-gray-900"
                >
                  {t.comparison.right}
                </th>
              </tr>
            </thead>
            <tbody>
              {t.comparison.rows.map((row, i) => (
                <tr key={i} className="border-t border-gray-100 bg-white">
                  <th scope="row" className="px-5 py-4 text-left font-semibold text-gray-700 align-top">
                    {row.label}
                  </th>
                  <td className="px-5 py-4 text-gray-500 align-top">
                    <span className="flex items-start gap-2">
                      <X className="w-4 h-4 mt-0.5 text-gray-300 flex-shrink-0" aria-hidden="true" />
                      {row.left}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-800 font-medium align-top bg-gradient-to-r from-cyan-50/60 to-purple-50/60">
                    <span className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-cyan-500 flex-shrink-0" aria-hidden="true" />
                      {row.right}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
