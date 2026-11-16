import type { SupabaseClient } from '@supabase/supabase-js';

export interface DeductResult {
  ok: boolean;
  cost: number;
  remaining: number;
}

interface RpcCreditResult {
  ok?: boolean;
  balance?: number | null;
}

/** PostgREST / Postgres errors that mean "the SQL function has not been deployed yet". */
function isMissingFunction(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === 'PGRST202' ||
    error.code === '42883' ||
    /function .* does not exist/i.test(error.message ?? '')
  );
}

function readRpcResult(data: unknown): RpcCreditResult | null {
  if (!data) return null;
  if (Array.isArray(data)) return (data[0] as RpcCreditResult) ?? null;
  return data as RpcCreditResult;
}

/**
 * Deduct credits in one atomic statement.
 *
 * Preferred path: `deduct_credits_atomic` (see supabase/migrations/20261116000100_atomic_credits.sql),
 * which updates the balance only while `balance >= cost` and writes the ledger row in the same
 * transaction. If the function has not been applied yet we fall back to an atomic
 * compare-and-swap update (`... where balance = <value we read>`), which also prevents the
 * read-modify-write lost-update race.
 */
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

  try {
    const { data, error } = await supabase.rpc('deduct_credits_atomic', {
      p_user_id: userId,
      p_amount: cost,
      p_relay_session_id: relaySessionId,
    });

    if (!error) {
      const result = readRpcResult(data);
      if (result && typeof result.ok === 'boolean') {
        return { ok: result.ok, cost, remaining: Number(result.balance ?? 0) };
      }
    } else if (!isMissingFunction(error)) {
      console.error('[credits] deduct_credits_atomic failed:', error);
      return { ok: false, cost, remaining: 0 };
    }
  } catch (err) {
    console.error('[credits] deduct_credits_atomic threw:', err);
  }

  return deductWithCompareAndSwap({ userId, cost, relaySessionId, supabase });
}

async function deductWithCompareAndSwap(params: {
  userId: string;
  cost: number;
  relaySessionId: string;
  supabase: SupabaseClient;
}): Promise<DeductResult> {
  const { userId, cost, relaySessionId, supabase } = params;

  // Retry a few times when a concurrent request wins the CAS race.
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data: creditRow, error: fetchErr } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchErr) {
      console.error('[credits] balance read failed:', fetchErr);
      return { ok: false, cost, remaining: 0 };
    }
    if (!creditRow) {
      return { ok: false, cost, remaining: 0 };
    }

    const balance = Number(creditRow.balance) || 0;
    if (balance < cost) {
      return { ok: false, cost, remaining: balance };
    }

    const newBalance = balance - cost;
    const { data: updated, error: updateErr } = await supabase
      .from('credits')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('balance', balance)
      .select('user_id');

    if (updateErr) {
      console.error('[credits] conditional balance update failed:', updateErr);
      return { ok: false, cost, remaining: balance };
    }

    if (!updated || updated.length === 0) {
      // Another request changed the balance between read and write — retry.
      continue;
    }

    const { error: txErr } = await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: -cost,
      type: 'relay_spend',
      description: `Relay session ${relaySessionId}`,
      relay_session_id: relaySessionId,
    });
    if (txErr) {
      console.error('[credits] relay_spend ledger insert failed:', txErr);
    }

    return { ok: true, cost, remaining: newBalance };
  }

  // Under sustained contention, report failure rather than charging twice.
  return { ok: false, cost, remaining: 0 };
}

/**
 * Add credits atomically and write the matching ledger row.
 * Used for refunds, Stripe purchases and invite bonuses.
 */
