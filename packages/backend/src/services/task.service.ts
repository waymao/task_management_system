import { prisma } from '../db/prisma.js';
import { NotFoundError } from '../utils/errors.js';
import type { CreateTaskInput, UpdateTaskInput, ListTasksQuery } from '../schemas/task.schema.js';

export class TaskService {
  async createTask(userId: string, data: CreateTaskInput) {
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        delegatedTo: data.delegatedTo,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        projectId: data.projectId,
        userId,
      },
    });

    return task;
  }

  async getTasks(userId: string, query: ListTasksQuery) {
    const where: any = {
      userId,
      deletedAt: null, // Only get non-deleted tasks
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    const tasks = await prisma.task.findMany({
      where,
      take: query.limit,
      skip: query.offset,
      orderBy: [
        { status: 'asc' }, // pending first
        { dueDate: 'asc' }, // earliest due date first
        { createdAt: 'desc' }, // newest first
      ],
    });

    return tasks;
  }

  async getTaskById(userId: string, taskId: string) {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
        deletedAt: null, // Only get non-deleted tasks
      },
    });

    if (!task) {
      throw new NotFoundError('Task');
    }

    return task;
  }

  async updateTask(userId: string, taskId: string, data: UpdateTaskInput) {
    // Verify task exists and belongs to user
    await this.getTaskById(userId, taskId);

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
        ...(data.delegatedTo !== undefined && { delegatedTo: data.delegatedTo }),
        ...(data.followUpDate !== undefined && { followUpDate: data.followUpDate ? new Date(data.followUpDate) : null }),
        ...(data.projectId !== undefined && { projectId: data.projectId }),
      },
    });

    return task;
  }

  async deleteTask(userId: string, taskId: string) {
    // Verify task exists and belongs to user
    await this.getTaskById(userId, taskId);

    // Soft delete - set deletedAt timestamp
    await prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    });
  }

  async completeTask(userId: string, taskId: string) {
    return this.updateTask(userId, taskId, { status: 'completed' });
  }

  async uncompleteTask(userId: string, taskId: string) {
    return this.updateTask(userId, taskId, { status: 'pending' });
  }

  async cancelTask(userId: string, taskId: string) {
    return this.updateTask(userId, taskId, { status: 'cancelled' });
  }

  // Trash management methods
  async getTrashedTasks(userId: string) {
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        deletedAt: { not: null }, // Only get deleted tasks
      },
      orderBy: [
        { deletedAt: 'desc' }, // Most recently deleted first
      ],
    });

    return tasks;
  }

  async restoreTask(userId: string, taskId: string) {
    // First check if task exists and belongs to user (including deleted ones)
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!task) {
      throw new NotFoundError('Task');
    }

    // Restore by clearing deletedAt
    await prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: null },
    });
  }

  async permanentlyDeleteTask(userId: string, taskId: string) {
    // First check if task exists and belongs to user (including deleted ones)
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!task) {
      throw new NotFoundError('Task');
    }

    // Permanently delete from database
    await prisma.task.delete({
      where: { id: taskId },
    });
  }
}

export const taskService = new TaskService();
