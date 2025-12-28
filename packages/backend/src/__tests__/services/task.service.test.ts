import { describe, it, expect, beforeEach } from 'vitest';
import { TaskService } from '../../services/task.service.js';
import { NotFoundError } from '../../utils/errors.js';

const taskService = new TaskService();
const userId = 'test-user-1';

describe('TaskService', () => {
  describe('createTask', () => {
    it('should create an immediate task', async () => {
      const task = await taskService.createTask(userId, {
        title: 'Test immediate task',
        type: 'immediate',
        priority: 'high',
      });

      expect(task.id).toBeDefined();
      expect(task.title).toBe('Test immediate task');
      expect(task.type).toBe('immediate');
      expect(task.priority).toBe('high');
      expect(task.status).toBe('pending');
      expect(task.userId).toBe(userId);
    });

    it('should create a todo task with due date', async () => {
      const dueDate = new Date('2025-12-31').toISOString();
      const task = await taskService.createTask(userId, {
        title: 'Test todo',
        type: 'todo',
        dueDate,
        priority: 'medium',
      });

      expect(task.type).toBe('todo');
      expect(task.dueDate).toBeDefined();
    });

    it('should create a delegated task', async () => {
      const followUpDate = new Date('2025-12-31').toISOString();
      const task = await taskService.createTask(userId, {
        title: 'Test delegated task',
        type: 'delegated',
        delegatedTo: 'John Doe',
        followUpDate,
        priority: 'low',
      });

      expect(task.type).toBe('delegated');
      expect(task.delegatedTo).toBe('John Doe');
      expect(task.followUpDate).toBeDefined();
    });

    it('should create task with description', async () => {
      const task = await taskService.createTask(userId, {
        title: 'Test task',
        description: 'This is a test description',
        type: 'immediate',
        priority: 'medium',
      });

      expect(task.description).toBe('This is a test description');
    });
  });

  describe('getTasks', () => {
    beforeEach(async () => {
      // Create test tasks
      await taskService.createTask(userId, {
        title: 'Immediate task',
        type: 'immediate',
        priority: 'high',
      });

      await taskService.createTask(userId, {
        title: 'Todo task',
        type: 'todo',
        dueDate: new Date('2025-12-31').toISOString(),
        priority: 'medium',
      });

      await taskService.createTask(userId, {
        title: 'Delegated task',
        type: 'delegated',
        delegatedTo: 'Jane',
        followUpDate: new Date('2025-12-31').toISOString(),
        priority: 'low',
      });
    });

    it('should get all tasks', async () => {
      const tasks = await taskService.getTasks(userId, { limit: 50, offset: 0 });

      expect(tasks).toHaveLength(3);
    });

    it('should filter tasks by type', async () => {
      const tasks = await taskService.getTasks(userId, {
        type: 'immediate',
        limit: 50,
        offset: 0,
      });

      expect(tasks).toHaveLength(1);
      expect(tasks[0].type).toBe('immediate');
    });

    it('should filter tasks by status', async () => {
      const tasks = await taskService.getTasks(userId, {
        status: 'pending',
        limit: 50,
        offset: 0,
      });

      expect(tasks).toHaveLength(3);
    });

    it('should filter tasks by priority', async () => {
      const tasks = await taskService.getTasks(userId, {
        priority: 'high',
        limit: 50,
        offset: 0,
      });

      expect(tasks).toHaveLength(1);
      expect(tasks[0].priority).toBe('high');
    });

    it('should respect limit and offset', async () => {
      const tasks = await taskService.getTasks(userId, {
        limit: 2,
        offset: 0,
      });

      expect(tasks).toHaveLength(2);
    });
  });

  describe('getTaskById', () => {
    it('should get task by id', async () => {
      const created = await taskService.createTask(userId, {
        title: 'Test task',
        type: 'immediate',
        priority: 'medium',
      });

      const task = await taskService.getTaskById(userId, created.id);

      expect(task.id).toBe(created.id);
      expect(task.title).toBe('Test task');
    });

    it('should throw NotFoundError for non-existent task', async () => {
      await expect(
        taskService.getTaskById(userId, 'non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateTask', () => {
    it('should update task title', async () => {
      const created = await taskService.createTask(userId, {
        title: 'Original title',
        type: 'immediate',
        priority: 'medium',
      });

      const updated = await taskService.updateTask(userId, created.id, {
        title: 'Updated title',
      });

      expect(updated.title).toBe('Updated title');
    });

    it('should update task status', async () => {
      const created = await taskService.createTask(userId, {
        title: 'Test task',
        type: 'immediate',
        priority: 'medium',
      });

      const updated = await taskService.updateTask(userId, created.id, {
        status: 'completed',
      });

      expect(updated.status).toBe('completed');
    });

    it('should update task priority', async () => {
      const created = await taskService.createTask(userId, {
        title: 'Test task',
        type: 'immediate',
        priority: 'low',
      });

      const updated = await taskService.updateTask(userId, created.id, {
        priority: 'high',
      });

      expect(updated.priority).toBe('high');
    });

    it('should throw NotFoundError for non-existent task', async () => {
      await expect(
        taskService.updateTask(userId, 'non-existent-id', { title: 'New title' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteTask', () => {
    it('should delete task', async () => {
      const created = await taskService.createTask(userId, {
        title: 'Test task',
        type: 'immediate',
        priority: 'medium',
      });

      await taskService.deleteTask(userId, created.id);

      await expect(
        taskService.getTaskById(userId, created.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError for non-existent task', async () => {
      await expect(
        taskService.deleteTask(userId, 'non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('completeTask', () => {
    it('should mark task as completed', async () => {
      const created = await taskService.createTask(userId, {
        title: 'Test task',
        type: 'immediate',
        priority: 'medium',
      });

      const completed = await taskService.completeTask(userId, created.id);

      expect(completed.status).toBe('completed');
    });
  });

  describe('cancelTask', () => {
    it('should mark task as cancelled', async () => {
      const created = await taskService.createTask(userId, {
        title: 'Test task',
        type: 'immediate',
        priority: 'medium',
      });

      const cancelled = await taskService.cancelTask(userId, created.id);

      expect(cancelled.status).toBe('cancelled');
    });
  });
});
