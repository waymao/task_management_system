import { FastifyPluginAsync } from 'fastify';
import { assignmentService } from '../services/assignment.service.js';
import { createAssignmentSchema, updateAssignmentSchema, listAssignmentsSchema } from '../schemas/assignment.schema.js';
import { ValidationError } from '../utils/errors.js';
import type { ApiResponse } from '../types/index.js';

export const assignmentsRoutes: FastifyPluginAsync = async (fastify) => {
  // Add authentication to all routes
  fastify.addHook('onRequest', fastify.authenticate);

  // Create assignment
  fastify.post('/', async (request, reply) => {
    const userId = request.user.userId;
    const validationResult = createAssignmentSchema.safeParse(request.body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid assignment data', validationResult.error.errors);
    }

    const assignment = await assignmentService.createAssignment(userId, validationResult.data);

    const response: ApiResponse = {
      success: true,
      data: assignment,
    };

    return reply.code(201).send(response);
  });

  // List assignments
  fastify.get('/', async (request, reply) => {
    const userId = request.user.userId;
    const validationResult = listAssignmentsSchema.safeParse(request.query);

    if (!validationResult.success) {
      throw new ValidationError('Invalid query parameters', validationResult.error.errors);
    }

    const assignments = await assignmentService.getAssignments(userId, validationResult.data);

    const response: ApiResponse = {
      success: true,
      data: assignments,
    };

    return reply.send(response);
  });

  // Get unassigned tasks
  fastify.get('/unassigned', async (request, reply) => {
    const userId = request.user.userId;
    const tasks = await assignmentService.getUnassignedTasks(userId);

    const response: ApiResponse = {
      success: true,
      data: tasks,
    };

    return reply.send(response);
  });

  // Get assignment by ID
  fastify.get('/:id', async (request, reply) => {
    const userId = request.user.userId;
    const { id } = request.params as { id: string };

    const assignment = await assignmentService.getAssignmentById(userId, id);

    const response: ApiResponse = {
      success: true,
      data: assignment,
    };

    return reply.send(response);
  });

  // Update assignment
  fastify.patch('/:id', async (request, reply) => {
    const userId = request.user.userId;
    const { id } = request.params as { id: string };

    const validationResult = updateAssignmentSchema.safeParse(request.body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid assignment data', validationResult.error.errors);
    }

    const assignment = await assignmentService.updateAssignment(userId, id, validationResult.data);

    const response: ApiResponse = {
      success: true,
      data: assignment,
    };

    return reply.send(response);
  });

  // Delete assignment
  fastify.delete('/:id', async (request, reply) => {
    const userId = request.user.userId;
    const { id} = request.params as { id: string };

    await assignmentService.deleteAssignment(userId, id);

    const response: ApiResponse = {
      success: true,
      data: { message: 'Assignment deleted successfully' },
    };

    return reply.send(response);
  });
};
