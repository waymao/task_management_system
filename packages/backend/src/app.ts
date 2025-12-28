import Fastify from 'fastify';
import cors from '@fastify/cors';
import { tasksRoutes } from './routes/tasks.js';
import { healthRoutes } from './routes/health.js';
import { AppError } from './utils/errors.js';
import type { ApiError } from './types/index.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
    disableRequestLogging: false,
  });

  // Register CORS
  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests from localhost on any port in development
      const allowedOrigins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
      ];

      if (!origin || allowedOrigins.some(allowed => origin.startsWith(allowed))) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Register routes
  await app.register(tasksRoutes, { prefix: '/api/tasks' });
  await app.register(healthRoutes, { prefix: '/api/health' });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    // Log error
    app.log.error(error);

    // Handle AppError
    if (error instanceof AppError) {
      const response: ApiError = {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };

      // Don't let Fastify override our response
      reply.type('application/json');
      return reply.code(error.statusCode).send(response);
    }

    // Handle validation errors
    if (error.validation) {
      const response: ApiError = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.validation,
        },
      };

      reply.type('application/json');
      return reply.code(400).send(response);
    }

    // Handle unknown errors
    const response: ApiError = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production'
          ? 'An internal error occurred'
          : error.message,
      },
    };

    reply.type('application/json');
    return reply.code(500).send(response);
  });

  return app;
}
