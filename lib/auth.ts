import { apiClient } from './api-client';

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
      // Initialize session from localStorage if available
      const storedSession = localStorage.getItem('session');
      if (storedSession) {
        try {
          this.session = JSON.parse(storedSession);
          if (this.session?.access_token) {
            apiClient.setToken(this.session.access_token);
          }
        } catch (error) {
          console.error('Error parsing stored session:', error);
          localStorage.removeItem('session');
        }
      }
    }
  }

  async signIn(email: string, password: string): Promise<Session> {
    console.log('AuthService: Starting sign in...');
    const response = await apiClient.login(email, password);
    console.log('AuthService: Login response received:', response);
    
    const user = await apiClient.getCurrentUser();
    console.log('AuthService: User data received:', user);
    
    this.session = {
      access_token: response.access_token,
      user: user,
    };
    
    console.log('AuthService: Session updated:', this.session);
    localStorage.setItem('session', JSON.stringify(this.session));
    
    return this.session;
  }

  async signOut(): Promise<void> {
    this.session = null;
    apiClient.setToken(null);
    localStorage.removeItem('session');
  }

  getSession(): Session | null {
    return this.session;
  }

  isAuthenticated(): boolean {
    return !!this.session?.access_token;
  }
}

export const auth = new AuthService(); 