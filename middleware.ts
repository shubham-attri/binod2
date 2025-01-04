import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Add buffer time for token expiration (5 minutes)
const TOKEN_EXPIRY_BUFFER = 5 * 60; // seconds

const verifyToken = async (token: string) => {
  try {
    const secret = new TextEncoder().encode(process.env.SECRET_KEY!);
    const { payload } = await jwtVerify(token, secret);
    
    // Check if token will expire soon
    const currentTime = Math.floor(Date.now() / 1000);
    const expTime = Number(payload.exp);
    
    // Debug log
    console.log('Token times:', {
      currentTime: new Date(currentTime * 1000).toISOString(),
      expirationTime: new Date(expTime * 1000).toISOString(),
      timeLeft: expTime - currentTime,
      bufferTime: TOKEN_EXPIRY_BUFFER
    });

    // Validate expiration with buffer
    if (expTime - currentTime < TOKEN_EXPIRY_BUFFER) {
      console.log('Token will expire soon or has expired');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
};

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
  let res = NextResponse.next();
  
  const isPublicRoute = PUBLIC_ROUTES.some(route => req.nextUrl.pathname.startsWith(route));
  const isAuthRoute = req.nextUrl.pathname.startsWith('/auth');
  const isApiRoute = req.nextUrl.pathname.startsWith('/api');

  // Skip API routes except auth endpoints
  if (isApiRoute && !req.nextUrl.pathname.startsWith('/api/v1/auth')) {
    return res;
  }

  // Get token from both cookie and localStorage
  const token = req.cookies.get('auth-token')?.value || 
                (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);

  let isAuthenticated = false;
  
  if (token) {
    try {
      const isValid = await verifyToken(token);
      
      if (!isValid) {
        console.log('Middleware: Clearing invalid token');
        res = NextResponse.next();
        res.cookies.delete('auth-token');
        return res;
      }
      
      isAuthenticated = true;
      
      // Store token in cookie if it came from localStorage
      if (!req.cookies.get('auth-token')) {
        res.cookies.set('auth-token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/'
        });
      }
    } catch (error) {
      console.error('Middleware: Token verification failed:', error);
      isAuthenticated = false;
    }
  }

  // If user is authenticated and tries to access auth routes, redirect to research
  if (isAuthenticated && isAuthRoute) {
    console.log('Middleware: Redirecting authenticated user from auth to research');
    return NextResponse.redirect(new URL('/research', req.url));
  }

  // If user is not authenticated and tries to access protected routes, redirect to login
  if (!isAuthenticated && !isPublicRoute) {
    console.log('Middleware: Redirecting unauthenticated user to login');
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