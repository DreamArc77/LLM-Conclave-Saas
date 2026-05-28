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

  if (process.env.SAAS_MODE !== 'true') {
    const response = NextResponse.next();
    setCapacitorCookie(response);
    return response;
  }

  return await updateSession(request, { setCapacitorCookie });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
