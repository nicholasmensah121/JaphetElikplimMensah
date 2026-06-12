// SECURITY: Enhanced error handler with sanitized error messages and logging
const { logger } = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  // Log full error details
  logger.error({
    message: err.message,
    status: err.status || err.statusCode || 500,
    path: req.path,
    method: req.method,
    ip: req.ip,
    stack: err.stack,
  });

  // Determine status code
  let status = err.status || err.statusCode || 500;
  if (status < 400 || status > 599) {
    status = 500;
  }

  // SECURITY: Sanitize error message for client
  let message = 'Internal Server Error';
  if (status === 401) {
    message = 'Unauthorized';
  } else if (status === 403) {
    message = 'Forbidden';
  } else if (status === 404) {
    message = 'Resource not found';
  } else if (status === 400) {
    message = err.message || 'Bad request';
  } else if (process.env.NODE_ENV === 'development') {
    message = err.message || 'Internal Server Error';
  }

  // Send error response
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      error: err.message,
      stack: err.stack 
    }),
  });
};

module.exports = errorHandler;
