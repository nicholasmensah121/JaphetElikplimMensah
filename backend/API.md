# Gentlemen Parlor API Documentation

## Overview

**Base URL**: `http://localhost:5000/api`

**Version**: 1.0.0

**Authentication**: JWT-based with httpOnly cookies

**Response Format**: JSON

---

## Authentication

### JWT Token Management

- **Type**: Bearer Token (also stored in httpOnly cookie named `gp_auth`)
- **Expiration**: 7 days
- **Secure Storage**: Tokens are stored in httpOnly cookies (XSS-proof)
- **CORS Support**: Yes, credentials required

### CSRF Protection

All state-changing requests (POST, PUT, DELETE, PATCH) require CSRF token:
- **Header**: `X-CSRF-Token`
- **Alternative**: `_csrf` in request body
- **Token Expiration**: 1 hour
- **Token Generation**: Automatic on first GET request to any endpoint

### Example: Getting CSRF Token

```bash
curl -i -H "Accept: application/json" http://localhost:5000/api/auth/profile
# Response will include X-CSRF-Token header
```

---

## Rate Limiting

### Limits by Endpoint Type

| Endpoint Type | Requests | Window | Status Code |
|---|---|---|---|
| General APIs | 100 | 15 minutes | 429 |
| Authentication | 10 | 15 minutes | 429 |
| Contact Form | 5 | 15 minutes | 429 |
| Public Products | 300 | 15 minutes | 429 |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1623456789
```

### Rate Limit Error Response

```json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
```

---

## API Endpoints

### Authentication Endpoints

#### 1. Register User

**Endpoint**: `POST /auth/register`

**Rate Limit**: 10 req/15 min

**Request Headers**:
```
Content-Type: application/json
X-CSRF-Token: <token>
```

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "(555) 123-4567",
  "password": "ValidPass123!",
  "confirmPassword": "ValidPass123!"
}
```

**Password Requirements**:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (@$!%*?&-_#)

**Success Response** (201):
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "(555) 123-4567",
    "role": "customer"
  }
}
```

**Error Responses**:
- `400`: Validation failed (missing fields, invalid email, passwords don't match, weak password)
- `400`: User already exists

---

#### 2. Login

**Endpoint**: `POST /auth/login`

**Rate Limit**: 10 req/15 min

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "ValidPass123!"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

**Error Responses**:
- `401`: Invalid credentials
- `400`: Validation failed

---

#### 3. Get Profile

**Endpoint**: `GET /auth/profile`

**Authentication**: Required (Bearer token)

**Success Response** (200):
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "(555) 123-4567",
    "role": "customer",
    "address": {
      "street": "123 Main St",
      "city": "Springfield",
      "state": "IL",
      "zip": "62701",
      "country": "USA"
    }
  }
}
```

**Error Responses**:
- `401`: Unauthorized (no token or invalid token)
- `404`: User not found

---

#### 4. Update Profile

**Endpoint**: `PUT /auth/profile`

**Authentication**: Required

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "(555) 123-4567",
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zip": "62701",
    "country": "USA"
  },
  "measurements": {
    "chest": 38,
    "waist": 32,
    "inseam": 32,
    "neck": 15,
    "sleeve": 32,
    "shoulder": 18
  }
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { /* updated user data */ }
}
```

---

#### 5. Logout

**Endpoint**: `POST /auth/logout`

**Authentication**: Optional

**Success Response** (200):
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### Product Endpoints

#### 1. Get All Products

**Endpoint**: `GET /products`

**Rate Limit**: 300 req/15 min (public)

**Query Parameters**:
- `search` (optional): Search query (max 200 chars)
- `category` (optional): Filter by category (max 100 chars)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (1-100, default: 10)

**Example**: `/products?category=Suits&page=1&limit=10`

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Classic Suit",
      "description": "Timeless design for formal occasions.",
      "price": 199.99,
      "category": "Formal Wear",
      "sku": "SUIT-001",
      "stock": 15,
      "image": "images/Suits/classic-suit.jpg",
      "rating": 4.5,
      "reviews": [/* review objects */]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

---

#### 2. Get Product by ID

**Endpoint**: `GET /products/:id`

**Rate Limit**: 300 req/15 min (public)

**URL Parameters**:
- `id`: MongoDB product ID (24-char hex string)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Classic Suit",
    "description": "Timeless design for formal occasions.",
    "price": 199.99,
    "category": "Formal Wear",
    "sku": "SUIT-001",
    "stock": 15,
    "image": "images/Suits/classic-suit.jpg",
    "rating": 4.5,
    "reviews": [/* review objects */]
  }
}
```

**Error Responses**:
- `404`: Product not found
- `400`: Invalid product ID

---

#### 3. Add Product Review

**Endpoint**: `POST /products/:id/reviews`

**Authentication**: Required

**Request Body**:
```json
{
  "rating": 5,
  "comment": "Excellent quality and fit!"
}
```

**Validation**:
- `rating`: 1-5 (required)
- `comment`: 1-1000 chars (optional)

**Success Response** (201):
```json
{
  "success": true,
  "message": "Review added successfully",
  "review": {
    "rating": 5,
    "comment": "Excellent quality and fit!",
    "userId": "507f1f77bcf86cd799439011",
    "createdAt": "2024-06-12T10:30:00Z"
  }
}
```

---

### Cart Endpoints

#### 1. Add to Cart

