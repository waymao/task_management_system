import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create default user
  const user = await prisma.user.upsert({
    where: { id: 'default-user-1' },
    update: {},
    create: {
      id: 'default-user-1',
      name: 'Default User',
      email: 'user@example.com',
    },
  });

  console.log('Seeded default user:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
