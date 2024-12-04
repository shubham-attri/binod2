import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/update-password',
  '/api/v1/auth/login',
  '/api/v1/auth/me',
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  const isPublicRoute = PUBLIC_ROUTES.some(route => req.nextUrl.pathname.startsWith(route));
  const isAuthRoute = req.nextUrl.pathname.startsWith('/auth');
  const isApiRoute = req.nextUrl.pathname.startsWith('/api');

  // Skip API routes except auth endpoints
  if (isApiRoute && !req.nextUrl.pathname.startsWith('/api/v1/auth')) {
    return res;
  }

  // Get token from cookie or authorization header
  const token = req.cookies.get('auth-token')?.value || 
                req.headers.get('authorization')?.split(' ')[1];

  let isAuthenticated = false;
  
  if (token) {
    try {
      // Verify token
      const secret = new TextEncoder().encode(process.env.SECRET_KEY || '09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7');
      await jwtVerify(token, secret);
      isAuthenticated = true;
    } catch (error) {
      console.error('Token verification failed:', error);
      isAuthenticated = false;
    }
  }

  console.log('Middleware: Processing request', {
    path: req.nextUrl.pathname,
    isPublicRoute,
    isAuthRoute,
    isAuthenticated
  });

  // If user is authenticated and tries to access auth routes, redirect to research
  if (isAuthenticated && isAuthRoute) {
    console.log('Middleware: Authenticated user trying to access auth route, redirecting to research');
    return NextResponse.redirect(new URL('/research', req.url));
  }

  // If user is not authenticated and tries to access protected routes, redirect to login
  if (!isAuthenticated && !isPublicRoute) {
    console.log('Middleware: Unauthenticated user trying to access protected route, redirecting to login');
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 