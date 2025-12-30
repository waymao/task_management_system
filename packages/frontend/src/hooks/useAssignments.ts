import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentsApi } from '../api/assignments';
import type { CreateAssignmentInput, Task } from '../types';
import toast from 'react-hot-toast';

const ASSIGNMENTS_QUERY_KEY = ['assignments'];
const UNASSIGNED_QUERY_KEY = ['assignments', 'unassigned'];

interface UseAssignmentsParams {
  date?: string;
  startDate?: string;
  endDate?: string;
}

export function useAssignments(params?: UseAssignmentsParams) {
  return useQuery({
    queryKey: [...ASSIGNMENTS_QUERY_KEY, params],
    queryFn: () => assignmentsApi.list(params),
  });
}

export function useUnassignedTasks() {
  return useQuery({
    queryKey: UNASSIGNED_QUERY_KEY,
    queryFn: () => assignmentsApi.getUnassigned(),
  });
}

interface MutationOptions {
  showToast?: boolean;
  successMessage?: string;
}

export function useCreateAssignment(options?: MutationOptions) {
  const queryClient = useQueryClient();
  const { showToast = true, successMessage = 'Task assigned successfully' } = options || {};

  return useMutation({
    mutationFn: (data: CreateAssignmentInput) => assignmentsApi.create(data),
    onMutate: async (newAssignment) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ASSIGNMENTS_QUERY_KEY });
      await queryClient.cancelQueries({ queryKey: UNASSIGNED_QUERY_KEY });

      // Snapshot previous values for rollback
      const previousAssignments = queryClient.getQueriesData({ queryKey: ASSIGNMENTS_QUERY_KEY });
      const previousUnassigned = queryClient.getQueriesData({ queryKey: UNASSIGNED_QUERY_KEY });

      // Find the task from unassigned or existing assignments to get full task data
      let taskData: Task | null = null;
      const unassignedData = queryClient.getQueryData(UNASSIGNED_QUERY_KEY) as Task[] | undefined;
      if (unassignedData) {
        taskData = unassignedData.find((t: Task) => t.id === newAssignment.taskId) || null;
      }

      // If not in unassigned, check existing assignments (for reschedule case)
      if (!taskData) {
        const allAssignments = queryClient.getQueriesData({ queryKey: ASSIGNMENTS_QUERY_KEY });
        for (const [, data] of allAssignments) {
          if (data) {
            const assignment = (data as any[]).find((a: any) => a.taskId === newAssignment.taskId);
            if (assignment?.task) {
              taskData = assignment.task;
              break;
            }
          }
        }
      }

      // Optimistically add the assignment to all queries
      queryClient.setQueriesData({ queryKey: ASSIGNMENTS_QUERY_KEY }, (old: any) => {
        if (!old) return old;

        // Create temporary assignment object with full task data
        const tempAssignment = {
          id: `temp-${Date.now()}`,
          taskId: newAssignment.taskId,
          date: newAssignment.date,
          slot: newAssignment.slot,
          userId: 'current-user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          task: taskData,  // Include full task data
        };

        return [...old, tempAssignment];
      });

      // Optimistically remove task from unassigned
      queryClient.setQueriesData({ queryKey: UNASSIGNED_QUERY_KEY }, (old: any) => {
        if (!old) return old;
        return old.filter((task: any) => task.id !== newAssignment.taskId);
      });

      return { previousAssignments, previousUnassigned };
    },
    onError: (_err, _newAssignment, context) => {
      // Rollback to previous state
      if (context?.previousAssignments) {
        context.previousAssignments.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      if (context?.previousUnassigned) {
        context.previousUnassigned.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNASSIGNED_QUERY_KEY });
      if (showToast) {
        toast.success(successMessage);
      }
    },
  });
}

export function useDeleteAssignment(options?: MutationOptions) {
  const queryClient = useQueryClient();
  const { showToast = true, successMessage = 'Assignment removed' } = options || {};

  return useMutation({
    mutationFn: (id: string) => assignmentsApi.delete(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ASSIGNMENTS_QUERY_KEY });
      await queryClient.cancelQueries({ queryKey: UNASSIGNED_QUERY_KEY });

      // Snapshot previous values for rollback
      const previousAssignments = queryClient.getQueriesData({ queryKey: ASSIGNMENTS_QUERY_KEY });
      const previousUnassigned = queryClient.getQueriesData({ queryKey: UNASSIGNED_QUERY_KEY });

      // Find the assignment being deleted to get the task
      let deletedTask: Task | null = null;
      queryClient.setQueriesData({ queryKey: ASSIGNMENTS_QUERY_KEY }, (old: any) => {
        if (!old) return old;
        const assignment = old.find((a: any) => a.id === id);
        if (assignment?.task) {
          deletedTask = assignment.task;
        }
        return old.filter((a: any) => a.id !== id);
      });

      // Optimistically add the task back to unassigned if we found it
      if (deletedTask) {
        queryClient.setQueriesData({ queryKey: UNASSIGNED_QUERY_KEY }, (old: any) => {
          if (!old) return [deletedTask];
          return [...old, deletedTask];
        });
      }

      return { previousAssignments, previousUnassigned };
    },
    onError: (_err, _id, context) => {
      // Rollback to previous state
      if (context?.previousAssignments) {
        context.previousAssignments.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      if (context?.previousUnassigned) {
        context.previousUnassigned.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNASSIGNED_QUERY_KEY });
      if (showToast) {
        toast.success(successMessage);
      }
    },
  });
}
