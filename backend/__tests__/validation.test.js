const request = require('supertest');
const express = require('express');
const { validateRequest } = require('../../middleware/validationRules');
const { body, validationResult } = require('express-validator');

describe('Input Validation Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('Email Validation', () => {
    beforeEach(() => {
      app.post('/test-email', 
        body('email').trim().isEmail().withMessage('Invalid email'),
        validateRequest,
        (req, res) => res.json({ success: true })
      );
    });

    test('should accept valid email', async () => {
      const response = await request(app)
        .post('/test-email')
        .send({ email: 'test@example.com' });
      expect(response.status).toBe(200);
    });

    test('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/test-email')
        .send({ email: 'invalid-email' });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation failed');
    });

    test('should reject empty email', async () => {
      const response = await request(app)
        .post('/test-email')
        .send({ email: '' });
      expect(response.status).toBe(400);
    });

    test('should reject email with special characters', async () => {
      const response = await request(app)
        .post('/test-email')
        .send({ email: 'test<script>@example.com' });
      expect(response.status).toBe(400);
    });
  });

  describe('Password Validation', () => {
    beforeEach(() => {
      app.post('/test-password',
        body('password')
          .isLength({ min: 8 })
          .withMessage('Password must be at least 8 characters'),
        validateRequest,
        (req, res) => res.json({ success: true })
      );
    });

    test('should accept valid password length', async () => {
      const response = await request(app)
        .post('/test-password')
        .send({ password: 'ValidPass123!' });
      expect(response.status).toBe(200);
    });

    test('should reject password shorter than 8 characters', async () => {
      const response = await request(app)
        .post('/test-password')
        .send({ password: 'Short1!' });
      expect(response.status).toBe(400);
    });

    test('should reject empty password', async () => {
      const response = await request(app)
        .post('/test-password')
        .send({ password: '' });
      expect(response.status).toBe(400);
    });
  });

  describe('Name Validation', () => {
    beforeEach(() => {
      app.post('/test-name',
        body('name')
          .trim()
          .notEmpty().withMessage('Name is required')
          .isLength({ min: 2, max: 100 })
          .withMessage('Name must be between 2 and 100 characters')
          .escape()
          .matches(/^[a-zA-Z\s\-'.]+$/)
          .withMessage('Name contains invalid characters'),
        validateRequest,
        (req, res) => res.json({ success: true })
      );
    });

    test('should accept valid name', async () => {
      const response = await request(app)
        .post('/test-name')
        .send({ name: 'John Doe' });
      expect(response.status).toBe(200);
    });

    test('should reject name with numbers', async () => {
      const response = await request(app)
        .post('/test-name')
        .send({ name: 'John123' });
      expect(response.status).toBe(400);
    });

    test('should reject name with special characters', async () => {
      const response = await request(app)
        .post('/test-name')
        .send({ name: 'John@Doe' });
      expect(response.status).toBe(400);
    });

    test('should reject SQL injection attempts', async () => {
      const response = await request(app)
        .post('/test-name')
        .send({ name: "John'; DROP TABLE--" });
      expect(response.status).toBe(400);
    });

    test('should reject XSS attempts', async () => {
      const response = await request(app)
        .post('/test-name')
        .send({ name: 'John<script>alert(1)</script>' });
      expect(response.status).toBe(400);
    });
  });

  describe('Phone Number Validation', () => {
    beforeEach(() => {
      app.post('/test-phone',
        body('phone')
          .optional({ checkFalsy: true })
          .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
          .withMessage('Invalid phone number format'),
        validateRequest,
        (req, res) => res.json({ success: true })
      );
    });

    test('should accept valid phone number', async () => {
      const response = await request(app)
        .post('/test-phone')
        .send({ phone: '(555) 123-4567' });
      expect(response.status).toBe(200);
    });

    test('should accept phone without formatting', async () => {
      const response = await request(app)
        .post('/test-phone')
        .send({ phone: '5551234567' });
      expect(response.status).toBe(200);
    });

    test('should reject invalid phone format', async () => {
      const response = await request(app)
        .post('/test-phone')
        .send({ phone: '123' });
      expect(response.status).toBe(400);
    });

    test('should allow empty phone (optional field)', async () => {
      const response = await request(app)
        .post('/test-phone')
        .send({ phone: '' });
      expect(response.status).toBe(200);
    });
  });

  describe('Length Constraints', () => {
    beforeEach(() => {
      app.post('/test-length',
        body('message')
          .trim()
          .notEmpty().withMessage('Message is required')
          .isLength({ min: 10, max: 5000 })
          .withMessage('Message must be between 10 and 5000 characters'),
        validateRequest,
        (req, res) => res.json({ success: true })
      );
    });

    test('should reject message too short', async () => {
      const response = await request(app)
        .post('/test-length')
        .send({ message: 'Short' });
      expect(response.status).toBe(400);
    });

    test('should accept message at minimum length', async () => {
      const response = await request(app)
        .post('/test-length')
        .send({ message: 'This is a message' });
      expect(response.status).toBe(200);
    });

    test('should reject message exceeding maximum length', async () => {
      const response = await request(app)
        .post('/test-length')
        .send({ message: 'a'.repeat(5001) });
      expect(response.status).toBe(400);
    });
  });
});
