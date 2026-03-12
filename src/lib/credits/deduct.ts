import type { SupabaseClient } from '@supabase/supabase-js';

export interface DeductResult {
  ok: boolean;
  cost: number;
  remaining: number;
}

export async function checkAndDeductCredits(params: {
  userId: string;
  /** Pre-computed credit cost (sum of creditsPerRound for each model × rounds participated). */
  cost: number;
  relaySessionId: string;
  supabase: SupabaseClient;
}): Promise<DeductResult> {
  const { userId, cost, relaySessionId, supabase } = params;

  if (cost <= 0) {
    return { ok: true, cost: 0, remaining: 0 };
  }

  // Fetch current balance
  const { data: creditRow, error: fetchErr } = await supabase
    .from('credits')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (fetchErr || !creditRow) {
    return { ok: false, cost, remaining: 0 };
  }

  const balance = creditRow.balance as number;
  if (balance < cost) {
    return { ok: false, cost, remaining: balance };
  }

  const newBalance = balance - cost;

  // Deduct
  const { error: updateErr } = await supabase
    .from('credits')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (updateErr) {
    return { ok: false, cost, remaining: balance };
  }

  // Record transaction
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: -cost,
    type: 'relay_spend',
    description: `Relay session ${relaySessionId}`,
    relay_session_id: relaySessionId,
  });

  return { ok: true, cost, remaining: newBalance };
}

export async function refundCredits(params: {
  userId: string;
  /** Amount to refund back to the user (positive number). */
  amount: number;
  relaySessionId: string;
  supabase: SupabaseClient;
}): Promise<void> {
  const { userId, amount, relaySessionId, supabase } = params;
  if (amount <= 0) return;

  const { data: row } = await supabase
    .from('credits')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (!row) return;

  await supabase
    .from('credits')
    .update({ balance: (row.balance as number) + amount, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount,
    type: 'relay_refund',
    description: `Refund for session ${relaySessionId}`,
    relay_session_id: relaySessionId,
  });
}

export async function addWelcomeCredits(params: {
  userId: string;
  supabase: SupabaseClient;
  amount: number;
}): Promise<void> {
  const { userId, supabase, amount } = params;

  const { error: upsertErr } = await supabase.from('credits').upsert(
    { user_id: userId, balance: amount, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );

  if (upsertErr) {
    console.error('[credits] addWelcomeCredits upsert failed:', upsertErr);
    return;
  }

  const { error: txErr } = await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount,
    type: 'bonus',
    description: 'Welcome bonus',
  });

  if (txErr) {
    console.error('[credits] addWelcomeCredits transaction insert failed:', txErr);
  }
}
