import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const ua = request.headers.get('user-agent') || '';
  const isCapacitor = ua.includes('LLMConclaveCapacitor');

  const setCapacitorCookie = (response: NextResponse) => {
    if (isCapacitor) {
      response.cookies.set('capacitor', '1', {
        httpOnly: false,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      });
    }
  };

  const { pathname } = request.nextUrl;

  // Open-source mode has no accounts: the console always owns the root URL.
  // The console physically lives at /app, so "/" rewrites to it.
  if (process.env.SAAS_MODE !== 'true') {
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/app';
      const response = NextResponse.rewrite(url);
      setCapacitorCookie(response);
      return response;
    }
    const response = NextResponse.next();
    setCapacitorCookie(response);
    return response;
  }

  const { response, user } = await updateSession(request, { setCapacitorCookie });

  // Root URL split. The console physically lives at /app; "/" rewrites to it for
  // everyone while MARKETING_HOME is off (today's behavior), and only for
  // logged-in users and Capacitor webviews once the flag is on — anonymous
  // visitors then get the marketing homepage.
  if (pathname === '/' && (process.env.MARKETING_HOME !== 'true' || isCapacitor || user)) {
    const url = request.nextUrl.clone();
    url.pathname = '/app';
    const rewrite = NextResponse.rewrite(url);
    // Carry session-refresh and capacitor cookies set by updateSession.
    response.cookies.getAll().forEach((cookie) => rewrite.cookies.set(cookie));
    return rewrite;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml, llms.txt, opengraph-image
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|llms.txt|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
