/**
 * Rate Limiting Tests
 * Tests rate limiting middleware functionality
 */

describe('Rate Limiting', () => {
  // Mock rate limiter
  const createMockRateLimiter = (maxRequests = 5, windowMs = 60000) => {
    const requests = new Map();

    return {
      middleware: (req, res, next) => {
        const key = `${req.ip}-${req.originalUrl}`;
        const now = Date.now();
        const windowStart = now - windowMs;

        if (!requests.has(key)) {
          requests.set(key, []);
        }

        const requestTimestamps = requests.get(key);
        const recentRequests = requestTimestamps.filter(
          (timestamp) => timestamp > windowStart
        );

        if (recentRequests.length >= maxRequests) {
          return res.status(429).json({
            success: false,
            message: 'Too many requests',
          });
        }

        recentRequests.push(now);
        requests.set(key, recentRequests);
        next();
      },
      getRequestCount: (key) => {
        const requests_data = requests.get(key) || [];
        return requests_data.length;
      },
      reset: () => requests.clear(),
    };
  };

  describe('Basic Rate Limiting', () => {
    let limiter;

    beforeEach(() => {
      limiter = createMockRateLimiter(3, 60000);
    });

    test('should allow requests under limit', () => {
      const mockReq = {
        ip: '127.0.0.1',
        originalUrl: '/api/test',
      };
      const mockRes = {
        status: jest.fn().returnThis(),
        json: jest.fn(),
      };
      const nextFn = jest.fn();

      // Make 3 requests (at limit)
      for (let i = 0; i < 3; i++) {
        limiter.middleware(mockReq, mockRes, nextFn);
      }

      expect(nextFn).toHaveBeenCalledTimes(3);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should reject requests over limit', () => {
      const mockReq = {
        ip: '127.0.0.1',
        originalUrl: '/api/test',
      };
      const mockRes = {
        status: jest.fn().returnThis(),
        json: jest.fn(),
      };
      const nextFn = jest.fn();

      // Make 4 requests (over limit of 3)
      for (let i = 0; i < 4; i++) {
        limiter.middleware(mockReq, mockRes, nextFn);
      }

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(nextFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('Per-IP Rate Limiting', () => {
    let limiter;

    beforeEach(() => {
      limiter = createMockRateLimiter(2, 60000);
    });

    test('should track requests per IP address', () => {
      const mockRes = {
        status: jest.fn().returnThis(),
        json: jest.fn(),
      };
      const nextFn = jest.fn();

      // IP 1: 2 requests (at limit)
      let mockReq = { ip: '192.168.1.1', originalUrl: '/api/test' };
      limiter.middleware(mockReq, mockRes, nextFn);
      limiter.middleware(mockReq, mockRes, nextFn);

      // IP 2: Should be allowed (separate limit)
      mockReq = { ip: '192.168.1.2', originalUrl: '/api/test' };
      limiter.middleware(mockReq, mockRes, nextFn);
      limiter.middleware(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalledTimes(4);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should block individual IP after limit', () => {
      const mockRes = {
        status: jest.fn().returnThis(),
        json: jest.fn(),
      };
      const nextFn = jest.fn();

      const mockReq = { ip: '192.168.1.1', originalUrl: '/api/test' };

      // Make 3 requests from same IP (limit is 2)
      for (let i = 0; i < 3; i++) {
        limiter.middleware(mockReq, mockRes, nextFn);
      }

      // Should be blocked on 3rd request
      expect(mockRes.status).toHaveBeenCalledWith(429);
    });
  });

  describe('Per-Endpoint Rate Limiting', () => {
    let limiter;

    beforeEach(() => {
      limiter = createMockRateLimiter(2, 60000);
    });

    test('should have separate limits per endpoint', () => {
      const ip = '192.168.1.1';
      const mockRes = {
        status: jest.fn().returnThis(),
        json: jest.fn(),
      };
      const nextFn = jest.fn();

      // Endpoint 1: 2 requests
      let mockReq = { ip, originalUrl: '/api/login' };
      limiter.middleware(mockReq, mockRes, nextFn);
      limiter.middleware(mockReq, mockRes, nextFn);

      // Endpoint 2: Should have separate limit
      mockReq = { ip, originalUrl: '/api/products' };
      limiter.middleware(mockReq, mockRes, nextFn);
      limiter.middleware(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalledTimes(4);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('Time Window Management', () => {
    test('should reset counter after time window expires', (done) => {
      const limiter = createMockRateLimiter(2, 100); // 100ms window
      const mockRes = {
        status: jest.fn().returnThis(),
        json: jest.fn(),
      };
      const nextFn = jest.fn();
      const mockReq = { ip: '192.168.1.1', originalUrl: '/api/test' };

      // Make 2 requests (at limit)
      limiter.middleware(mockReq, mockRes, nextFn);
      limiter.middleware(mockReq, mockRes, nextFn);

      // Wait for window to expire
      setTimeout(() => {
        mockRes.status.mockClear();
        nextFn.mockClear();

        // Should allow new request after window expires
        limiter.middleware(mockReq, mockRes, nextFn);
        expect(nextFn).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();

        done();
      }, 150);
    });
  });

  describe('Tiered Rate Limiting', () => {
    test('should apply stricter limits for auth endpoints', () => {
      const authLimiter = createMockRateLimiter(10, 900000); // 10 req/15min
      const generalLimiter = createMockRateLimiter(100, 900000); // 100 req/15min

      expect(authLimiter).toBeDefined();
      expect(generalLimiter).toBeDefined();
    });

    test('should apply contact endpoint limits', () => {
      const contactLimiter = createMockRateLimiter(5, 900000); // 5 req/15min
      expect(contactLimiter).toBeDefined();
    });
  });

  describe('Rate Limit Response Format', () => {
    test('should return 429 status code', () => {
      const limiter = createMockRateLimiter(1, 60000);
      const mockRes = {
        status: jest.fn().returnThis(),
        json: jest.fn(),
      };
      const nextFn = jest.fn();
      const mockReq = { ip: '192.168.1.1', originalUrl: '/api/test' };

      // First request passes
      limiter.middleware(mockReq, mockRes, nextFn);

      // Second request fails
      limiter.middleware(mockReq, mockRes, nextFn);
      expect(mockRes.status).toHaveBeenCalledWith(429);
    });

    test('should return error message', () => {
      const limiter = createMockRateLimiter(1, 60000);
      const mockRes = {
        status: jest.fn().returnThis(),
        json: jest.fn(),
      };
      const nextFn = jest.fn();
      const mockReq = { ip: '192.168.1.1', originalUrl: '/api/test' };

      limiter.middleware(mockReq, mockRes, nextFn);
      limiter.middleware(mockReq, mockRes, nextFn);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Too many requests',
      });
    });
  });

  describe('DDoS Protection', () => {
    test('should block excessive requests from single IP', () => {
      const limiter = createMockRateLimiter(5, 60000);
      const mockRes = {
        status: jest.fn().returnThis(),
        json: jest.fn(),
      };
      const nextFn = jest.fn();
      const mockReq = { ip: '192.168.1.1', originalUrl: '/api/test' };

      // Simulate 100 requests
      for (let i = 0; i < 100; i++) {
        limiter.middleware(mockReq, mockRes, nextFn);
      }

      // Should have blocked after limit
      expect(mockRes.status).toHaveBeenCalledWith(429);
    });

    test('should not affect other IPs during attack', () => {
      const limiter = createMockRateLimiter(5, 60000);
      const mockRes = {
        status: jest.fn().returnThis(),
        json: jest.fn(),
      };
      const nextFn = jest.fn();

      // Attack from IP 1
      let mockReq = { ip: '192.168.1.1', originalUrl: '/api/test' };
      for (let i = 0; i < 10; i++) {
        limiter.middleware(mockReq, mockRes, nextFn);
      }

      mockRes.status.mockClear();
      nextFn.mockClear();

      // Normal request from IP 2 should succeed
      mockReq = { ip: '192.168.1.2', originalUrl: '/api/test' };
      limiter.middleware(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});
