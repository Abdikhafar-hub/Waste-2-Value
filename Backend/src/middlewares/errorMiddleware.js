const env = require('../config/env');
const logger = require('../config/logger');
const { AppError } = require('../utils/errors');
const { sendError } = require('../utils/apiResponse');

function normalizePrismaError(error) {
  if (!error?.code || typeof error.code !== 'string') return error;
  if (error.code === 'P2002') {
    return new AppError('A unique constraint was violated', 409);
  }
  if (error.code === 'P2025') {
    return new AppError('Requested record was not found', 404);
  }
  if (error.code === 'P2003') {
    return new AppError('Related record constraint failed', 400);
  }
  return error;
}

function notFound(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

function errorHandler(error, req, res, _next) {
  const normalizedError = normalizePrismaError(error);
  const statusCode = normalizedError.statusCode || 500;
  const isOperational = normalizedError instanceof AppError;
  const message = isOperational || env.NODE_ENV !== 'production' ? normalizedError.message : 'Internal server error';

  logger.error('Request failed', {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    error: normalizedError.message,
    stack: env.NODE_ENV === 'production' ? undefined : normalizedError.stack,
  });

  return sendError(res, message, normalizedError.errors, statusCode);
}

module.exports = { notFound, errorHandler };
