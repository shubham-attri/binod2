"use client";

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { usePathname, useRouter } from 'next/navigation';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log('ProtectedRoute: Current state:', { user, isLoading, pathname });
    
    if (!isLoading) {
      // If no user and not on auth page, redirect to login
      if (!user && !pathname.startsWith('/auth/')) {
        console.log('ProtectedRoute: No user found, redirecting to login...');
        setTimeout(() => {
          router.push('/auth/login');
        }, 100);
      }
      
      // If user exists and on auth page, redirect to research
      if (user && pathname.startsWith('/auth/')) {
        console.log('ProtectedRoute: User found on auth page, redirecting to research...');
        setTimeout(() => {
          router.push('/research');
        }, 100);
      }
    }
  }, [user, isLoading, pathname]);

  // Show loading spinner while checking auth
  if (isLoading) {
    console.log('ProtectedRoute: Showing loading spinner...');
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't show protected content if not authenticated
  if (!user && !pathname.startsWith('/auth/')) {
    console.log('ProtectedRoute: User not authenticated, showing nothing');
    return null;
  }

  console.log('ProtectedRoute: Rendering protected content');
  return <>{children}</>;
} 