import api from './api';
import { Client } from '../types';

// Get all clients
export const getClients = async (params?: { status?: string }): Promise<Client[]> => {
  const response = await api.get('/clients', { params });
  return response.data.data;
};

// Get client by ID
export const getClientById = async (id: string): Promise<Client> => {
  const response = await api.get(`/clients/${id}`);
  return response.data.data;
};

// Create client
export const createClient = async (clientData: Omit<Client, 'id' | 'createdAt'>): Promise<Client> => {
  const response = await api.post('/clients', clientData);
  return response.data.data;
};

// Update client
export const updateClient = async (id: string, clientData: Partial<Client>): Promise<Client> => {
  const response = await api.put(`/clients/${id}`, clientData);
  return response.data.data;
};

// Delete client
export const deleteClient = async (id: string): Promise<void> => {
  await api.delete(`/clients/${id}`);
};