export async function addCreditsAtomic(params: {
  userId: string;
  amount: number;
  type: 'relay_refund' | 'purchase' | 'bonus';
  description: string;
  supabase: SupabaseClient;
  relaySessionId?: string;
  stripePaymentIntentId?: string | null;
}): Promise<{ ok: boolean; balance: number }> {
  const {
    userId,
    amount,
    type,
    description,
    supabase,
    relaySessionId = null,
    stripePaymentIntentId = null,
  } = params;

  if (!Number.isFinite(amount) || amount === 0) {
    return { ok: true, balance: 0 };
  }

  try {
    const { data, error } = await supabase.rpc('add_credits_atomic', {
      p_user_id: userId,
      p_amount: amount,
      p_type: type,
      p_description: description,
      p_relay_session_id: relaySessionId,
      p_stripe_payment_intent_id: stripePaymentIntentId,
    });

    if (!error) {
      const result = readRpcResult(data);
      if (result && typeof result.ok === 'boolean') {
        return { ok: result.ok, balance: Number(result.balance ?? 0) };
      }
    } else if (!isMissingFunction(error)) {
      console.error('[credits] add_credits_atomic failed:', error);
      return { ok: false, balance: 0 };
    }
  } catch (err) {
    console.error('[credits] add_credits_atomic threw:', err);
  }

  return addWithCompareAndSwap({
    userId,
    amount,
    type,
    description,
    supabase,
    relaySessionId,
    stripePaymentIntentId,
  });
}

async function addWithCompareAndSwap(params: {
  userId: string;
  amount: number;
  type: string;
  description: string;
  supabase: SupabaseClient;
  relaySessionId: string | null;
  stripePaymentIntentId: string | null;
}): Promise<{ ok: boolean; balance: number }> {
  const { userId, amount, type, description, supabase, relaySessionId, stripePaymentIntentId } = params;

  for (let attempt = 0; attempt < 6; attempt++) {
    const { data: creditRow, error: fetchErr } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchErr) {
      console.error('[credits] balance read failed:', fetchErr);
      return { ok: false, balance: 0 };
    }

    let newBalance: number;
    let applied = false;

    if (!creditRow) {
      const { data: inserted, error: insertErr } = await supabase
        .from('credits')
        .insert({ user_id: userId, balance: amount, updated_at: new Date().toISOString() })
        .select('user_id');
      if (insertErr) {
        if (insertErr.code === '23505') continue; // row created concurrently — retry as update
        console.error('[credits] balance insert failed:', insertErr);
        return { ok: false, balance: 0 };
      }
      applied = !!inserted && inserted.length > 0;
      newBalance = amount;
    } else {
      const balance = Number(creditRow.balance) || 0;
      newBalance = balance + amount;
      const { data: updated, error: updateErr } = await supabase
        .from('credits')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('balance', balance)
        .select('user_id');
      if (updateErr) {
        console.error('[credits] conditional balance update failed:', updateErr);
        return { ok: false, balance };
      }
      applied = !!updated && updated.length === 1;
    }

    if (!applied) continue; // concurrent write won — retry

    const { error: txErr } = await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount,
      type,
      description,
      relay_session_id: relaySessionId,
      stripe_payment_intent_id: stripePaymentIntentId,
    });
    if (txErr) {
      console.error('[credits] ledger insert failed:', txErr);
    }

    return { ok: true, balance: newBalance };
  }

  return { ok: false, balance: 0 };
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

  const result = await addCreditsAtomic({
    userId,
    amount,
    type: 'relay_refund',
    description: `Refund for session ${relaySessionId}`,
    relaySessionId,
    supabase,
  });

  if (!result.ok) {
    console.error('[credits] refundCredits failed for session', relaySessionId);
  }
}

export async function addWelcomeCredits(params: {
  userId: string;
  supabase: SupabaseClient;
  amount: number;
}): Promise<void> {
  const { userId, supabase, amount } = params;

  // Insert-only: `ignoreDuplicates` makes the grant idempotent without ever
  // overwriting a balance that was concurrently seeded or purchased.
  const { data: inserted, error: upsertErr } = await supabase
    .from('credits')
    .upsert(
      { user_id: userId, balance: amount, updated_at: new Date().toISOString() },
      { onConflict: 'user_id', ignoreDuplicates: true }
    )
    .select('user_id');

  if (upsertErr) {
    console.error('[credits] addWelcomeCredits upsert failed:', upsertErr);
    return;
  }

  if (!inserted || inserted.length === 0) {
    // Row already existed — welcome credits were already granted.
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
