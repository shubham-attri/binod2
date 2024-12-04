"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, type User } from './auth';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Handle initial session check
  useEffect(() => {
    const session = auth.getSession();
    if (session?.user) {
      setUser(session.user);
      if (pathname.startsWith('/auth/')) {
        router.push('/research');
      }
    }
  }, [pathname, router]);

  const signIn = async (email: string, password: string) => {
    try {
      const session = await auth.signIn(email, password);
      if (session?.user) {
        setUser(session.user);
        await router.push('/research');
      } else {
        throw new Error('Login successful but no user data received');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      setUser(null);
      await router.push('/auth/login');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const value = {
    user,
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