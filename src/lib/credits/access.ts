import type { SupabaseClient } from '@supabase/supabase-js';
import { PRESET_DEFINITIONS } from '@/config/preset-models';
import { createAdminClient } from '@/lib/supabase/server';

/** Preset ids a user may run with welcome/free credits (the default trio). */
export const FREE_TIER_PRESET_IDS = new Set(
  PRESET_DEFINITIONS.filter((p) => p.freeTier).map((p) => p.id)
);

/**
 * A user has "purchased" access once any Stripe purchase transaction exists.
 * Welcome/invite bonuses are free credits and do NOT unlock premium presets.
 *
 * The lookup intentionally ignores the amount: operators can insert a zero-amount
 * `purchase` row to comp premium access without granting credits, and a customer
 * who later spent/refunded their purchase stays unlocked.
 */
export async function hasPaidAccess(
  userId: string,
  supabase?: SupabaseClient
): Promise<boolean> {
  const admin = supabase ?? createAdminClient();
  try {
    const { data, error } = await admin
      .from('credit_transactions')
      .select('type')
      .eq('user_id', userId)
      .eq('type', 'purchase')
      .limit(1);
    if (error) {
      console.error('[credits/access] purchase lookup failed:', error);
      return false;
    }
    return (data?.length ?? 0) > 0;
  } catch (err) {
    console.error('[credits/access] purchase lookup threw:', err);
    return false;
  }
}

/** True when a preset is unavailable because the user only has free credits. */
export function isPresetLocked(presetId: string, paidAccess: boolean): boolean {
  if (paidAccess) return false;
  return !FREE_TIER_PRESET_IDS.has(presetId);
}
