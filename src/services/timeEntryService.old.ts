import api from './api';
import { TimeEntry } from '../types';

// Get user's time entries
export const getMyTimeEntries = async (params?: {
  project?: string;
  startDate?: string;
  endDate?: string;
}): Promise<TimeEntry[]> => {
  const response = await api.get('/time-entries/me', { params });
  return response.data.data;
};

// Get all time entries (admin only)
export const getAllTimeEntries = async (params?: {
  user?: string;
  project?: string;
  startDate?: string;
  endDate?: string;
}): Promise<TimeEntry[]> => {
  const response = await api.get('/time-entries', { params });
  return response.data.data;
};

// Get time entry by ID
export const getTimeEntryById = async (id: string): Promise<TimeEntry> => {
  const response = await api.get(`/time-entries/${id}`);
  return response.data.data;
};

// Create time entry
export const createTimeEntry = async (entryData: any): Promise<TimeEntry> => {
  const response = await api.post('/time-entries', entryData);
  return response.data.data;
};

// Update time entry
export const updateTimeEntry = async (id: string, entryData: any): Promise<TimeEntry> => {
  const response = await api.put(`/time-entries/${id}`, entryData);
  return response.data.data;
};

// Delete time entry
export const deleteTimeEntry = async (id: string): Promise<void> => {
  await api.delete(`/time-entries/${id}`);
};

// Start timer
export const startTimer = async (projectId: string, taskName: string, notes?: string, isBillable?: boolean): Promise<TimeEntry> => {
  const response = await api.post('/time-entries/timer/start', {
    projectId: projectId,  // Firestore版は projectId を期待
    task: taskName,
    date: new Date().toISOString().split('T')[0],
    notes,
    isBillable: isBillable !== undefined ? isBillable : true
  });
  return response.data.data;
};

// Stop timer
export const stopTimer = async (): Promise<TimeEntry> => {
  const response = await api.put('/time-entries/timer/stop');
  return response.data.data;
};