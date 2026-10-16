/**
 * Tracks an in-flight Stripe Checkout Session so we can tell, when the user
 * lands back on /account, whether the payment actually succeeded or was
 * declined/abandoned — and nudge them to a payment method that works.
 *
 * Stored in localStorage so it survives the full-page redirect to
 * checkout.stripe.com and back. Purely client-side, no backend state added.
 */

export interface PendingCheckout {
  sessionId: string;
  packageId: string;
  /** epoch ms */
  ts: number;
}

const STORAGE_KEY = 'lc.pending_checkout';

/** Stop caring about a pending checkout after this long. */
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export function savePendingCheckout(pending: PendingCheckout): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  } catch {
    /* storage unavailable (private mode / Capacitor) — non-fatal */
  }
}

export function readPendingCheckout(): PendingCheckout | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingCheckout>;
    if (!parsed || typeof parsed.sessionId !== 'string' || !parsed.sessionId) {
      clearPendingCheckout();
      return null;
    }
    if (Date.now() - (parsed.ts ?? 0) > MAX_AGE_MS) {
      clearPendingCheckout();
      return null;
    }
    return {
      sessionId: parsed.sessionId,
      packageId: parsed.packageId ?? '',
      ts: parsed.ts ?? Date.now(),
    };
  } catch {
    return null;
  }
}

export function clearPendingCheckout(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* no-op */
  }
}

/* --- One-time dismissal of the pre-checkout payment tip --- */

/**
 * Kept in a cookie (not localStorage) so the server render can read it and the
 * first client render matches — otherwise dismissed users would hit a React
 * hydration mismatch on /account.
 */
export const PAY_NOTICE_COOKIE = 'lc_pay_notice_dismissed';

export function dismissPayNotice(): void {
  try {
    document.cookie = `${PAY_NOTICE_COOKIE}=1; path=/; max-age=31536000; samesite=lax`;
  } catch {
    /* no-op */
  }
}
