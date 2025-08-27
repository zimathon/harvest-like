import type { components } from '../types/api.generated';

// Extract types from generated schemas
export type User = components['schemas']['User'];
export type Project = components['schemas']['Project'];
export type TimeEntry = components['schemas']['TimeEntry'];
export type CreateUserRequest = components['schemas']['CreateUserRequest'];
export type UserResponse = components['schemas']['UserResponse'];
export type UsersResponse = components['schemas']['UsersResponse'];
export type Task = components['schemas']['Task'];
export type RegisterRequest = components['schemas']['RegisterRequest'];
export type LoginRequest = components['schemas']['LoginRequest'];
export type AuthResponse = components['schemas']['AuthResponse'];
export type CreateTimeEntryRequest = components['schemas']['CreateTimeEntryRequest'];
export type UpdateTimeEntryRequest = components['schemas']['UpdateTimeEntryRequest'];
export type StartTimerRequest = components['schemas']['StartTimerRequest'];
export type CreateProjectRequest = components['schemas']['CreateProjectRequest'];
export type UpdateProjectRequest = components['schemas']['UpdateProjectRequest'];
export type TimeEntriesResponse = components['schemas']['TimeEntriesResponse'];
export type TimeEntryResponse = components['schemas']['TimeEntryResponse'];
export type ProjectsResponse = components['schemas']['ProjectsResponse'];
export type ProjectResponse = components['schemas']['ProjectResponse'];

// API Client configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v2';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | undefined>;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Try to get token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    }
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', headers = {}, body, params } = options;

    // Build query string from params
    let url = `${this.baseURL}${endpoint}`;
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    // Build headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add authorization header if token exists
    if (this.token) {
      requestHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || error.error || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: data,
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: data,
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  logout() {
    this.setToken(null);
  }
  
  // User management endpoints
  async getUsers(): Promise<UsersResponse> {
    return this.request<UsersResponse>('/users');
  }
  
  async createUser(data: CreateUserRequest): Promise<UserResponse> {
    return this.request<UserResponse>('/users', {
      method: 'POST',
      body: data,
    });
  }

  // Time entries endpoints
  async getTimeEntries(params?: {
    user?: string;
    project?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<TimeEntriesResponse> {
    return this.request<TimeEntriesResponse>('/time-entries', { params });
  }

  async getMyTimeEntries(params?: {
    project?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<TimeEntriesResponse> {
    return this.request<TimeEntriesResponse>('/time-entries/me', { params });
  }

  async getTimeEntry(id: string): Promise<TimeEntryResponse> {
    return this.request<TimeEntryResponse>(`/time-entries/${id}`);
  }

  async createTimeEntry(data: CreateTimeEntryRequest): Promise<TimeEntryResponse> {
    return this.request<TimeEntryResponse>('/time-entries', {
      method: 'POST',
      body: data,
    });
  }

  async updateTimeEntry(id: string, data: UpdateTimeEntryRequest): Promise<TimeEntryResponse> {
    return this.request<TimeEntryResponse>(`/time-entries/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteTimeEntry(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/time-entries/${id}`, {
      method: 'DELETE',
    });
  }

  async startTimer(data: StartTimerRequest): Promise<TimeEntryResponse> {
    return this.request<TimeEntryResponse>('/time-entries/timer/start', {
      method: 'POST',
      body: data,
    });
  }

  async stopTimer(notes?: string): Promise<TimeEntryResponse> {
    return this.request<TimeEntryResponse>('/time-entries/timer/stop', {
      method: 'PUT',
      body: notes ? { notes } : undefined,
    });
  }

  async resumeTimer(id: string): Promise<TimeEntryResponse> {
    return this.request<TimeEntryResponse>(`/time-entries/${id}/timer/resume`, {
      method: 'PUT',
    });
  }

  // Projects endpoints
  async getProjects(): Promise<ProjectsResponse> {
    return this.request<ProjectsResponse>('/projects');
  }

  async getProject(id: string): Promise<ProjectResponse> {
    return this.request<ProjectResponse>(`/projects/${id}`);
  }

  async createProject(data: CreateProjectRequest): Promise<ProjectResponse> {
    return this.request<ProjectResponse>('/projects', {
      method: 'POST',
      body: data,
    });
  }

  async updateProject(id: string, data: UpdateProjectRequest): Promise<ProjectResponse> {
    return this.request<ProjectResponse>(`/projects/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteProject(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export the class for testing or creating custom instances
export { ApiClient };