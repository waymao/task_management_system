import { z } from 'zod';

const taskTypeSchema = z.enum(['todo', 'delegated', 'immediate']);
const taskStatusSchema = z.enum(['pending', 'completed', 'cancelled']);
const taskPrioritySchema = z.enum(['low', 'medium', 'high']);

export const createTaskSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(500),
    description: z.string().max(5000).optional(),
    type: taskTypeSchema,
    priority: taskPrioritySchema.default('medium'),
    dueDate: z.string().datetime().optional(),
    delegatedTo: z.string().max(200).optional(),
    followUpDate: z.string().datetime().optional(),
    projectId: z.string().uuid().optional(),
  })
  .refine(
    (data) => {
      // Todo type must have dueDate
      if (data.type === 'todo' && !data.dueDate) {
        return false;
      }
      return true;
    },
    {
      message: 'Due date is required for todo tasks',
      path: ['dueDate'],
    }
  )
  .refine(
    (data) => {
      // Delegated type must have delegatedTo and followUpDate
      if (data.type === 'delegated' && (!data.delegatedTo || !data.followUpDate)) {
        return false;
      }
      return true;
    },
    {
      message: 'Delegated tasks require delegatedTo and followUpDate',
      path: ['delegatedTo'],
    }
  );

export const updateTaskSchema = z
  .object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(5000).optional(),
    type: taskTypeSchema.optional(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    dueDate: z.string().datetime().nullable().optional(),
    delegatedTo: z.string().max(200).nullable().optional(),
    followUpDate: z.string().datetime().nullable().optional(),
    projectId: z.string().uuid().nullable().optional(),
  })
  .refine(
    (data) => {
      // If type is being updated to todo, ensure dueDate is present
      if (data.type === 'todo' && data.dueDate === null) {
        return false;
      }
      return true;
    },
    {
      message: 'Due date is required for todo tasks',
      path: ['dueDate'],
    }
  )
  .refine(
    (data) => {
      // If type is being updated to delegated, ensure delegatedTo and followUpDate are present
      if (data.type === 'delegated' && (!data.delegatedTo || !data.followUpDate)) {
        return false;
      }
      return true;
    },
    {
      message: 'Delegated tasks require delegatedTo and followUpDate',
      path: ['delegatedTo'],
    }
  );

export const listTasksSchema = z.object({
  type: taskTypeSchema.optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  projectId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksSchema>;
