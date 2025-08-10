/**
 * Type adapters for bridging old types with new API types
 */

import type { User as ApiUser, Project as ApiProject, TimeEntry as ApiTimeEntry } from '../lib/api-client';
import type { User as OldUser, Project as OldProject, TimeEntry as OldTimeEntry } from '../types';

/**
 * Convert API User to old User type
 */
export function apiUserToOldUser(apiUser: ApiUser): OldUser {
  return {
    id: apiUser.id || apiUser._id || '',
    name: apiUser.name || '',
    email: apiUser.email || '',
    role: (apiUser.role === 'admin') 
      ? 'admin' as const
      : 'member' as const,
    avatar: undefined,
    createdAt: apiUser.createdAt || new Date().toISOString()
  };
}

/**
 * Convert API Project to old Project type
 */
export function apiProjectToOldProject(apiProject: ApiProject): OldProject {
  return {
    id: apiProject.id || apiProject._id || '',
    _id: apiProject.id || apiProject._id || '',
    name: apiProject.name || '',
    description: apiProject.description || '',
    client: apiProject.client || '',
    clientName: apiProject.clientName || apiProject.client || '', // Use clientName from API if available
    status: (apiProject.status || 'active') as 'active' | 'completed' | 'archived' | 'on hold',
    startDate: apiProject.startDate || '',
    endDate: apiProject.endDate || '',
    budget: apiProject.budget || 0,
    budgetType: 'fixed' as 'hourly' | 'fixed', // Default to fixed
    hourlyRate: apiProject.hourlyRate || 0,
    tasks: apiProject.tasks?.map(task => ({
      id: task.id || task._id || '',
      _id: task.id || task._id || '',
      name: task.name || '',
      description: task.description || '',
      rate: task.rate || 0,
      isBillable: task.isBillable ?? true
    })) || [],
    members: apiProject.members?.map(member => ({
      user: member.user || '',
      role: member.role || 'member'
    })) || [],
    userId: apiProject.userId || '',
    createdAt: apiProject.createdAt || new Date().toISOString(),
    updatedAt: apiProject.updatedAt || new Date().toISOString()
  };
}

/**
 * Convert API TimeEntry to old TimeEntry type
 */
export function apiTimeEntryToOldTimeEntry(apiEntry: ApiTimeEntry): OldTimeEntry {
  return {
    id: apiEntry.id || apiEntry._id || '',
    _id: apiEntry.id || apiEntry._id || '',
    userId: apiEntry.userId || '',
    user: apiEntry.user ? apiUserToOldUser(apiEntry.user) : undefined,
    projectId: apiEntry.projectId || '',
    project: apiEntry.project ? apiProjectToOldProject(apiEntry.project) : undefined,
    projectName: apiEntry.projectName || apiEntry.project?.name || '',
    task: apiEntry.task || '',
    taskId: apiEntry.taskId || '',
    date: apiEntry.date || new Date().toISOString().split('T')[0],
    startTime: apiEntry.startTime ? String(apiEntry.startTime) : undefined,
    endTime: apiEntry.endTime ? String(apiEntry.endTime) : undefined,
    duration: apiEntry.duration || 0,
    hours: apiEntry.hours || 0,
    notes: apiEntry.notes || apiEntry.description || '',
    description: apiEntry.description || apiEntry.notes || '',
    isBillable: apiEntry.isBillable ?? true,
    isRunning: apiEntry.isRunning || false,
    createdAt: apiEntry.createdAt ? String(apiEntry.createdAt) : undefined,
    updatedAt: apiEntry.updatedAt ? String(apiEntry.updatedAt) : undefined
  };
}

/**
 * Convert old Project to API create request
 */
export function oldProjectToApiRequest(oldProject: Partial<OldProject>) {
  return {
    name: oldProject.name,
    description: oldProject.description,
    client: oldProject.client || oldProject.clientName,
    status: oldProject.status === 'archived' || oldProject.status === 'on hold' 
      ? 'on-hold' as const 
      : oldProject.status as 'active' | 'completed' | 'on-hold' | undefined,
    startDate: oldProject.startDate,
    endDate: oldProject.endDate,
    budget: oldProject.budget,
    hourlyRate: oldProject.hourlyRate,
    tasks: oldProject.tasks?.map(task => ({
      name: task.name,
      description: task.description,
      rate: task.rate,
      isBillable: task.isBillable
    }))
  };
}

/**
 * Convert old TimeEntry to API create request
 */
export function oldTimeEntryToApiRequest(oldEntry: Partial<OldTimeEntry>) {
  return {
    projectId: oldEntry.projectId || '',
    task: oldEntry.task || '',
    date: oldEntry.date || new Date().toISOString().split('T')[0],
    hours: oldEntry.hours || (oldEntry.duration ? (oldEntry.duration / 3600) : 0),
    description: oldEntry.description || oldEntry.notes,
    notes: oldEntry.notes || oldEntry.description,
    isBillable: oldEntry.isBillable
  };
}