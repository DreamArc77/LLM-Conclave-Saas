'use client';

import Link from'next/link';
import { Zap } from'lucide-react';
import { useUIStore } from'@/stores/ui-store';
import { useT } from'@/hooks/useT';
import { interpolate } from'@/i18n';

export function InsufficientCreditsModal() {
 const creditsModal = useUIStore((s) => s.creditsModal);
 const closeCreditsModal = useUIStore((s) => s.closeCreditsModal);
 const t = useT();

 if (!creditsModal) return null;

 const { required, balance } = creditsModal;

 return (
 <>
 {/* Backdrop */}
 <div
 className="fixed inset-0 bg-black/40 z-50"
 onClick={closeCreditsModal}
 />

 {/* Modal */}
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
 <div className="bg-white rounded-2xl shadow-xl border border-[#E5E0D8] w-full max-w-sm p-6 pointer-events-auto">
 <div className="flex items-center gap-2 mb-3">
 <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
 <Zap className="w-4 h-4 text-yellow-600"/>
 </div>
 <h2 className="text-base font-semibold text-[#111111]">
 {t('billing.insufficientTitle')}
 </h2>
 </div>

 <p className="text-sm text-gray-600 mb-5">
 {interpolate(t('billing.insufficientBody'), {
 required: required.toLocaleString(),
 balance: balance.toLocaleString(),
 })}
 </p>

 <div className="flex gap-2">
 <Link
 href="/account"
 onClick={closeCreditsModal}
 className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-[#111111] text-center transition-colors"
 >
 {t('billing.topUp')}
 </Link>
 <button
 onClick={closeCreditsModal}
 className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-[#FAFAFA] hover:bg-gray-200 text-gray-700 transition-colors"
 >
 {t('billing.close')}
 </button>
 </div>
 </div>
 </div>
 </>
 );
}
