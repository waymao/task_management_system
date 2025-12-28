import { apiClient, unwrapResponse } from './client';
import type { Task, CreateTaskInput, UpdateTaskInput, TaskType, TaskStatus, TaskPriority } from '../types';

interface ListTasksParams {
  type?: TaskType;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  limit?: number;
  offset?: number;
}

export const tasksApi = {
  create: async (data: CreateTaskInput): Promise<Task> => {
    const response = await apiClient.post<{ success: true; data: Task }>('/tasks', data);
    return unwrapResponse(response);
  },

  list: async (params?: ListTasksParams): Promise<Task[]> => {
    const response = await apiClient.get<{ success: true; data: Task[] }>('/tasks', { params });
    return unwrapResponse(response);
  },

  getById: async (id: string): Promise<Task> => {
    const response = await apiClient.get<{ success: true; data: Task }>(`/tasks/${id}`);
    return unwrapResponse(response);
  },

  update: async (id: string, data: UpdateTaskInput): Promise<Task> => {
    const response = await apiClient.patch<{ success: true; data: Task }>(`/tasks/${id}`, data);
    return unwrapResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },

  complete: async (id: string): Promise<Task> => {
    const response = await apiClient.patch<{ success: true; data: Task }>(`/tasks/${id}/complete`);
    return unwrapResponse(response);
  },

  cancel: async (id: string): Promise<Task> => {
    const response = await apiClient.patch<{ success: true; data: Task }>(`/tasks/${id}/cancel`);
    return unwrapResponse(response);
  },

  uncomplete: async (id: string): Promise<Task> => {
    const response = await apiClient.patch<{ success: true; data: Task }>(`/tasks/${id}/uncomplete`);
    return unwrapResponse(response);
  },

  listTrash: async (): Promise<Task[]> => {
    const response = await apiClient.get<{ success: true; data: Task[] }>('/tasks/trash/list');
    return unwrapResponse(response);
  },

  restore: async (id: string): Promise<void> => {
    await apiClient.patch(`/tasks/${id}/restore`);
  },

  permanentDelete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}/permanently`);
  },

  listFollowUp: async (startDate: string, endDate: string): Promise<Task[]> => {
    const response = await apiClient.get<{ success: true; data: Task[] }>('/tasks/followup/list', {
      params: { startDate, endDate },
    });
    return unwrapResponse(response);
  },
};
