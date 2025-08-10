/**
 * New Auth Service using type-safe API client
 * This replaces the old axios-based implementation
 */

import { apiClient } from '../lib/api-client';
import type { User } from '../types';
import { apiUserToOldUser } from '../utils/typeAdapters';

class AuthService {
  private tokenKey = 'token';
  private userKey = 'user';

  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await apiClient.login({ email, password });
    
    if (!response.token || !response.user) {
      throw new Error('Login failed: No user data received');
    }
    
    this.setToken(response.token);
    const user = apiUserToOldUser(response.user);
    this.setUser(user);
    
    return { user, token: response.token };
  }

  /**
   * Register new user
   */
  async register(name: string, email: string, password: string): Promise<User> {
    const response = await apiClient.register({ name, email, password, role: 'user' } as any);
    
    if (!response.token || !response.user) {
      throw new Error('Registration failed: No user data received');
    }
    
    this.setToken(response.token);
    const user = apiUserToOldUser(response.user);
    this.setUser(user);
    
    return user;
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const apiUser = await apiClient.getMe();
      const user = apiUserToOldUser(apiUser);
      this.setUser(user);
      return user;
    } catch (error) {
      // Token might be invalid
      this.logout();
      throw error;
    }
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    apiClient.setToken(null);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Set token
   */
  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    apiClient.setToken(token);
  }

  /**
   * Get stored user
   */
  getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Set user
   */
  private setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  /**
   * Initialize the service (set token in API client if exists)
   */
  initialize(): void {
    const token = this.getToken();
    if (token) {
      apiClient.setToken(token);
    }
  }
}

// Create singleton instance
const authService = new AuthService();

// Initialize on load
authService.initialize();

export default authService;