import { apiClient } from './api-client';
import Cookies from 'js-cookie';

export interface User {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
}

export interface Session {
  user: User | null;
  access_token: string | null;
}

class AuthService {
  private session: Session | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const storedSession = localStorage.getItem('session');
      if (storedSession) {
        try {
          this.session = JSON.parse(storedSession);
          if (this.session?.access_token) {
            apiClient.setToken(this.session.access_token);
            // Set token in cookie for middleware
            Cookies.set('auth-token', this.session.access_token, { 
              secure: true,
              sameSite: 'lax'
            });
          }
        } catch (error) {
          console.error('Error parsing stored session:', error);
          this.clearSession();
        }
      }
    }
  }

  async signIn(email: string, password: string): Promise<Session> {
    try {
      // Clear any existing session
      this.clearSession();
      
      // Login and get access token
      const response = await apiClient.login(email, password);
      
      // Get user details
      const user = await apiClient.getCurrentUser();
      
      // Create and store new session
      this.session = {
        access_token: response.access_token,
        user: user,
      };
      
      this.persistSession();
      return this.session;
    } catch (error) {
      this.clearSession();
      throw error;
    }
  }

  async signOut(): Promise<void> {
    this.clearSession();
  }

  getSession(): Session | null {
    return this.session;
  }

  isAuthenticated(): boolean {
    return !!this.session?.access_token && !!this.session?.user;
  }

  private clearSession() {
    this.session = null;
    apiClient.setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('session');
      Cookies.remove('auth-token');
    }
  }

  private persistSession() {
    if (this.session && typeof window !== 'undefined') {
      localStorage.setItem('session', JSON.stringify(this.session));
      apiClient.setToken(this.session.access_token);
      // Set token in cookie for middleware
      if (this.session.access_token) {
        Cookies.set('auth-token', this.session.access_token, { 
          secure: true,
          sameSite: 'lax'
        });
      }
    }
  }
}

export const auth = new AuthService(); 