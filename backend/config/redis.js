const redis = require('redis');
const config = require('./config');

let redisClient = null;

/**
 * Initialize Redis client with fallback to in-memory storage
 * Returns either a real Redis client or a mock client for development
 */
const initializeRedis = async () => {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis reconnection failed after 10 attempts');
            return new Error('Redis reconnection failed');
          }
          return Math.min(retries * 50, 500);
        },
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err.message);
      if (config.NODE_ENV === 'production') {
        throw err;
      }
    });

    redisClient.on('connect', () => {
      console.log('Redis client connected');
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis client reconnecting...');
    });

    await redisClient.connect();
    console.log('✓ Redis initialized successfully');
    return redisClient;
  } catch (error) {
    console.warn(
      `⚠️  Redis connection failed: ${error.message}. Using fallback in-memory store.`
    );

    // Fallback: Assign mock Redis client for development/testing
    redisClient = createMockRedisClient();
    console.log('✓ Using mock Redis client for CSRF tokens');
    return redisClient;
  }
};

/**
 * Mock Redis client for development when Redis is unavailable
 */
const createMockRedisClient = () => {
  const store = new Map();
  let cleanupIntervals = [];

  return {
    connected: false,
    setex: async (key, ttl, value) => {
      try {
        store.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
        // Auto-cleanup after TTL
        const timeoutId = setTimeout(() => {
          store.delete(key);
        }, ttl * 1000);
        cleanupIntervals.push(timeoutId);
        return 'OK';
      } catch (error) {
        console.error('Mock Redis setex error:', error);
        throw error;
      }
    },
    get: async (key) => {
      try {
        const data = store.get(key);
        if (!data) return null;
        if (data.expiresAt < Date.now()) {
          store.delete(key);
          return null;
        }
        return data.value;
      } catch (error) {
        console.error('Mock Redis get error:', error);
        throw error;
      }
    },
    del: async (key) => {
      try {
        return store.delete(key) ? 1 : 0;
      } catch (error) {
        console.error('Mock Redis del error:', error);
        throw error;
      }
    },
    exists: async (key) => {
      try {
        const data = store.get(key);
        if (!data) return 0;
        if (data.expiresAt < Date.now()) {
          store.delete(key);
          return 0;
        }
        return 1;
      } catch (error) {
        console.error('Mock Redis exists error:', error);
        throw error;
      }
    },
    quit: async () => {
      try {
        store.clear();
        cleanupIntervals.forEach(id => clearTimeout(id));
        cleanupIntervals = [];
        return 'OK';
      } catch (error) {
        console.error('Mock Redis quit error:', error);
        throw error;
      }
    },
  };
};

/**
 * Get the Redis client (creates one if not initialized)
 */
const getRedisClient = async () => {
  if (!redisClient) {
    await initializeRedis();
  }
  return redisClient;
};

/**
 * Close Redis connection
 */
const closeRedis = async () => {
  if (redisClient && redisClient.connected !== false) {
    try {
      await redisClient.quit();
      console.log('Redis client closed');
      redisClient = null;
    } catch (error) {
      console.error('Error closing Redis:', error.message);
    }
  }
};

module.exports = {
  initializeRedis,
  getRedisClient,
  closeRedis,
};
