"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface User {
  id: string;
  email: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting login with:', { email });

      const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: email,
          password: password,
        }).toString()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('auth_token', data.access_token);

      // Get user data
      const userResponse = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${data.access_token}`
        }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);
        router.push('/research');
      } else {
        throw new Error('Failed to get user data');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    router.push('/auth/login');
  };

  // Function to check token validity
  const isTokenValid = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const timeLeft = Number(payload.exp) - currentTime;
      
      console.log('Token validation details:', {
        exp: new Date(Number(payload.exp) * 1000).toISOString(),
        current: new Date(currentTime * 1000).toISOString(),
        timeLeft,
        isValid: timeLeft > 300
      });

      return timeLeft > 300;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  // Function to check auth status
  const checkAuth = async () => {
    console.log('Checking auth status...');
    try {
      const token = localStorage.getItem('auth_token');
      console.log('Stored token exists:', !!token);

      if (!token || !isTokenValid(token)) {
        console.log('No token or invalid token');
        setUser(null);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Auth check response status:', response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log('Auth check user data:', userData);
        setUser(userData);
      } else {
        console.log('Auth check failed, clearing user');
        localStorage.removeItem('auth_token');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    const interval = setInterval(async () => {
      const token = localStorage.getItem('auth_token');
      if (token && !isTokenValid(token)) {
        try {
          const response = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            localStorage.setItem('auth_token', data.access_token);
          } else {
            await signOut();
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          await signOut();
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 