/**
 * New Time Entry Service using type-safe API client
 * This replaces the old axios-based implementation
 */

import { apiClient } from '../lib/api-client';
import type {
  CreateTimeEntryRequest,
  UpdateTimeEntryRequest
} from '../lib/api-client';
import { apiTimeEntryToOldTimeEntry, oldTimeEntryToApiRequest } from '../utils/typeAdapters';
import type { TimeEntry as OldTimeEntry } from '../types';

class TimeEntryService {
  /**
   * Get all time entries for current user
   */
  async getMyTimeEntries(params?: {
    project?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<OldTimeEntry[]> {
    const response = await apiClient.getMyTimeEntries(params);
    const entries = response.data || [];
    return entries.map(apiTimeEntryToOldTimeEntry);
  }

  /**
   * Get all time entries (admin only)
   */
  async getAllTimeEntries(params?: {
    user?: string;
    project?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<OldTimeEntry[]> {
    const response = await apiClient.getTimeEntries(params);
    const entries = response.data || [];
    return entries.map(apiTimeEntryToOldTimeEntry);
  }

  /**
   * Get a specific time entry
   */
  async getTimeEntry(id: string): Promise<OldTimeEntry> {
    const response = await apiClient.getTimeEntry(id);
    if (!response.data) {
      throw new Error('Time entry not found');
    }
    return apiTimeEntryToOldTimeEntry(response.data);
  }

  /**
   * Create a new time entry
   */
  async createTimeEntry(data: Partial<OldTimeEntry>): Promise<OldTimeEntry> {
    const apiRequest = oldTimeEntryToApiRequest(data);
    const response = await apiClient.createTimeEntry(apiRequest as CreateTimeEntryRequest);
    
    if (!response.data) {
      throw new Error('Failed to create time entry');
    }
    return apiTimeEntryToOldTimeEntry(response.data);
  }

  /**
   * Update an existing time entry
   */
  async updateTimeEntry(id: string, data: Partial<OldTimeEntry>): Promise<OldTimeEntry> {
    const apiRequest = oldTimeEntryToApiRequest(data);
    const response = await apiClient.updateTimeEntry(id, apiRequest as UpdateTimeEntryRequest);
    
    if (!response.data) {
      throw new Error('Failed to update time entry');
    }
    return apiTimeEntryToOldTimeEntry(response.data);
  }

  /**
   * Delete a time entry
   */
  async deleteTimeEntry(id: string): Promise<void> {
    await apiClient.deleteTimeEntry(id);
  }

  /**
   * Start a timer
   */
  async startTimer(
    projectId: string,
    task: string,
    notes?: string,
    isBillable: boolean = true
  ): Promise<OldTimeEntry> {
    const response = await apiClient.startTimer({
      projectId,
      task,
      taskId: task, // For compatibility
      notes,
      isBillable
    });
    
    if (!response.data) {
      throw new Error('Failed to start timer');
    }
    return apiTimeEntryToOldTimeEntry(response.data);
  }

  /**
   * Stop the current timer
   */
  async stopTimer(notes?: string): Promise<OldTimeEntry> {
    const response = await apiClient.stopTimer(notes);
    
    if (!response.data) {
      throw new Error('Failed to stop timer');
    }
    return apiTimeEntryToOldTimeEntry(response.data);
  }

  /**
   * Get entries for a specific date range
   */
  async getEntriesForDateRange(startDate: string, endDate: string): Promise<OldTimeEntry[]> {
    const response = await apiClient.getMyTimeEntries({ startDate, endDate });
    const entries = response.data || [];
    return entries.map(apiTimeEntryToOldTimeEntry);
  }

  /**
   * Get entries for a specific project
   */
  async getEntriesForProject(projectId: string): Promise<OldTimeEntry[]> {
    const response = await apiClient.getMyTimeEntries({ project: projectId });
    const entries = response.data || [];
    return entries.map(apiTimeEntryToOldTimeEntry);
  }

  /**
   * Get today's entries
   */
  async getTodayEntries(): Promise<OldTimeEntry[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getEntriesForDateRange(today, today);
  }

  /**
   * Get this week's entries
   */
  async getWeekEntries(): Promise<OldTimeEntry[]> {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() - dayOfWeek);
    const lastDay = new Date(today);
    lastDay.setDate(today.getDate() - dayOfWeek + 6);
    
    const startDate = firstDay.toISOString().split('T')[0];
    const endDate = lastDay.toISOString().split('T')[0];
    
    return this.getEntriesForDateRange(startDate, endDate);
  }

  /**
   * Get this month's entries
   */
  async getMonthEntries(): Promise<OldTimeEntry[]> {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const startDate = firstDay.toISOString().split('T')[0];
    const endDate = lastDay.toISOString().split('T')[0];
    
    return this.getEntriesForDateRange(startDate, endDate);
  }

  /**
   * Calculate total hours from entries
   */
  calculateTotalHours(entries: OldTimeEntry[]): number {
    return entries.reduce((total, entry) => {
      if (entry.hours) {
        return total + entry.hours;
      }
      if (entry.duration) {
        return total + (entry.duration / 3600);
      }
      return total;
    }, 0);
  }

  /**
   * Calculate total billable hours from entries
   */
  calculateBillableHours(entries: OldTimeEntry[]): number {
    return entries
      .filter(entry => entry.isBillable)
      .reduce((total, entry) => {
        if (entry.hours) {
          return total + entry.hours;
        }
        if (entry.duration) {
          return total + (entry.duration / 3600);
        }
        return total;
      }, 0);
  }
}

// Create singleton instance
const timeEntryService = new TimeEntryService();

export default timeEntryService;