// SECURITY: Enhanced error handler with sanitized error messages
const errorHandler = (err, req, res, next) => {
  // Log full error details for debugging (only in development or to secure logging system)
  if (process.env.NODE_ENV === 'development') {
    console.error('[ERROR]', err);
  } else {
    // In production, log to external logging service (e.g., Sentry, CloudWatch)
    console.error(`[${new Date().toISOString()}] Error:`, err.message);
  }

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
