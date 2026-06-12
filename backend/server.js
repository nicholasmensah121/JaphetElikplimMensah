require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const config = require('./config/config');
const errorHandler = require('./middleware/errorHandler');
const createRateLimit = require('./middleware/rateLimit');
const securityHeaders = require('./middleware/securityHeaders');
const { csrfProtection } = require('./middleware/csrf');
const { initializeRedis, closeRedis } = require('./config/redis');
const { httpLogger } = require('./config/logger');
const ensureDemoUser = require('./utils/ensureDemoUser');
const ensureProductCatalog = require('./utils/ensureProductCatalog');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const contactRoutes = require('./routes/contactRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

const corsOptions = {
  // In development allow the browser to use the request origin (flexible for local testing).
  origin(origin, callback) {
    if (config.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (!origin || config.CORS_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
  exposedHeaders: ['X-CSRF-Token', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Authorization', 'X-Requested-With'],
};

// Middleware
app.use(cors(corsOptions));
app.use(httpLogger);
app.use(securityHeaders);
app.use(createRateLimit());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(csrfProtection);

// Serve frontend assets from repo root in development
const staticRoot = path.join(__dirname, '..');

// Block direct public access to sensitive repository and backend files.
const forbiddenStaticPaths = [
  '/backend',
  '/scripts',
  '/.git',
  '/.env',
  '/package.json',
  '/package-lock.json',
  '/README.md',
  '/FIXES_SUMMARY.md',
  '/PROJECT_REVIEW.md',
  '/SECURITY_FIXES_REPORT.md',
  '/SETUP_GUIDE.md',
  '/tmp_check_user_script.js',
];

app.use((req, res, next) => {
  const normalizedPath = req.path.toLowerCase();
  if (forbiddenStaticPaths.some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`))) {
    return res.status(404).send('Not found');
  }
  next();
});

app.use(express.static(staticRoot, { dotfiles: 'deny', index: false }));

// Redirect root to login page to simplify local testing
app.get('/', (req, res) => {
  res.sendFile(path.join(staticRoot, 'login.html'));
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/contact', contactRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.PORT;

const startServer = async () => {
  try {
    await connectDB();
    await initializeRedis();
    await ensureDemoUser();
    await ensureProductCatalog();

    app.listen(PORT, () => {
      console.log(`✓ Server is running on port ${PORT}`);
      console.log(`✓ Environment: ${config.NODE_ENV}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM signal received: closing HTTP server');
      await closeRedis();
      process.exit(0);
    });
  } catch (error) {
    console.error(`✗ Failed to start server: ${error.message}`);
    await closeRedis();
    process.exit(1);
  }
};

startServer();

module.exports = app;
