/**
 * New Project Service using type-safe API client
 * This replaces the old axios-based implementation
 */

import { apiClient } from '../lib/api-client';
import type {
  Task,
  CreateProjectRequest,
  UpdateProjectRequest
} from '../lib/api-client';
import { apiProjectToOldProject, oldProjectToApiRequest } from '../utils/typeAdapters';
import type { Project as OldProject } from '../types';

class ProjectService {
  /**
   * Get all projects
   */
  async getProjects(): Promise<OldProject[]> {
    const response = await apiClient.getProjects();
    const projects = response.data || [];
    return projects.map(apiProjectToOldProject);
  }

  /**
   * Get a specific project
   */
  async getProject(id: string): Promise<OldProject> {
    const response = await apiClient.getProject(id);
    if (!response.data) {
      throw new Error('Project not found');
    }
    return apiProjectToOldProject(response.data);
  }

  /**
   * Create a new project
   */
  async createProject(data: Partial<OldProject> & { client?: string }): Promise<OldProject> {
    const apiRequest = oldProjectToApiRequest(data);
    const response = await apiClient.createProject({
      ...apiRequest,
      name: apiRequest.name || '',
      client: data.client
    } as CreateProjectRequest);
    
    if (!response.data) {
      throw new Error('Failed to create project');
    }
    return apiProjectToOldProject(response.data);
  }

  /**
   * Update an existing project
   */
  async updateProject(id: string, data: Partial<OldProject> & { client?: string }): Promise<OldProject> {
    const apiRequest = oldProjectToApiRequest(data);
    const response = await apiClient.updateProject(id, {
      ...apiRequest,
      client: data.client
    } as UpdateProjectRequest);
    
    if (!response.data) {
      throw new Error('Failed to update project');
    }
    return apiProjectToOldProject(response.data);
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<void> {
    await apiClient.deleteProject(id);
  }

  /**
   * Get active projects
   */
  async getActiveProjects(): Promise<OldProject[]> {
    const projects = await this.getProjects();
    return projects.filter(project => project.status === 'active');
  }

  /**
   * Get completed projects
   */
  async getCompletedProjects(): Promise<OldProject[]> {
    const projects = await this.getProjects();
    return projects.filter(project => project.status === 'completed');
  }

  /**
   * Get projects by client
   */
  async getProjectsByClient(clientName: string): Promise<OldProject[]> {
    const projects = await this.getProjects();
    return projects.filter(project => {
      const client = typeof project.client === 'string' ? project.client : project.client?.name;
      return client?.toLowerCase().includes(clientName.toLowerCase());
    });
  }

  /**
   * Add a task to a project
   */
  async addTaskToProject(projectId: string, task: {
    name: string;
    description?: string;
    rate?: number;
    isBillable?: boolean;
  }): Promise<OldProject> {
    const project = await this.getProject(projectId);
    const newTask = {
      name: task.name,
      description: task.description,
      rate: task.rate,
      isBillable: task.isBillable ?? true
    };
    const updatedTasks = [...(project.tasks || []), newTask];
    
    return this.updateProject(projectId, {
      tasks: updatedTasks
    });
  }

  /**
   * Remove a task from a project
   */
  async removeTaskFromProject(projectId: string, taskName: string): Promise<OldProject> {
    const project = await this.getProject(projectId);
    const updatedTasks = (project.tasks || []).filter(
      task => task.name !== taskName
    );
    
    return this.updateProject(projectId, {
      tasks: updatedTasks
    });
  }

  /**
   * Update a task in a project
   */
  async updateProjectTask(
    projectId: string,
    taskName: string,
    updates: {
      name?: string;
      description?: string;
      rate?: number;
      isBillable?: boolean;
    }
  ): Promise<OldProject> {
    const project = await this.getProject(projectId);
    const updatedTasks = (project.tasks || []).map(task => {
      if (task.name === taskName) {
        return { ...task, ...updates };
      }
      return task;
    });
    
    return this.updateProject(projectId, {
      tasks: updatedTasks
    });
  }

  /**
   * Get tasks for a project
   */
  async getProjectTasks(projectId: string): Promise<Task[]> {
    const project = await this.getProject(projectId);
    return project.tasks || [];
  }

  /**
   * Calculate project budget usage
   */
  async calculateBudgetUsage(projectId: string): Promise<{
    budget: number;
    spent: number;
    remaining: number;
    percentageUsed: number;
  }> {
    const project = await this.getProject(projectId);
    const budget = project.budget || 0;
    
    // TODO: Calculate actual spent amount from time entries
    const spent = 0; // This would need integration with time entries
    
    const remaining = budget - spent;
    const percentageUsed = budget > 0 ? (spent / budget) * 100 : 0;
    
    return {
      budget,
      spent,
      remaining,
      percentageUsed
    };
  }

  /**
   * Check if project is overdue
   */
  isProjectOverdue(project: OldProject): boolean {
    if (!project.endDate) return false;
    
    const endDate = new Date(project.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return endDate < today && project.status !== 'completed';
  }

  /**
   * Get overdue projects
   */
  async getOverdueProjects(): Promise<OldProject[]> {
    const projects = await this.getProjects();
    return projects.filter(project => this.isProjectOverdue(project));
  }
}

// Create singleton instance
const projectService = new ProjectService();

export default projectService;