**Endpoint**: `POST /cart`

**Authentication**: Required

**Request Body**:
```json
{
  "productId": "507f1f77bcf86cd799439011",
  "productName": "Classic Suit",
  "productSku": "SUIT-001",
  "quantity": 1
}
```

**Note**: Provide at least one of: `productId`, `productName`, or `productSku`

**Success Response** (201):
```json
{
  "success": true,
  "message": "Item added to cart",
  "cart": {
    "userId": "507f1f77bcf86cd799439011",
    "items": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "productName": "Classic Suit",
        "quantity": 1,
        "price": 199.99
      }
    ],
    "totalItems": 1,
    "totalPrice": 199.99
  }
}
```

---

#### 2. Update Cart Item

**Endpoint**: `PUT /cart/:productId`

**Authentication**: Required

**Request Body**:
```json
{
  "quantity": 2
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Cart item updated",
  "cart": { /* updated cart data */ }
}
```

---

#### 3. Remove from Cart

**Endpoint**: `DELETE /cart/:productId`

**Authentication**: Required

**Success Response** (200):
```json
{
  "success": true,
  "message": "Item removed from cart",
  "cart": { /* updated cart data */ }
}
```

---

### Order Endpoints

#### 1. Create Order

**Endpoint**: `POST /orders`

**Authentication**: Required

**Request Body**:
```json
{
  "paymentMethod": "card",
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zip": "62701",
    "country": "USA"
  }
}
```

**Validation**:
- `paymentMethod`: One of: card, paypal, bank_transfer
- `shippingAddress`: All fields required (street, city, state, zip, country)

**Success Response** (201):
```json
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439011",
    "items": [ /* order items */ ],
    "totalAmount": 199.99,
    "status": "pending",
    "paymentStatus": "pending",
    "shippingAddress": { /* address */ },
    "createdAt": "2024-06-12T10:30:00Z"
  }
}
```

---

#### 2. Get Orders

**Endpoint**: `GET /orders`

**Authentication**: Required

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10)

**Success Response** (200):
```json
{
  "success": true,
  "data": [ /* array of orders */ ],
  "pagination": { /* pagination info */ }
}
```

---

#### 3. Get Order by ID

**Endpoint**: `GET /orders/:id`

**Authentication**: Required

**Success Response** (200):
```json
{
  "success": true,
  "data": { /* order details */ }
}
```

---

### Contact Endpoints

#### 1. Submit Contact Message

**Endpoint**: `POST /contact`

**Rate Limit**: 5 req/15 min (public)

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "(555) 123-4567",
  "subject": "Product Inquiry",
  "message": "I have a question about your classic suit.",
  "newsletter": true
}
```

**Validation**:
- `name`: 2-100 chars, letters/spaces/hyphens/apostrophes only
- `email`: Valid email format
- `phone`: Optional, valid phone format (10-20 chars)
- `subject`: 3-200 chars
- `message`: 10-5000 chars
- `newsletter`: Boolean (optional)

**Success Response** (201):
```json
{
  "success": true,
  "message": "Message submitted successfully"
}
```

---

#### 2. Get Contact Messages (Admin Only)

**Endpoint**: `GET /contact`

**Authentication**: Required (Admin role)

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "subject": "Product Inquiry",
      "message": "I have a question about your classic suit.",
      "newsletter": true,
      "createdAt": "2024-06-12T10:30:00Z"
    }
  ]
}
```

---

#### 3. Delete Contact Message (Admin Only)

**Endpoint**: `DELETE /contact/:id`

**Authentication**: Required (Admin role)

**Success Response** (200):
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

### HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Validation failed |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - CSRF token missing/invalid or insufficient permissions |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Security Headers

All responses include these security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy: default-src 'self'`
- `Strict-Transport-Security: max-age=31536000`

---

## CORS

**Allowed Origins** (Development):
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `http://localhost:5500`
- `http://127.0.0.1:5500`

**Allowed Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS

**Allowed Headers**: Content-Type, Authorization, X-CSRF-Token

**Credentials**: Enabled (httpOnly cookies)

---

## Logging

All API requests and errors are logged to:
- **Console**: Live output during development
- **Logs/error.log**: Error-level logs
- **Logs/combined.log**: All logs

**Log Format**:
```
2024-06-12 10:30:45:123 error: POST /api/auth/login 401 123ms - 192.168.1.1
```

---

## Testing

Run tests with:
```bash
npm test                # Run all tests with coverage
npm run test:watch     # Watch mode for development
npm run test:verbose   # Verbose output
```

**Test Files**:
- `__tests__/validation.test.js` - Input validation tests
- `__tests__/passwordStrength.test.js` - Password validation tests
- `__tests__/csrf.test.js` - CSRF protection tests
- `__tests__/rateLimit.test.js` - Rate limiting tests

---

## Examples

### cURL - Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"ValidPass123!"}'
```

### cURL - Get Products

```bash
curl http://localhost:5000/api/products?category=Suits&limit=5
```

### cURL - Create Order (with CSRF)

```bash
# First, get CSRF token
TOKEN=$(curl -s http://localhost:5000/api/orders | grep -oP 'X-CSRF-Token: \K[^ ]*')

# Then create order
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "X-CSRF-Token: $TOKEN" \
  -d '{
    "paymentMethod":"card",
    "shippingAddress":{...}
  }'
```

---

## Support

For issues or questions, contact the development team.
