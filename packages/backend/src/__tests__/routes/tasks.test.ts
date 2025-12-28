import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../../app.js';

describe('Task Routes', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    app = await buildApp();
  });

  describe('POST /api/tasks', () => {
    it('should create an immediate task', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/tasks',
        payload: {
          title: 'Test immediate task',
          type: 'immediate',
          priority: 'high',
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('Test immediate task');
      expect(data.data.type).toBe('immediate');
    });

    it('should create a todo task', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/tasks',
        payload: {
          title: 'Test todo',
          type: 'todo',
          dueDate: new Date('2025-12-31').toISOString(),
          priority: 'medium',
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.type).toBe('todo');
    });

    it('should create a delegated task', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/tasks',
        payload: {
          title: 'Test delegated',
          type: 'delegated',
          delegatedTo: 'John Doe',
          followUpDate: new Date('2025-12-31').toISOString(),
          priority: 'low',
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.delegatedTo).toBe('John Doe');
    });

    it('should reject todo without due date', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/tasks',
        payload: {
          title: 'Test todo',
          type: 'todo',
          priority: 'medium',
        },
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      // Fastify returns error in this format when validation fails
      expect(data.statusCode).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.message).toContain('Invalid task data');
    });

    it('should reject invalid task type', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/tasks',
        payload: {
          title: 'Test task',
          type: 'invalid-type',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      // Create test tasks
      await app.inject({
        method: 'POST',
        url: '/api/tasks',
        payload: {
          title: 'Immediate task',
          type: 'immediate',
          priority: 'high',
        },
      });

      await app.inject({
        method: 'POST',
        url: '/api/tasks',
        payload: {
          title: 'Todo task',
          type: 'todo',
          dueDate: new Date('2025-12-31').toISOString(),
          priority: 'medium',
        },
      });
    });

    it('should get all tasks', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/tasks',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });

    it('should filter tasks by type', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/tasks?type=immediate',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].type).toBe('immediate');
    });

    it('should filter tasks by priority', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/tasks?priority=high',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].priority).toBe('high');
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should get task by id', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/tasks',
        payload: {
          title: 'Test task',
          type: 'immediate',
          priority: 'medium',
        },
      });

      const created = JSON.parse(createResponse.body).data;

      const response = await app.inject({
        method: 'GET',
        url: `/api/tasks/${created.id}`,
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(created.id);
    });

    it('should return 404 for non-existent task', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/tasks/non-existent-id',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    it('should update task', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/tasks',
        payload: {
          title: 'Original title',
          type: 'immediate',
          priority: 'medium',
        },
      });

      const created = JSON.parse(createResponse.body).data;

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/tasks/${created.id}`,
        payload: {
          title: 'Updated title',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.data.title).toBe('Updated title');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete task', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/tasks',
        payload: {
          title: 'Test task',
          type: 'immediate',
          priority: 'medium',
        },
      });

      const created = JSON.parse(createResponse.body).data;

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/tasks/${created.id}`,
      });

      expect(response.statusCode).toBe(200);

      // Verify task is deleted
      const getResponse = await app.inject({
        method: 'GET',
        url: `/api/tasks/${created.id}`,
      });

      expect(getResponse.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/tasks/:id/complete', () => {
    it('should complete task', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/tasks',
        payload: {
          title: 'Test task',
          type: 'immediate',
          priority: 'medium',
        },
      });

      const created = JSON.parse(createResponse.body).data;

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/tasks/${created.id}/complete`,
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.data.status).toBe('completed');
    });
  });

  describe('PATCH /api/tasks/:id/cancel', () => {
    it('should cancel task', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/tasks',
        payload: {
          title: 'Test task',
          type: 'immediate',
          priority: 'medium',
        },
      });

      const created = JSON.parse(createResponse.body).data;

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/tasks/${created.id}/cancel`,
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.data.status).toBe('cancelled');
    });
  });
});
