"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, type User } from './auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isDevelopment = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing session
    const session = auth.getSession();
    if (session?.user) {
      setUser(session.user);
      router.push('/');
    }
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Starting sign in...');
      setIsLoading(true);
      const session = await auth.signIn(email, password);
      console.log('AuthContext: Sign in successful, session:', session);
      
      if (session?.user) {
        setUser(session.user);
        console.log('AuthContext: User set, redirecting...');
        router.push('/');
      } else {
        console.error('AuthContext: No user in session after login');
        throw new Error('Login successful but no user data received');
      }
    } catch (error) {
      console.error('AuthContext: Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      setUser(null);
      router.push('/auth/login');
    } catch (error) {
      console.error('Sign out error:', error);
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