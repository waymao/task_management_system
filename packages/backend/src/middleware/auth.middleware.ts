import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../utils/errors.js';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Verify JWT token from Authorization header
    await request.jwtVerify();
  } catch (err) {
    throw new AppError('UNAUTHORIZED', 'Invalid or missing authentication token', 401);
  }
}
