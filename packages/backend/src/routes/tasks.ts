import { FastifyPluginAsync } from 'fastify';
import { taskService } from '../services/task.service.js';
import { createTaskSchema, updateTaskSchema, listTasksSchema } from '../schemas/task.schema.js';
import { ValidationError } from '../utils/errors.js';
import type { ApiResponse } from '../types/index.js';

export const tasksRoutes: FastifyPluginAsync = async (fastify) => {
  const userId = process.env.DEFAULT_USER_ID || 'default-user-1';

  // Create task
  fastify.post('/', async (request, reply) => {
    const validationResult = createTaskSchema.safeParse(request.body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid task data', validationResult.error.errors);
    }

    const task = await taskService.createTask(userId, validationResult.data);

    const response: ApiResponse = {
      success: true,
      data: task,
    };

    return reply.code(201).send(response);
  });

  // List tasks
  fastify.get('/', async (request, reply) => {
    const validationResult = listTasksSchema.safeParse(request.query);

    if (!validationResult.success) {
      throw new ValidationError('Invalid query parameters', validationResult.error.errors);
    }

    const tasks = await taskService.getTasks(userId, validationResult.data);

    const response: ApiResponse = {
      success: true,
      data: tasks,
    };

    return reply.send(response);
  });

  // Get task by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const task = await taskService.getTaskById(userId, id);

    const response: ApiResponse = {
      success: true,
      data: task,
    };

    return reply.send(response);
  });

  // Update task
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const validationResult = updateTaskSchema.safeParse(request.body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid task data', validationResult.error.errors);
    }

    const task = await taskService.updateTask(userId, id, validationResult.data);

    const response: ApiResponse = {
      success: true,
      data: task,
    };

    return reply.send(response);
  });

  // Delete task
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    await taskService.deleteTask(userId, id);

    const response: ApiResponse = {
      success: true,
      data: { message: 'Task deleted successfully' },
    };

    return reply.send(response);
  });

  // Complete task
  fastify.patch('/:id/complete', async (request, reply) => {
    const { id } = request.params as { id: string };

    const task = await taskService.completeTask(userId, id);

    const response: ApiResponse = {
      success: true,
      data: task,
    };

    return reply.send(response);
  });

  // Cancel task
  fastify.patch('/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string };

    const task = await taskService.cancelTask(userId, id);

    const response: ApiResponse = {
      success: true,
      data: task,
    };

    return reply.send(response);
  });

  // Uncomplete task (mark as pending again)
  fastify.patch('/:id/uncomplete', async (request, reply) => {
    const { id } = request.params as { id: string };

    const task = await taskService.uncompleteTask(userId, id);

    const response: ApiResponse = {
      success: true,
      data: task,
    };

    return reply.send(response);
  });

  // Get trashed tasks
  fastify.get('/trash/list', async (request, reply) => {
    const tasks = await taskService.getTrashedTasks(userId);

    const response: ApiResponse = {
      success: true,
      data: tasks,
    };

    return reply.send(response);
  });

  // Restore task from trash
  fastify.patch('/:id/restore', async (request, reply) => {
    const { id } = request.params as { id: string };

    await taskService.restoreTask(userId, id);

    const response: ApiResponse = {
      success: true,
      data: { message: 'Task restored successfully' },
    };

    return reply.send(response);
  });

  // Permanently delete task
  fastify.delete('/:id/permanently', async (request, reply) => {
    const { id } = request.params as { id: string };

    await taskService.permanentlyDeleteTask(userId, id);

    const response: ApiResponse = {
      success: true,
      data: { message: 'Task permanently deleted' },
    };

    return reply.send(response);
  });
};
