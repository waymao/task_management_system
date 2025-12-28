import { z } from 'zod';

export const createAssignmentSchema = z.object({
  taskId: z.string().uuid(),
  date: z.string().datetime(),
  slot: z.enum(['allday', 'morning', 'afternoon', 'evening']),
});

export const updateAssignmentSchema = z.object({
  date: z.string().datetime().optional(),
  slot: z.enum(['allday', 'morning', 'afternoon', 'evening']).optional(),
});

export const listAssignmentsSchema = z.object({
  date: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type ListAssignmentsQuery = z.infer<typeof listAssignmentsSchema>;
