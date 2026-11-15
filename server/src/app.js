const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./docs/openapi.json');
const config = require('./config/environment');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimit');

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Swagger UI documentation rendering
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Strict CORS validation against CLIENT_ORIGIN (supports comma-separated list)
const allowedOrigins = config.clientOrigin
  ? config.clientOrigin.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, curl, mobile tools)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy: Origin not allowed'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

const prisma = require('./config/prisma');
const cache = require('./config/redis');

// Production Health & Readiness check endpoint (/health and /api/v1/health)
app.get(['/health', '/api/v1/health'], async (req, res) => {
  let dbStatus = 'down';
  let redisStatus = 'down';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'up';
  } catch {
    dbStatus = 'down';
  }

  redisStatus = cache.isAvailable() ? 'up' : 'down';

  const isHealthy = dbStatus === 'up';
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: isHealthy ? (redisStatus === 'up' ? 'ok' : 'degraded') : 'down',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    services: {
      database: dbStatus,
      redis: redisStatus,
    },
    version: '1.0.0',
    memory: {
      usedRssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
  });
});

// OpenAPI/Swagger Documentation
app.get('/api/v1/docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(openapiSpec);
});
app.use(
  '/api/v1/docs',
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec, {
    customSiteTitle: 'KnowledgeHub API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  })
);

// API v1 routes with global rate limiting
app.use('/api/v1', apiLimiter, routes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
});

// Central error handler
app.use(errorHandler);

module.exports = app;
