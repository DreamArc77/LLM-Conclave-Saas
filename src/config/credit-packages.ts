export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceUsd: number;
  stripePriceEnvKey: string;
  popular?: boolean;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 1_000,
    priceUsd: 1,
    stripePriceEnvKey: 'STRIPE_PRICE_STARTER',
  },
  {
    id: 'basic',
    name: 'Basic',
    credits: 5_000,
    priceUsd: 4,
    stripePriceEnvKey: 'STRIPE_PRICE_BASIC',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 20_000,
    priceUsd: 14,
    stripePriceEnvKey: 'STRIPE_PRICE_PRO',
  },
];

/** 1 credit = 1000 tokens (input + output combined) */
export const TOKENS_PER_CREDIT = 1000;

/** Welcome bonus for new signups */
export const WELCOME_CREDITS = 50;
