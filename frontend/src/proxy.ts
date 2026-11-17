import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/types';

/**
 * Cheap edge gate: visitors without a session cookie never reach /dashboard. Whether the
 * session is still valid is decided by the backend in `requireSession()` (lib/auth/server.ts),
 * which every protected layout and page calls.
 */
export default function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    const signIn = new URL('/auth/sign-in', request.url);
    signIn.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(signIn);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*']
};
