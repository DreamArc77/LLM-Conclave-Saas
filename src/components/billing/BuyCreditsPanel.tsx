'use client';

import { useState } from'react';
import { CREDIT_PACKAGES, totalCredits } from'@/config/credit-packages';
import { Zap, Gift } from'lucide-react';
import { useT } from'@/hooks/useT';
import { interpolate } from'@/i18n';

export function BuyCreditsPanel() {
 const t = useT();
 const [loading, setLoading] = useState<string | null>(null);

 const handleBuy = async (packageId: string) => {
 setLoading(packageId);
 try {
 const res = await fetch('/api/billing/checkout', {
 method:'POST',
 headers: {'Content-Type':'application/json'},
 body: JSON.stringify({ packageId }),
 });
 const data = await res.json();
 if (data.url) {
 window.location.href = data.url;
 }
 } finally {
 setLoading(null);
 }
 };

 return (
 <div className="space-y-3">
 <h2 className="text-base font-semibold text-[#111111]">{t('billing.buyCreditsTitle')}</h2>
 <p className="text-xs text-gray-500">
 {t('billing.exchangeRate')}
 </p>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 {CREDIT_PACKAGES.map((pkg) => (
 <div
 key={pkg.id}
 className={`relative rounded-xl border p-4 flex flex-col gap-2 ${
 pkg.popular
 ?'border-blue-500 bg-blue-50'
 :'border-[#E5E0D8] bg-white'
 }`}
 >
 {pkg.popular && (
 <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-medium bg-blue-500 text-[#111111] px-2 py-0.5 rounded-full">
 {t('billing.popular')}
 </span>
 )}
 <div className="flex items-center gap-1.5">
 <Zap className="w-4 h-4 text-yellow-500"/>
 <span className="font-semibold text-[#111111]">{pkg.name}</span>
 </div>

 {/* Total credits (large) */}
 <div className="text-2xl font-bold text-[#111111]">
 {totalCredits(pkg).toLocaleString()}
 <span className="text-sm font-normal text-gray-500 ml-1">{t('billing.creditsUnit')}</span>
 </div>

 {/* Base + bonus breakdown */}
 <div className="space-y-0.5">
 <div className="text-xs text-gray-500">
 {pkg.baseCredits.toLocaleString()} {t('billing.base')}
 </div>
 <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
 <Gift className="w-3 h-3"/>
 {interpolate(t('billing.bonusExtra'), {
 n: pkg.bonusCredits.toLocaleString(),
 pct: Math.round(pkg.bonusCredits / pkg.baseCredits * 100),
 })}
 </div>
 </div>

 <button
 onClick={() => handleBuy(pkg.id)}
 disabled={loading === pkg.id}
 className="mt-auto w-full py-2 px-3 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-[#111111] transition-colors"
 >
 {loading === pkg.id ?'...':`$${pkg.priceUsd}`}
 </button>
 </div>
 ))}
 </div>
 </div>
 );
}
