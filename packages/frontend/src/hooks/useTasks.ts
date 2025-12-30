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
    onMutate: async (newTask) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });

      // Snapshot previous value for rollback
      const previousTasks = queryClient.getQueriesData({ queryKey: TASKS_QUERY_KEY });

      // Optimistically update all task queries
      queryClient.setQueriesData({ queryKey: TASKS_QUERY_KEY }, (old: any) => {
        if (!old) return old;

        // Create temporary task object
        const tempTask = {
          id: `temp-${Date.now()}`,
          ...newTask,
          status: 'pending' as const,
          priority: newTask.priority || 'medium' as const,
          userId: 'current-user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return [...old, tempTask];
      });

      return { previousTasks };
    },
    onError: (_err, _newTask, context) => {
      // Rollback to previous state
      if (context?.previousTasks) {
        context.previousTasks.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Task created successfully');
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskInput }) => tasksApi.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      await queryClient.cancelQueries({ queryKey: ['assignments'] });

      // Snapshot previous values for rollback
      const previousTasks = queryClient.getQueriesData({ queryKey: TASKS_QUERY_KEY });
      const previousAssignments = queryClient.getQueriesData({ queryKey: ['assignments'] });

      // Optimistically update all task queries
      queryClient.setQueriesData({ queryKey: TASKS_QUERY_KEY }, (old: any) => {
        if (!old) return old;

        // Handle single task query (returns object)
        if (!Array.isArray(old)) {
          return old.id === id
            ? { ...old, ...data, updatedAt: new Date().toISOString() }
            : old;
        }

        // Handle task list queries (returns array)
        return old.map((task: any) =>
          task.id === id
            ? { ...task, ...data, updatedAt: new Date().toISOString() }
            : task
        );
      });

      // Optimistically update task within assignments
      queryClient.setQueriesData({ queryKey: ['assignments'] }, (old: any) => {
        if (!old) return old;
        if (!Array.isArray(old)) return old;

        return old.map((assignment: any) =>
          assignment.task?.id === id
            ? { ...assignment, task: { ...assignment.task, ...data, updatedAt: new Date().toISOString() } }
            : assignment
        );
      });

      return { previousTasks, previousAssignments };
    },
    onError: (_err, _variables, context) => {
      // Rollback to previous state
      if (context?.previousTasks) {
        context.previousTasks.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      if (context?.previousAssignments) {
        context.previousAssignments.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Task updated successfully');
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });

      // Snapshot previous value for rollback
      const previousTasks = queryClient.getQueriesData({ queryKey: TASKS_QUERY_KEY });

      // Optimistically remove the task from all queries
      queryClient.setQueriesData({ queryKey: TASKS_QUERY_KEY }, (old: any) => {
        if (!old) return old;
        return old.filter((task: any) => task.id !== id);
      });

      return { previousTasks };
    },
    onError: (_err, _id, context) => {
      // Rollback to previous state
      if (context?.previousTasks) {
        context.previousTasks.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Task deleted successfully');
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.complete(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      await queryClient.cancelQueries({ queryKey: ['assignments'] });

      // Snapshot previous values for rollback
      const previousTasks = queryClient.getQueriesData({ queryKey: TASKS_QUERY_KEY });
      const previousAssignments = queryClient.getQueriesData({ queryKey: ['assignments'] });

      // Optimistically update task status to completed
      queryClient.setQueriesData({ queryKey: TASKS_QUERY_KEY }, (old: any) => {
        if (!old) return old;

        // Handle single task query (returns object)
        if (!Array.isArray(old)) {
          return old.id === id
            ? { ...old, status: 'completed', updatedAt: new Date().toISOString() }
            : old;
        }

        // Handle task list queries (returns array)
        return old.map((task: any) =>
          task.id === id
            ? { ...task, status: 'completed', updatedAt: new Date().toISOString() }
            : task
        );
      });

      // Optimistically update task within assignments
      queryClient.setQueriesData({ queryKey: ['assignments'] }, (old: any) => {
        if (!old) return old;
        if (!Array.isArray(old)) return old;

        return old.map((assignment: any) =>
          assignment.task?.id === id
            ? { ...assignment, task: { ...assignment.task, status: 'completed', updatedAt: new Date().toISOString() } }
            : assignment
        );
      });

      return { previousTasks, previousAssignments };
    },
    onError: (_err, _id, context) => {
      // Rollback to previous state
      if (context?.previousTasks) {
        context.previousTasks.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      if (context?.previousAssignments) {
        context.previousAssignments.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
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
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      await queryClient.cancelQueries({ queryKey: ['assignments'] });

      // Snapshot previous values for rollback
      const previousTasks = queryClient.getQueriesData({ queryKey: TASKS_QUERY_KEY });
      const previousAssignments = queryClient.getQueriesData({ queryKey: ['assignments'] });

      // Optimistically update task status to pending
      queryClient.setQueriesData({ queryKey: TASKS_QUERY_KEY }, (old: any) => {
        if (!old) return old;

        // Handle single task query (returns object)
        if (!Array.isArray(old)) {
          return old.id === id
            ? { ...old, status: 'pending', updatedAt: new Date().toISOString() }
            : old;
        }

        // Handle task list queries (returns array)
        return old.map((task: any) =>
          task.id === id
            ? { ...task, status: 'pending', updatedAt: new Date().toISOString() }
            : task
        );
      });

      // Optimistically update task within assignments
      queryClient.setQueriesData({ queryKey: ['assignments'] }, (old: any) => {
        if (!old) return old;
        if (!Array.isArray(old)) return old;

        return old.map((assignment: any) =>
          assignment.task?.id === id
            ? { ...assignment, task: { ...assignment.task, status: 'pending', updatedAt: new Date().toISOString() } }
            : assignment
        );
      });

      return { previousTasks, previousAssignments };
    },
    onError: (_err, _id, context) => {
      // Rollback to previous state
      if (context?.previousTasks) {
        context.previousTasks.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      if (context?.previousAssignments) {
        context.previousAssignments.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
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
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks', 'trash'] });

      // Snapshot previous value for rollback
      const previousTrash = queryClient.getQueriesData({ queryKey: ['tasks', 'trash'] });

      // Optimistically remove from trash
      queryClient.setQueriesData({ queryKey: ['tasks', 'trash'] }, (old: any) => {
        if (!old) return old;
        return old.filter((task: any) => task.id !== id);
      });

      return { previousTrash };
    },
    onError: (_err, _id, context) => {
      // Rollback to previous state
      if (context?.previousTrash) {
        context.previousTrash.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
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
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks', 'trash'] });

      // Snapshot previous value for rollback
      const previousTrash = queryClient.getQueriesData({ queryKey: ['tasks', 'trash'] });

      // Optimistically remove from trash
      queryClient.setQueriesData({ queryKey: ['tasks', 'trash'] }, (old: any) => {
        if (!old) return old;
        return old.filter((task: any) => task.id !== id);
      });

      return { previousTrash };
    },
    onError: (_err, _id, context) => {
      // Rollback to previous state
      if (context?.previousTrash) {
        context.previousTrash.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
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
