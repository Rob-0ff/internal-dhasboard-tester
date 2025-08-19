// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/app/actions'; // Import the decrypt function

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  const loginUrl = new URL('/', request.url);

  // 1. If there's no session cookie, redirect to the login page
  if (!sessionCookie) {
    return NextResponse.redirect(loginUrl);
  }

  // 2. Decrypt the cookie to verify it's a valid session
  const sessionPayload = await decrypt(sessionCookie);

  // 3. If the cookie is invalid or expired, redirect to login
  if (!sessionPayload) {
    return NextResponse.redirect(loginUrl);
  }

  // 4. If the cookie is valid, allow the request to proceed
  return NextResponse.next();
}

// This config specifies which paths the middleware should run on.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (the public login page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|bag-learning-logo.png).+)',
  ],
};