'use client';

import { useState } from 'react';
import { CREDIT_PACKAGES } from '@/config/credit-packages';
import { Zap, CheckCircle } from 'lucide-react';

export function BuyCreditsPanel() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleBuy = async (packageId: string) => {
    setLoading(packageId);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Buy Credits</h2>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        1 credit = 1,000 tokens · 1,000 credits = $1
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CREDIT_PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            className={`relative rounded-xl border p-4 flex flex-col gap-2 ${
              pkg.popular
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}
          >
            {pkg.popular && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-medium bg-blue-500 text-white px-2 py-0.5 rounded-full">
                Popular
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">{pkg.name}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {pkg.credits.toLocaleString()}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">credits</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              ~{(pkg.credits * 1000 / 1_000_000).toFixed(0)}M tokens
            </div>
            <button
              onClick={() => handleBuy(pkg.id)}
              disabled={loading === pkg.id}
              className="mt-auto w-full py-2 px-3 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors"
            >
              {loading === pkg.id ? '...' : `$${pkg.priceUsd}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
