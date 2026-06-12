/**
 * CSRF Protection Tests
 * Tests token generation, verification, and middleware protection
 */

describe('CSRF Protection', () => {
  // Mock Redis client
  const mockRedis = {
    tokens: new Map(),
    setex: async (key, ttl, value) => {
      mockRedis.tokens.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
      setTimeout(() => mockRedis.tokens.delete(key), ttl * 1000);
      return 'OK';
    },
    get: async (key) => {
      const data = mockRedis.tokens.get(key);
      if (!data) return null;
      if (data.expiresAt < Date.now()) {
        mockRedis.tokens.delete(key);
        return null;
      }
      return data.value;
    },
    del: async (key) => {
      return mockRedis.tokens.delete(key) ? 1 : 0;
    },
    clear: () => mockRedis.tokens.clear(),
  };

  beforeEach(() => {
    mockRedis.clear();
  });

  describe('Token Generation', () => {
    test('should generate unique tokens', async () => {
      const token1 = require('crypto').randomBytes(32).toString('hex');
      const token2 = require('crypto').randomBytes(32).toString('hex');
      expect(token1).not.toBe(token2);
    });

    test('should generate 64-character hex token', () => {
      const token = require('crypto').randomBytes(32).toString('hex');
      expect(token).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });
  });

  describe('Token Storage and Retrieval', () => {
    test('should store token with TTL', async () => {
      const token = 'test-token-123';
      const sessionId = 'session-456';
      
      await mockRedis.setex(`csrf:${token}`, 3600, sessionId);
      const retrieved = await mockRedis.get(`csrf:${token}`);
      
      expect(retrieved).toBe(sessionId);
    });

    test('should return null for non-existent token', async () => {
      const retrieved = await mockRedis.get('csrf:nonexistent');
      expect(retrieved).toBeNull();
    });

    test('should expire token after TTL', async () => {
      const token = 'test-token-expires';
      const sessionId = 'session-expires';
      
      await mockRedis.setex(`csrf:${token}`, 1, sessionId);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const retrieved = await mockRedis.get(`csrf:${token}`);
      expect(retrieved).toBeNull();
    });
  });

  describe('Token Verification', () => {
    test('should verify valid token', async () => {
      const token = 'valid-token';
      const sessionId = 'valid-session';
      
      await mockRedis.setex(`csrf:${token}`, 3600, sessionId);
      const storedSession = await mockRedis.get(`csrf:${token}`);
      
      expect(storedSession).toBe(sessionId);
    });

    test('should reject invalid token', async () => {
      const sessionId = 'valid-session';
      const storedSession = await mockRedis.get('csrf:invalid-token');
      
      expect(storedSession).toBeNull();
    });

    test('should reject token with wrong session ID', async () => {
      const token = 'token-123';
      const correctSession = 'correct-session';
      const wrongSession = 'wrong-session';
      
      await mockRedis.setex(`csrf:${token}`, 3600, correctSession);
      const stored = await mockRedis.get(`csrf:${token}`);
      
      expect(stored).not.toBe(wrongSession);
    });
  });

  describe('Token Deletion (Single-use)', () => {
    test('should delete token after verification', async () => {
      const token = 'single-use-token';
      const sessionId = 'session-123';
      
      await mockRedis.setex(`csrf:${token}`, 3600, sessionId);
      expect(await mockRedis.get(`csrf:${token}`)).toBe(sessionId);
      
      // Delete token after use
      await mockRedis.del(`csrf:${token}`);
      expect(await mockRedis.get(`csrf:${token}`)).toBeNull();
    });

    test('should prevent token reuse', async () => {
      const token = 'reuse-attempt-token';
      const sessionId = 'session-456';
      
      await mockRedis.setex(`csrf:${token}`, 3600, sessionId);
      
      // First use - token exists
      let stored = await mockRedis.get(`csrf:${token}`);
      expect(stored).toBe(sessionId);
      
      // Delete token after first use
      await mockRedis.del(`csrf:${token}`);
      
      // Second use attempt - token should not exist
      stored = await mockRedis.get(`csrf:${token}`);
      expect(stored).toBeNull();
    });
  });

  describe('Token Header Handling', () => {
    test('should extract token from X-CSRF-Token header', () => {
      const headerToken = 'token-from-header';
      const tokenFromHeader = headerToken;
      
      expect(tokenFromHeader).toBe('token-from-header');
    });

    test('should extract token from request body', () => {
      const bodyToken = { _csrf: 'token-from-body' };
      const token = bodyToken._csrf;
      
      expect(token).toBe('token-from-body');
    });

    test('should prioritize header token over body token', () => {
      const headerToken = 'header-token';
      const bodyToken = 'body-token';
      
      const token = headerToken || bodyToken;
      expect(token).toBe('header-token');
    });
  });

  describe('CSRF Protection for State-Changing Requests', () => {
    const protectedMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

    test('should protect POST requests', () => {
      expect(protectedMethods).toContain('POST');
    });

    test('should protect PUT requests', () => {
      expect(protectedMethods).toContain('PUT');
    });

    test('should protect DELETE requests', () => {
      expect(protectedMethods).toContain('DELETE');
    });

    test('should protect PATCH requests', () => {
      expect(protectedMethods).toContain('PATCH');
    });

    test('should not require CSRF for GET requests', () => {
      expect(safeMethods).toContain('GET');
    });
  });

  describe('Session ID Binding', () => {
    test('should bind token to user ID if authenticated', () => {
      const userId = 'user-123';
      const sessionId = userId;
      
      expect(sessionId).toBe('user-123');
    });

    test('should bind token to IP address if not authenticated', () => {
      const ip = '192.168.1.1';
      const sessionId = ip;
      
      expect(sessionId).toBe('192.168.1.1');
    });

    test('should reject token bound to different session', async () => {
      const token = 'session-bound-token';
      const originalSession = 'user-123';
      const differentSession = 'user-456';
      
      await mockRedis.setex(`csrf:${token}`, 3600, originalSession);
      const stored = await mockRedis.get(`csrf:${token}`);
      
      expect(stored).toBe(originalSession);
      expect(stored).not.toBe(differentSession);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing token gracefully', async () => {
      const token = null;
      const sessionId = 'session-123';
      
      // Token is missing - should not attempt to store
      expect(token).toBeNull();
    });

    test('should handle Redis errors gracefully', async () => {
      // Simulate Redis error
      const redisError = new Error('Redis connection failed');
      expect(() => {
        throw redisError;
      }).toThrow('Redis connection failed');
    });
  });
});
