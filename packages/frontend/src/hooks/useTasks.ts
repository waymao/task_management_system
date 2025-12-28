import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks';
import type { CreateTaskInput, UpdateTaskInput, TaskType, TaskStatus } from '../types';
import toast from 'react-hot-toast';

const TASKS_QUERY_KEY = ['tasks'];

interface UseTasksParams {
  type?: TaskType;
  status?: TaskStatus;
}

export function useTasks(params?: UseTasksParams) {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, params],
    queryFn: () => tasksApi.list(params),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, id],
    queryFn: () => tasksApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskInput) => tasksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      toast.success('Task created successfully');
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskInput }) => tasksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      toast.success('Task updated successfully');
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      toast.success('Task deleted successfully');
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Task completed');
    },
  });
}

export function useUncompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.uncomplete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Task marked as pending');
    },
  });
}

export function useTrashTasks() {
  return useQuery({
    queryKey: ['tasks', 'trash'],
    queryFn: () => tasksApi.listTrash(),
  });
}

export function useRestoreTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'trash'] });
      toast.success('Task restored successfully');
    },
  });
}

export function usePermanentDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.permanentDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'trash'] });
      toast.success('Task permanently deleted');
    },
  });
}

interface UseFollowUpTasksParams {
  startDate: string;
  endDate: string;
}

export function useFollowUpTasks(params: UseFollowUpTasksParams) {
  return useQuery({
    queryKey: ['tasks', 'followup', params],
    queryFn: () => tasksApi.listFollowUp(params.startDate, params.endDate),
  });
}
