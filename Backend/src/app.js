const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const env = require('./config/env');
const logger = require('./config/logger');
const routes = require('./routes');
const { globalLimiter } = require('./middlewares/rateLimiters');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const { AppError } = require('./utils/errors');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.CORS_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new AppError('CORS origin not allowed', 403));
  },
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(globalLimiter);
app.use(morgan('combined', {
  stream: { write: (line) => logger.info('HTTP request', { line: line.trim() }) },
}));

const openapiPath = path.join(__dirname, 'docs', 'openapi.yaml');
const swaggerDocument = YAML.load(openapiPath);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/v1', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
