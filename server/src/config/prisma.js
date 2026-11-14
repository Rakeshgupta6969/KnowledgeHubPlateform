const { PrismaClient } = require('@prisma/client');
const config = require('./environment');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.env === 'test' ? (config.testDatabaseUrl || config.databaseUrl) : config.databaseUrl,
    },
  },
  log: config.env === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

module.exports = prisma;
