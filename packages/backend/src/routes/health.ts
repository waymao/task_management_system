import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../db/prisma.js';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (request, reply) => {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;

      return reply.send({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: 'connected',
        },
      });
    } catch (error) {
      return reply.code(503).send({
        success: false,
        error: {
          code: 'UNHEALTHY',
          message: 'Service is unhealthy',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  });
};
