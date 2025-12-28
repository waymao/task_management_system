import { describe, it, expect } from 'vitest';
import { createTaskSchema, updateTaskSchema } from '../../schemas/task.schema.js';

describe('Task Schema Validation', () => {
  describe('createTaskSchema', () => {
    it('should validate immediate task', () => {
      const result = createTaskSchema.safeParse({
        title: 'Test immediate task',
        type: 'immediate',
        priority: 'high',
      });

      expect(result.success).toBe(true);
    });

    it('should validate todo task with due date', () => {
      const result = createTaskSchema.safeParse({
        title: 'Test todo',
        type: 'todo',
        dueDate: new Date().toISOString(),
        priority: 'medium',
      });

      expect(result.success).toBe(true);
    });

    it('should validate delegated task', () => {
      const result = createTaskSchema.safeParse({
        title: 'Test delegated task',
        type: 'delegated',
        delegatedTo: 'John Doe',
        followUpDate: new Date().toISOString(),
        priority: 'low',
      });

      expect(result.success).toBe(true);
    });

    it('should reject todo without due date', () => {
      const result = createTaskSchema.safeParse({
        title: 'Test todo',
        type: 'todo',
        priority: 'medium',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Due date is required');
      }
    });

    it('should reject delegated task without delegatedTo', () => {
      const result = createTaskSchema.safeParse({
        title: 'Test delegated',
        type: 'delegated',
        followUpDate: new Date().toISOString(),
      });

      expect(result.success).toBe(false);
    });

    it('should reject delegated task without followUpDate', () => {
      const result = createTaskSchema.safeParse({
        title: 'Test delegated',
        type: 'delegated',
        delegatedTo: 'John Doe',
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty title', () => {
      const result = createTaskSchema.safeParse({
        title: '',
        type: 'immediate',
      });

      expect(result.success).toBe(false);
    });

    it('should accept description', () => {
      const result = createTaskSchema.safeParse({
        title: 'Test task',
        description: 'This is a test description',
        type: 'immediate',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('This is a test description');
      }
    });
  });

  describe('updateTaskSchema', () => {
    it('should allow partial updates', () => {
      const result = updateTaskSchema.safeParse({
        title: 'Updated title',
      });

      expect(result.success).toBe(true);
    });

    it('should allow status updates', () => {
      const result = updateTaskSchema.safeParse({
        status: 'completed',
      });

      expect(result.success).toBe(true);
    });

    it('should allow priority updates', () => {
      const result = updateTaskSchema.safeParse({
        priority: 'high',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const result = updateTaskSchema.safeParse({
        status: 'invalid-status',
      });

      expect(result.success).toBe(false);
    });
  });
});
