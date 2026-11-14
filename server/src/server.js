const app = require('./app');
const config = require('./config/environment');
const prisma = require('./config/prisma');

async function startServer() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully via Prisma');

    const server = app.listen(config.port, () => {
      console.log(`Server running in ${config.env} mode on http://localhost:${config.port}`);
    });

    return server;
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
