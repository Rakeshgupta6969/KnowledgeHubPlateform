// Jest test setup file
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/knowledgehub_test?schema=public';

const prisma = require('../src/config/prisma');
const cache = require('../src/config/redis');

async function cleanDatabase() {
  await prisma.auditLog.deleteMany({});
  await prisma.searchLog.deleteMany({});
  await prisma.articleView.deleteMany({});
  await prisma.feedback.deleteMany({});
  await prisma.article.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.membership.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tenant.deleteMany({});

  if (cache.isAvailable()) {
    await cache.delPattern('*');
  }
}

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
  const cache = require('../src/config/redis');
  await cache.disconnect();
});

module.exports = { cleanDatabase };
