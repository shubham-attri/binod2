import { ChatResponse, ChatRequest, ApiError, LoginResponse, User, Document, Case, CaseActivity } from './types';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    console.log('API Client: Initializing', { hasToken: !!this.getStoredToken() });
    this.initializeToken();
  }

  private getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('session');
      if (session) {
        try {
          const { access_token } = JSON.parse(session);
          return access_token;
        } catch (e) {
          console.error('Failed to parse session:', e);
        }
      }
    }
    return null;
  }

  private initializeToken() {
    this.token = this.getStoredToken();
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

  async sendMessage(content: string): Promise<ChatResponse> {
    const token = this.getStoredToken();
    console.log('API Client: Sending message', { 
      content, 
      hasToken: !!token,
      tokenValue: token?.substring(0, 10) + '...'
    });
    
    const headers = this.getHeaders();
    const request: ChatRequest = { content };

    const response = await fetch(`${this.baseUrl}/api/v1/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
      credentials: 'include',
    });

    console.log('API Client: Response', { 
      status: response.status,
      url: response.url,
      authHeader: headers['Authorization']?.substring(0, 20) + '...'
    });

    return this.handleResponse<ChatResponse>(response);
  }

  async uploadDocument(
    file: File,
    caseId?: string,
    chatSessionId?: string
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    if (caseId) formData.append('case_id', caseId);
    if (chatSessionId) formData.append('chat_session_id', chatSessionId);

    const response = await fetch(`${this.baseUrl}/documents/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: formData
    });

    return this.handleResponse<Document>(response);
  }

  async getDocument(documentId: string): Promise<Document> {
    const response = await fetch(`${this.baseUrl}/documents/${documentId}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse<Document>(response);
  }

  async listDocuments(caseId?: string, chatSessionId?: string): Promise<Document[]> {
    const params = new URLSearchParams();
    if (caseId) params.append('case_id', caseId);
    if (chatSessionId) params.append('chat_session_id', chatSessionId);

    const response = await fetch(`${this.baseUrl}/documents/list?${params}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse<Document[]>(response);
  }

  async deleteDocument(documentId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/documents/${documentId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    await this.handleResponse<void>(response);
  }

  async createCase(title: string, description: string, metadata?: any): Promise<Case> {
    const response = await fetch(`${this.baseUrl}/cases`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ title, description, metadata })
    });
    return this.handleResponse<Case>(response);
  }

  async getCase(caseId: string): Promise<Case> {
    const response = await fetch(`${this.baseUrl}/cases/${caseId}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse<Case>(response);
  }

  async updateCase(
    caseId: string,
    updates: {
      title?: string;
      description?: string;
      status?: string;
      metadata?: any;
    }
  ): Promise<Case> {
    const response = await fetch(`${this.baseUrl}/cases/${caseId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates)
    });
    return this.handleResponse<Case>(response);
  }

  async listCases(status?: string): Promise<Case[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);

    const response = await fetch(`${this.baseUrl}/cases?${params}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse<Case[]>(response);
  }

  async getCaseActivities(
    caseId: string,
    limit: number = 50,
    beforeId?: string
  ): Promise<CaseActivity[]> {
    const params = new URLSearchParams({
      limit: limit.toString()
    });
    if (beforeId) params.append('before_id', beforeId);

    const response = await fetch(`${this.baseUrl}/cases/${caseId}/activities?${params}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse<CaseActivity[]>(response);
  }

  async archiveCase(caseId: string): Promise<Case> {
    const response = await fetch(`${this.baseUrl}/cases/${caseId}/archive`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return this.handleResponse<Case>(response);
  }
}

export const apiClient = new ApiClient(); 