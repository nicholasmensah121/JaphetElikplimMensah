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
const ensureDemoUser = require('./utils/ensureDemoUser');
const ensureProductCatalog = require('./utils/ensureProductCatalog');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const contactRoutes = require('./routes/contactRoutes');

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
};

// Middleware
app.use(cors(corsOptions));
app.use(securityHeaders);
app.use(createRateLimit());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(csrfProtection);

// Serve frontend assets from repo root in development
const staticRoot = path.join(__dirname, '..');
app.use(express.static(staticRoot));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
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
  await connectDB();
  await ensureDemoUser();
  await ensureProductCatalog();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${config.NODE_ENV}`);
  });
};

startServer().catch((error) => {
  console.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});

module.exports = app;
