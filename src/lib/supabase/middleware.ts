import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

interface UpdateSessionOptions {
  setCapacitorCookie?: (response: NextResponse) => void;
}

export async function updateSession(
  request: NextRequest,
  options?: UpdateSessionOptions,
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured, pass through without auth checks
  if (!supabaseUrl || !supabaseKey) {
    const response = NextResponse.next({ request });
    options?.setCapacitorCookie?.(response);
    return response;
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — IMPORTANT: do not write any logic between createServerClient and getUser
  const { data: { user } } = await supabase.auth.getUser();

  // Only protect /account — homepage and all other routes are publicly accessible.
  // The /account page server component handles its own redirect if unauthenticated.
  const { pathname } = request.nextUrl;
  if (!user && pathname.startsWith('/account')) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/signin';
    const response = NextResponse.redirect(url);
    options?.setCapacitorCookie?.(response);
    return response;
  }

  options?.setCapacitorCookie?.(supabaseResponse);
  return supabaseResponse;
}
