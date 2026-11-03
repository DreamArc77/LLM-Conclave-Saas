// One-shot handoff: set right before an auth flow completes (or when the
// landing page's debate box hands off to sign-up) so the console shows the
// model picker on arrival — even in browsers that have already seen it.
// Consumed (read + cleared) by AppShell on mount.
export const MODEL_DRAWER_REQUEST_KEY = 'llmconclave-open-model-drawer';

export function requestModelDrawerOnNextAppEntry(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(MODEL_DRAWER_REQUEST_KEY, '1');
  } catch {
    // Storage unavailable (private mode etc.) — the first-visit rule still applies.
  }
}

export function consumeModelDrawerRequest(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const requested = sessionStorage.getItem(MODEL_DRAWER_REQUEST_KEY) === '1';
    if (requested) sessionStorage.removeItem(MODEL_DRAWER_REQUEST_KEY);
    return requested;
  } catch {
    return false;
  }
}
