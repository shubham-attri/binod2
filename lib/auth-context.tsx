"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, type User } from './auth';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Handle initial session and navigation
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = auth.getSession();
        console.log('Initial session check:', session);
        
        if (session?.user) {
          console.log('Found existing user:', session.user);
          setUser(session.user);
          
          // Only redirect if we're on an auth page
          if (pathname.startsWith('/auth/')) {
            console.log('On auth page, redirecting to research...');
            setTimeout(() => {
              router.push('/research');
            }, 100);
          }
        } else {
          console.log('No existing session found');
          if (!pathname.startsWith('/auth/')) {
            setTimeout(() => {
              router.push('/auth/login');
            }, 100);
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [pathname]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Starting sign in...');
      setIsLoading(true);
      const session = await auth.signIn(email, password);
      console.log('AuthContext: Sign in successful, session:', session);
      
      if (session?.user) {
        console.log('AuthContext: Setting user and redirecting...');
        setUser(session.user);
        setIsLoading(false);
        
        // Use router.push with a slight delay
        setTimeout(() => {
          router.push('/research');
        }, 100);
      } else {
        console.error('AuthContext: No user in session after login');
        setIsLoading(false);
        throw new Error('Login successful but no user data received');
      }
    } catch (error) {
      console.error('AuthContext: Sign in error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await auth.signOut();
      setUser(null);
      setIsLoading(false);
      router.push('/auth/login');
    } catch (error) {
      console.error('Sign out error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 