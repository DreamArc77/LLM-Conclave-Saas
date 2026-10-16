'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, CreditCard, Loader2, RefreshCw, X } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { interpolate } from '@/i18n';
import {
  clearPendingCheckout,
  readPendingCheckout,
  savePendingCheckout,
} from '@/lib/pending-checkout';

interface StatusResponse {
  id: string;
  status: 'open' | 'complete' | 'expired';
  paymentStatus: 'paid' | 'unpaid' | 'no_payment_required';
  amountTotal: number | null;
  currency: string | null;
  packageId: string | null;
  paymentMethodType: string | null;
  error: {
    message: string | null;
    code: string | null;
    declineCode: string | null;
    type: string | null;
  } | null;
}

type Phase = 'idle' | 'checking' | 'issue' | 'paid';

const METHOD_LABEL_KEY: Record<string, string> = {
  alipay: 'billing.methodAlipay',
  wechat_pay: 'billing.methodWechat',
  card: 'billing.methodCard',
};

/**
 * Detects a declined / abandoned top-up and guides the user to the card
 * payment method (UnionPay accepted), which is not subject to the
 * cross-border declines that hit Alipay / WeChat Pay.
 */
export function PaymentRecoveryBanner() {
  const t = useT();
  const [phase, setPhase] = useState<Phase>('idle');
  const [info, setInfo] = useState<StatusResponse | null>(null);
  const [starting, setStarting] = useState<'card' | 'retry' | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;

    const params = new URLSearchParams(window.location.search);
    const urlSessionId = params.get('session_id');
    const pending = readPendingCheckout();
    const sessionId = urlSessionId || pending?.sessionId;

    // Strip the one-shot params so a refresh doesn't replay the flow.
    if (urlSessionId || params.has('payment')) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (!sessionId) return;

    // Only surface a spinner if the lookup is slow — avoids a flash on fast responses.
    const spinner = window.setTimeout(() => {
      if (!cancelled) setPhase('checking');
    }, 250);

    fetch(`/api/billing/checkout-status?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('bad status'))))
      .then((data: StatusResponse & { error?: string }) => {
        if (cancelled) return;
        if (!data || data.error) {
          setPhase('idle');
          return;
        }
        if (data.paymentStatus === 'paid') {
          clearPendingCheckout();
          setPhase('paid');
          return;
        }
        setInfo(data);
        setPhase('issue');
      })
      .catch(() => {
        if (!cancelled) setPhase('idle');
      })
      .finally(() => {
        window.clearTimeout(spinner);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(spinner);
    };
  }, []);

  const startCheckout = useCallback(
    async (method?: 'card') => {
      const packageId = info?.packageId || readPendingCheckout()?.packageId;
      if (!packageId) return;

      setStarting(method ?? 'retry');
      try {
        const res = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(method ? { packageId, paymentMethod: method } : { packageId }),
        });
        const data = (await res.json()) as { url?: string; sessionId?: string };
        if (data.url) {
          if (data.sessionId) {
            savePendingCheckout({ sessionId: data.sessionId, packageId, ts: Date.now() });
          }
          window.location.href = data.url;
          return;
        }
        setStarting(null);
      } catch {
        setStarting(null);
      }
    },
    [info]
  );

  if (dismissed || phase === 'idle') return null;

  if (phase === 'checking') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('billing.recoverChecking')}
      </div>
    );
  }

  if (phase === 'paid') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/40 px-4 py-3">
        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-600 dark:text-green-400" />
        <div className="flex-1 text-sm text-green-900 dark:text-green-100">
          <p className="font-semibold">{t('billing.paymentSuccessTitle')}</p>
          <p className="mt-0.5 text-green-800/90 dark:text-green-200/90">
            {t('billing.paymentSuccessBody')}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded text-green-700/70 dark:text-green-300/70 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
          aria-label={t('billing.recoverDismiss')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // --- Failed / abandoned ---
  const failed = Boolean(info?.error);
  const rawReason =
    info?.error?.message ||
    info?.error?.declineCode ||
    info?.error?.code ||
    info?.error?.type ||
    '';
  const methodKey = info?.paymentMethodType ? METHOD_LABEL_KEY[info.paymentMethodType] : undefined;
  const methodLabel = methodKey ? t(methodKey) : (info?.paymentMethodType ?? '');

  return (
    <div
      className={`rounded-xl border-2 px-4 py-4 ${
        failed
          ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/40'
          : 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/40'
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className={`w-5 h-5 shrink-0 mt-0.5 ${
            failed ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
          }`}
        />
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold ${
              failed ? 'text-red-900 dark:text-red-100' : 'text-amber-900 dark:text-amber-100'
            }`}
          >
            {failed ? t('billing.recoverTitleFailed') : t('billing.recoverTitleUnfinished')}
          </p>

          <p
            className={`mt-1 text-sm leading-relaxed ${
              failed ? 'text-red-800/90 dark:text-red-200/90' : 'text-amber-800/90 dark:text-amber-200/90'
            }`}
          >
            {failed
              ? interpolate(t('billing.recoverBodyFailed'), { reason: rawReason || '—' })
              : t('billing.recoverBodyUnfinished')}
          </p>

          {methodLabel && (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              {interpolate(t('billing.recoverMethodHint'), { method: methodLabel })}
            </p>
          )}

          {/* The core guidance: why it failed and what to do instead */}
          <div className="mt-3 rounded-lg bg-white/70 dark:bg-gray-900/40 border border-black/5 dark:border-white/10 p-3">
            <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">
              {t('billing.recoverReasonHint')}
            </p>
            <p className="mt-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
              {t('billing.payWithCard')}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => startCheckout('card')}
              disabled={starting !== null}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white transition-colors"
            >
              {starting === 'card' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              {t('billing.recoverCtaCard')}
            </button>
            <button
              onClick={() => startCheckout()}
              disabled={starting !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 transition-colors"
            >
              {starting === 'retry' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {t('billing.recoverCtaRetry')}
            </button>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded text-gray-500 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label={t('billing.recoverDismiss')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
