import api from './api';
import { User } from '../types';

// Login user
export const login = async (email: string, password: string): Promise<{ user: User }> => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
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