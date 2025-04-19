import api from './api';
import { Project } from '../types';

// Get all projects
export const getProjects = async (): Promise<Project[]> => {
  const response = await api.get('/projects');
  return response.data.data;
};

// Get project by ID
export const getProjectById = async (id: string): Promise<Project> => {
  const response = await api.get(`/projects/${id}`);
  return response.data.data;
};

// Create project
export const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
  const response = await api.post('/projects', projectData);
  return response.data.data;
};

// Update project
export const updateProject = async (id: string, projectData: Partial<Project>): Promise<Project> => {
  const response = await api.put(`/projects/${id}`, projectData);
  return response.data.data;
};

// Delete project
export const deleteProject = async (id: string): Promise<void> => {
  await api.delete(`/projects/${id}`);
};

// Add member to project
export const addProjectMember = async (projectId: string, userId: string, role?: string): Promise<Project> => {
  const response = await api.post(`/projects/${projectId}/members`, { user: userId, role });
  return response.data.data;
};

// Remove member from project
export const removeProjectMember = async (projectId: string, userId: string): Promise<Project> => {
  const response = await api.delete(`/projects/${projectId}/members/${userId}`);
  return response.data.data;
};