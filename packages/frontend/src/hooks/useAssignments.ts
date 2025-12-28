import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentsApi } from '../api/assignments';
import type { CreateAssignmentInput } from '../types';
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNASSIGNED_QUERY_KEY });
      if (showToast) {
        toast.success(successMessage);
      }
    },
  });
}
