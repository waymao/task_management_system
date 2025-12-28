import { beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../db/prisma.js';
import { execSync } from 'child_process';

// Set test environment
process.env.DATABASE_URL = 'file:./test.db';
process.env.DEFAULT_USER_ID = 'test-user-1';
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  // Reset database and run migrations
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });

  // Create test user
  await prisma.user.upsert({
    where: { id: 'test-user-1' },
    update: {},
    create: {
      id: 'test-user-1',
      name: 'Test User',
      email: 'test@example.com',
    },
  });
});

beforeEach(async () => {
  // Clean up tasks before each test
  await prisma.task.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.project.deleteMany({});
});

afterAll(async () => {
  await prisma.$disconnect();
});
