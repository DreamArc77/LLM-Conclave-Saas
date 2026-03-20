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

/** New user welcome bonus: covers 1 round with default enabled models (deepseek 15 + gpt 250 + gemini 60 = 325) */
export const WELCOME_CREDITS = 350;

/** Extra credits granted to a new user who redeems an invite code */
export const INVITE_INVITEE_BONUS = 100;

/** Credits granted to the inviter for each successful referral */
export const INVITE_INVITER_BONUS = 350;

/** Maximum number of times a single invite code can be used */
export const INVITE_CODE_MAX_USES = 10;

/**
 * Sum of all model input+output tokens in a single relay run, above which background
 * context compaction is triggered. For 3 models × 1 round, this corresponds to
 * ~10k tokens of actual context — keeping GPT-class input costs well within margin.
 */
export const COMPACT_TOKEN_THRESHOLD = 30000;

/** Number of most-recent messages to keep intact after compaction */
export const COMPACT_KEEP_RECENT = 6;

/**
 * Hard limit on debate rounds enforced server-side.
 * Edit this value to change the maximum allowed rounds — redeploy to take effect.
 * The settings UI upper bound is synced to this value automatically.
 */
export const MAX_ROUNDS_HARD_LIMIT = 5;
