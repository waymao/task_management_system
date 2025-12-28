import { FastifyPluginAsync } from 'fastify';
import { authService } from '../services/auth.service.js';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';
import { ValidationError } from '../utils/errors.js';
import type { ApiResponse } from '../types/index.js';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Register
  fastify.post('/register', async (request, reply) => {
    const validationResult = registerSchema.safeParse(request.body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid registration data', validationResult.error.errors);
    }

    const user = await authService.register(validationResult.data);

    // Generate JWT token
    const token = fastify.jwt.sign({ userId: user.id }, { expiresIn: '7d' });

    const response: ApiResponse = {
      success: true,
      data: {
        user,
        token,
      },
    };

    return reply.code(201).send(response);
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    const validationResult = loginSchema.safeParse(request.body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid login data', validationResult.error.errors);
    }

    const user = await authService.login(validationResult.data);

    // Generate JWT token
    const token = fastify.jwt.sign({ userId: user.id }, { expiresIn: '7d' });

    const response: ApiResponse = {
      success: true,
      data: {
        user,
        token,
      },
    };

    return reply.send(response);
  });

  // Get current user (protected route)
  fastify.get('/me', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const userId = (request as any).user.userId;
    const user = await authService.getUserById(userId);

    const response: ApiResponse = {
      success: true,
      data: user,
    };

    return reply.send(response);
  });
};
