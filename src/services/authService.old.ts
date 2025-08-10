import api from './api';
import { User } from '../types';

// Login user
export const login = async (email: string, password: string): Promise<{ user: User, token: string }> => {
  console.log('🔐 Attempting login with:', { email, password: '***' });
  console.log('📡 API endpoint:', api.defaults.baseURL + '/auth/login');
  
  try {
    const response = await api.post('/auth/login', { email, password });
    console.log('✅ Login response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Login error:', error.response?.data || error.message);
    console.error('❌ Full error:', error);
    throw error;
  }
};

// Register user
export const register = async (userData: { name: string; email: string; password: string }): Promise<{ user: User }> => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// Get current user
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get('/auth/me');
  return response.data.data;
};

// Logout user
export const logout = async (): Promise<void> => {
  await api.get('/auth/logout');
};