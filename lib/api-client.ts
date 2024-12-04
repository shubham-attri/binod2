import { ChatResponse, ChatRequest, ApiError, LoginResponse, User } from './types';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('session');
      if (session) {
        const { access_token } = JSON.parse(session);
        this.token = access_token;
      }
    }
  }

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        this.setToken(null);
        localStorage.removeItem('session');
        window.location.href = '/auth/login';
      }
      const error: ApiError = await response.json();
      throw new Error(error.message || 'An error occurred');
    }
    return response.json();
  }

  private getHeaders(isFormData: boolean = false) {
    const headers: Record<string, string> = {
      'Content-Type': isFormData ? 'application/x-www-form-urlencoded' : 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });

    const data = await this.handleResponse<LoginResponse>(response);
    this.setToken(data.access_token);
    return data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${this.baseUrl}/auth/me`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<User>(response);
  }

  async sendMessage(content: string, onChunk?: (chunk: string) => void): Promise<ChatResponse> {
    const headers = this.getHeaders();
    if (onChunk) {
      headers['Accept'] = 'text/event-stream';
    }

    const request: ChatRequest = {
      content,
      mode: 'research'
    };

    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
      credentials: 'include',
    });

    if (onChunk) {
      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Process complete lines
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const chunk = JSON.parse(data);
              onChunk(chunk.content);
            } catch (e) {
              console.error('Failed to parse chunk:', e);
            }
          }
        }
      }
      
      // Return final message
      return {
        message: {
          role: 'assistant',
          content: '', // Content already streamed
          created_at: new Date().toISOString()
        }
      };
    }

    return this.handleResponse<ChatResponse>(response);
  }
}

export const apiClient = new ApiClient(); 