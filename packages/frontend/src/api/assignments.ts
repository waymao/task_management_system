import { apiClient, unwrapResponse } from './client';
import type { Assignment, CreateAssignmentInput, Task } from '../types';

export const assignmentsApi = {
  create: async (data: CreateAssignmentInput): Promise<Assignment> => {
    const response = await apiClient.post<{ success: true; data: Assignment }>('/assignments', data);
    return unwrapResponse(response);
  },

  list: async (params?: { date?: string; startDate?: string; endDate?: string }): Promise<Assignment[]> => {
    const response = await apiClient.get<{ success: true; data: Assignment[] }>('/assignments', { params });
    return unwrapResponse(response);
  },

  getUnassigned: async (): Promise<Task[]> => {
    const response = await apiClient.get<{ success: true; data: Task[] }>('/assignments/unassigned');
    return unwrapResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/assignments/${id}`);
  },
};
