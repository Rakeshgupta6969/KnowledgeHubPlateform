const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./docs/openapi.json');
const config = require('./config/environment');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Swagger UI documentation rendering
  })
);
app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
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

// API v1 routes
app.use('/api/v1', routes);

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
