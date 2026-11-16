-- Atomic credit operations for LLM Conclave.
--
-- Apply in the Supabase SQL Editor (or `supabase db push`) before deploying the
-- matching app changes. The server falls back to compare-and-swap updates when
-- these functions are absent, so deployment order does not break billing.
--
-- SECURITY: these are SECURITY DEFINER functions and must not be callable by
-- anon/authenticated clients. Only the service_role used by the server may
-- execute them; otherwise any logged-in user could drain another user's balance.

-- The base schema's CHECK constraint only allows ('purchase','relay_spend','bonus'),
-- but refunds use 'relay_refund'. Extend it so the atomic refund ledger row is valid.
alter table public.credit_transactions
  drop constraint if exists credit_transactions_type_check;

alter table public.credit_transactions
  add constraint credit_transactions_type_check
  check (type in ('purchase', 'relay_spend', 'bonus', 'relay_refund'));

create or replace function public.deduct_credits_atomic(
  p_user_id uuid,
  p_amount integer,
  p_relay_session_id text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_balance integer;
begin
  if p_amount is null or p_amount <= 0 then
    select c.balance into v_balance from public.credits c where c.user_id = p_user_id;
    return jsonb_build_object('ok', true, 'balance', coalesce(v_balance, 0));
  end if;

  -- Single statement: only succeeds when the balance still covers the cost.
  update public.credits as c
     set balance = c.balance - p_amount,
         updated_at = now()
   where c.user_id = p_user_id
     and c.balance >= p_amount
  returning c.balance into v_balance;

  if v_balance is null then
    select c.balance into v_balance from public.credits c where c.user_id = p_user_id;
    return jsonb_build_object('ok', false, 'balance', coalesce(v_balance, 0));
  end if;

  -- Keep the balance change even if a stale ledger constraint rejects the row
  -- (the server has always treated ledger writes as best-effort).
  begin
    insert into public.credit_transactions
      (user_id, amount, type, description, relay_session_id)
    values
      (p_user_id, -p_amount, 'relay_spend', 'Relay session ' || p_relay_session_id, p_relay_session_id);
  exception
    when check_violation then
      raise warning 'credit_transactions rejected relay_spend row';
    when foreign_key_violation then
      raise warning 'credit_transactions missing reference for user %', p_user_id;
  end;

  return jsonb_build_object('ok', true, 'balance', v_balance);
end;
$$;

create or replace function public.add_credits_atomic(
  p_user_id uuid,
  p_amount integer,
  p_type text,
  p_description text,
  p_relay_session_id text default null,
  p_stripe_payment_intent_id text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_balance integer;
begin
  if p_amount is null or p_amount = 0 then
    select c.balance into v_balance from public.credits c where c.user_id = p_user_id;
  else
    insert into public.credits as c (user_id, balance, updated_at)
    values (p_user_id, p_amount, now())
    on conflict (user_id) do update
      set balance = c.balance + p_amount,
          updated_at = now()
    returning c.balance into v_balance;
  end if;

  begin
    insert into public.credit_transactions
      (user_id, amount, type, description, relay_session_id, stripe_payment_intent_id)
    values
      (p_user_id, p_amount, p_type, p_description, p_relay_session_id, p_stripe_payment_intent_id);
  exception
    when check_violation then
      raise warning 'credit_transactions rejected type %', p_type;
    when foreign_key_violation then
      raise warning 'credit_transactions missing reference for user %', p_user_id;
  end;

  return jsonb_build_object('ok', true, 'balance', coalesce(v_balance, p_amount));
end;
$$;

revoke all on function public.deduct_credits_atomic(uuid, integer, text)
  from public, anon, authenticated;
revoke all on function public.add_credits_atomic(uuid, integer, text, text, text, text)
  from public, anon, authenticated;

grant execute on function public.deduct_credits_atomic(uuid, integer, text)
  to service_role;
grant execute on function public.add_credits_atomic(uuid, integer, text, text, text, text)
  to service_role;
