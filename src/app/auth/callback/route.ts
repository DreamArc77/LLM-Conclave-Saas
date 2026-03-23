import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { addWelcomeCredits } from '@/lib/credits/deduct';
import { redeemInviteCode } from '@/lib/credits/invite';
import { WELCOME_CREDITS } from '@/config/credit-packages';
import { isSaas } from '@/lib/flags';

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  // Use forwarded host headers to get the real public origin.
  // Railway proxies requests internally on 0.0.0.0:PORT so request.url gives the
  // wrong origin; x-forwarded-host contains the actual public domain.
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  const publicOrigin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : new URL(request.url).origin;

  if (code) {
    const supabase = await createServerClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Grant welcome credits to first-time users in SaaS mode
      if (isSaas && data.user) {
        try {
          const admin = createAdminClient();
          const { data: existing } = await admin
            .from('credits')
            .select('user_id')
            .eq('user_id', data.user.id)
            .single();
          if (!existing) {
            await addWelcomeCredits({ userId: data.user.id, supabase: admin, amount: WELCOME_CREDITS });
            const inviteCode = data.user.user_metadata?.invite_code as string | undefined;
            if (inviteCode) {
              await redeemInviteCode(inviteCode, data.user.id, admin).catch(() => {});
            }
          }
        } catch { /* non-fatal — user can still proceed */ }
      }
      return NextResponse.redirect(`${publicOrigin}${next}`);
    }
  }

  return NextResponse.redirect(`${publicOrigin}/auth/signin?error=auth_callback_error`);
}
