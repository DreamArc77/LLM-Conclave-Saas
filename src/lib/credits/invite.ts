import type { SupabaseClient } from '@supabase/supabase-js';
import { INVITE_INVITEE_BONUS, INVITE_INVITER_BONUS, INVITE_CODE_MAX_USES } from '@/config/credit-packages';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // exclude ambiguous chars (0,O,1,I)
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function addBonusCredits(
  userId: string,
  amount: number,
  description: string,
  supabase: SupabaseClient
): Promise<void> {
  const { data: row } = await supabase
    .from('credits')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (!row) {
    // No credits row yet — create one
    await supabase.from('credits').insert({
      user_id: userId,
      balance: amount,
      updated_at: new Date().toISOString(),
    });
  } else {
    await supabase
      .from('credits')
      .update({ balance: (row.balance as number) + amount, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  }

  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount,
    type: 'bonus',
    description,
  });
}

export async function getOrCreateInviteCode(
  userId: string,
  supabase: SupabaseClient
): Promise<{ code: string; useCount: number; maxUses: number }> {
  // Return existing code if available
  const { data: existing } = await supabase
    .from('invite_codes')
    .select('code, use_count, max_uses')
    .eq('owner_id', userId)
    .maybeSingle();

  if (existing) {
    return { code: existing.code as string, useCount: existing.use_count as number, maxUses: existing.max_uses as number };
  }

  // Generate a unique code
  let code = '';
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateCode();
    const { data: collision } = await supabase
      .from('invite_codes')
      .select('id')
      .eq('code', candidate)
      .maybeSingle();
    if (!collision) { code = candidate; break; }
  }

  const { data: created, error } = await supabase
    .from('invite_codes')
    .insert({ code, owner_id: userId, max_uses: INVITE_CODE_MAX_USES })
    .select('code, use_count, max_uses')
    .single();

  if (error || !created) throw new Error('Failed to create invite code');

  return { code: created.code as string, useCount: created.use_count as number, maxUses: created.max_uses as number };
}

export async function redeemInviteCode(
  code: string,
  newUserId: string,
  supabase: SupabaseClient
): Promise<{ ok: boolean; reason?: string }> {
  const { data: inviteCode } = await supabase
    .from('invite_codes')
    .select('id, owner_id, use_count, max_uses, is_active')
    .eq('code', code.toUpperCase().trim())
    .maybeSingle();

  if (!inviteCode) return { ok: false, reason: 'invalid_code' };
  if (!inviteCode.is_active) return { ok: false, reason: 'code_inactive' };
  if ((inviteCode.use_count as number) >= (inviteCode.max_uses as number)) return { ok: false, reason: 'code_exhausted' };
  if (inviteCode.owner_id === newUserId) return { ok: false, reason: 'own_code' };

  // Check if this new user already redeemed an invite code
  const { data: alreadyUsed } = await supabase
    .from('invite_code_uses')
    .select('id')
    .eq('used_by', newUserId)
    .maybeSingle();

  if (alreadyUsed) return { ok: false, reason: 'already_used' };

  // Record usage
  const { error: useErr } = await supabase.from('invite_code_uses').insert({
    code_id: inviteCode.id,
    used_by: newUserId,
  });

  if (useErr) return { ok: false, reason: 'db_error' };

  // Update use_count and deactivate if exhausted
  const newCount = (inviteCode.use_count as number) + 1;
  await supabase
    .from('invite_codes')
    .update({ use_count: newCount, is_active: newCount < (inviteCode.max_uses as number) })
    .eq('id', inviteCode.id);

  // Grant credits to new user (invitee)
  await addBonusCredits(newUserId, INVITE_INVITEE_BONUS, 'Invite code bonus', supabase);

  // Grant credits to inviter
  await addBonusCredits(inviteCode.owner_id as string, INVITE_INVITER_BONUS, 'Referral bonus', supabase);

  return { ok: true };
}
