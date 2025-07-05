import api from './api';
import { Invoice } from '../types';

export const getInvoices = async (): Promise<Invoice[]> => {
  const response = await api.get<Invoice[]>('/invoices');
  return response.data;
};

export const getInvoiceById = async (id: string): Promise<Invoice> => {
  const response = await api.get<Invoice>(`/invoices/${id}`);
  return response.data;
};

export const createInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> => {
  const response = await api.post<Invoice>('/invoices', invoiceData);
  return response.data;
};

export const updateInvoice = async (id: string, invoiceData: Partial<Invoice>): Promise<Invoice> => {
  const response = await api.put<Invoice>(`/invoices/${id}`, invoiceData);
  return response.data;
};

export const deleteInvoice = async (id: string): Promise<void> => {
  await api.delete(`/invoices/${id}`);
};