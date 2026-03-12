export interface CreditPackage {
  id: string;
  name: string;
  baseCredits: number;
  bonusCredits: number;
  priceUsd: number;
  stripePriceEnvKey: string;
  popular?: boolean;
}

/** Total credits for a package */
export function totalCredits(pkg: CreditPackage): number {
  return pkg.baseCredits + pkg.bonusCredits;
}

/** Official exchange rate: 1 USD = 500 credits */
export const CREDITS_PER_USD = 500;

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    baseCredits: 5_000,
    bonusCredits: 1_250,
    priceUsd: 9.9,
    stripePriceEnvKey: 'STRIPE_PRICE_STARTER',
  },
  {
    id: 'basic',
    name: 'Basic',
    baseCredits: 12_500,
    bonusCredits: 7_500,
    priceUsd: 24.9,
    stripePriceEnvKey: 'STRIPE_PRICE_BASIC',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    baseCredits: 25_000,
    bonusCredits: 25_000,
    priceUsd: 49.9,
    stripePriceEnvKey: 'STRIPE_PRICE_PRO',
  },
];

/** New user welcome bonus: covers exactly 1 full session (default 3 models × 2 rounds = 310 × 2 = 620) */
export const WELCOME_CREDITS = 650;

/**
 * Hard limit on debate rounds enforced server-side.
 * Edit this value to change the maximum allowed rounds — redeploy to take effect.
 * The settings UI upper bound is synced to this value automatically.
 */
export const MAX_ROUNDS_HARD_LIMIT = 5;
