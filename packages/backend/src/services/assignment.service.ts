import { prisma } from '../db/prisma.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import type { CreateAssignmentInput, UpdateAssignmentInput, ListAssignmentsQuery } from '../schemas/assignment.schema.js';

export class AssignmentService {
  async createAssignment(userId: string, data: CreateAssignmentInput) {
    // Check if task exists and belongs to user
    const task = await prisma.task.findFirst({
      where: {
        id: data.taskId,
        userId,
        deletedAt: null,
      },
    });

    if (!task) {
      throw new NotFoundError('Task');
    }

    // Check if assignment already exists for this task, date, and slot
    const existing = await prisma.assignment.findFirst({
      where: {
        taskId: data.taskId,
        date: new Date(data.date),
        slot: data.slot,
      },
    });

    if (existing) {
      throw new ValidationError('Assignment already exists for this task, date, and slot', []);
    }

    const assignment = await prisma.assignment.create({
      data: {
        taskId: data.taskId,
        userId,
        date: new Date(data.date),
        slot: data.slot,
      },
      include: {
        task: true,
      },
    });

    return assignment;
  }

  async getAssignments(userId: string, query: ListAssignmentsQuery) {
    const where: any = {
      userId,
      // Filter out assignments for deleted tasks
      task: {
        deletedAt: null,
      },
    };

    if (query.date) {
      const date = new Date(query.date);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    } else if (query.startDate && query.endDate) {
      where.date = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      };
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        task: true,
      },
      orderBy: [
        { date: 'asc' },
        { slot: 'asc' },
      ],
    });

    return assignments;
  }

  async getAssignmentById(userId: string, assignmentId: string) {
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        userId,
        // Filter out assignments for deleted tasks
        task: {
          deletedAt: null,
        },
      },
      include: {
        task: true,
      },
    });

    if (!assignment) {
      throw new NotFoundError('Assignment');
    }

    return assignment;
  }

  async updateAssignment(userId: string, assignmentId: string, data: UpdateAssignmentInput) {
    // Verify assignment exists and belongs to user
    await this.getAssignmentById(userId, assignmentId);

    const assignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        ...(data.date && { date: new Date(data.date) }),
        ...(data.slot && { slot: data.slot }),
      },
      include: {
        task: true,
      },
    });

    return assignment;
  }

  async deleteAssignment(userId: string, assignmentId: string) {
    // Verify assignment exists and belongs to user
    await this.getAssignmentById(userId, assignmentId);

    await prisma.assignment.delete({
      where: { id: assignmentId },
    });
  }

  async getUnassignedTasks(userId: string) {
    // Get all tasks that don't have any assignments
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        deletedAt: null,
        status: 'pending',
        assignments: {
          none: {},
        },
      },
      orderBy: [
        { dueDate: 'asc' }, // Sort by deadline (earliest first)
        { createdAt: 'asc' },
      ],
    });

    return tasks;
  }
}

export const assignmentService = new AssignmentService();
