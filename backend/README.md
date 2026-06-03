# Gentlemen Parlor Backend API

Backend API for the Gentlemen Parlor e-commerce website built with Node.js, Express, and MongoDB.

## Features

- User authentication with JWT
- Product management
- Shopping cart functionality
- Order management
- Review system
- Admin controls

## Prerequisites

- Node.js v14+
- MongoDB
- npm or yarn

## Installation

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

5. Update `.env` with your configuration:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gentlemen-parlor
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d
STRIPE_API_KEY=your_stripe_api_key_here
NODE_ENV=development
```

## Running the Server

Development mode with auto-reload:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires auth)
- `PUT /api/auth/profile` - Update user profile (requires auth)

### Products

- `GET /api/products` - Get all products (with pagination and filtering)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)
- `POST /api/products/:id/reviews` - Add review to product (requires auth)

### Cart

- `GET /api/cart` - Get user cart (requires auth)
- `POST /api/cart/add` - Add item to cart (requires auth)
- `PUT /api/cart/update/:productId` - Update cart item quantity (requires auth)
- `DELETE /api/cart/remove/:productId` - Remove item from cart (requires auth)
- `DELETE /api/cart/clear` - Clear entire cart (requires auth)

### Orders

- `POST /api/orders` - Create order (requires auth)
- `GET /api/orders` - Get user orders (requires auth)
- `GET /api/orders/:id` - Get order by ID (requires auth)
- `PUT /api/orders/:id/status` - Update order status (admin)
- `PUT /api/orders/:id/cancel` - Cancel order (requires auth)

## Request Examples

### Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### Login User

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get All Products

```bash
curl http://localhost:5000/api/products?page=1&limit=10&category=Formal%20Wear
```

### Add to Cart

```bash
curl -X POST http://localhost:5000/api/cart/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": "PRODUCT_ID",
    "quantity": 1
  }'
```

### Create Order

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "shippingAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "USA"
    },
    "paymentMethod": "card"
  }'
```

## Database Schema

### User

- firstName (String, required)
- lastName (String, required)
- email (String, required, unique)
- password (String, required, hashed)
- phone (String, optional)
- address (Object)
- role (String, enum: ['customer', 'admin'], default: 'customer')
- isActive (Boolean, default: true)
- timestamps

### Product

- name (String, required)
- description (String, required)
- price (Number, required)
- category (String, enum: [...], required)
- image (String, required)
- images (Array of Strings)
- stock (Number, default: 0)
- rating (Number, 0-5, default: 0)
- reviews (Array of review objects)
- sku (String, unique)
- isActive (Boolean, default: true)
- timestamps

### Order

- userId (ObjectId, ref: User, required)
- items (Array of order items)
- totalAmount (Number, required)
- shippingAddress (Object)
- paymentMethod (String, enum: ['card', 'paypal', 'bank_transfer'])
- paymentStatus (String, enum: ['pending', 'completed', 'failed', 'cancelled'])
- orderStatus (String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
- trackingNumber (String, optional)
- notes (String, optional)
- timestamps

### Cart

- userId (ObjectId, ref: User, required)
- items (Array of cart items)
- totalItems (Number, default: 0)
- totalPrice (Number, default: 0)
- timestamps

## Error Handling

All endpoints return structured error responses:

```json
{
  "success": false,
  "status": 400,
  "message": "Error message here"
}
```

## Security

- Passwords are hashed using bcryptjs
- JWT tokens expire after 7 days
- Protected routes require valid JWT token
- CORS enabled for cross-origin requests
- Input validation on all endpoints

## Project Structure

```
backend/
├── config/
│   ├── database.js
│   └── config.js
├── controllers/
│   ├── authController.js
│   ├── productController.js
│   ├── cartController.js
│   └── orderController.js
├── middleware/
│   ├── auth.js
│   ├── errorHandler.js
│   └── validators.js
├── models/
│   ├── User.js
│   ├── Product.js
│   ├── Order.js
│   └── Cart.js
├── routes/
│   ├── authRoutes.js
│   ├── productRoutes.js
│   ├── cartRoutes.js
│   └── orderRoutes.js
├── utils/
│   ├── emailService.js
│   └── helpers.js
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## Next Steps

1. Set up MongoDB database
2. Configure environment variables
3. Install dependencies with `npm install`
4. Run the server with `npm run dev`
5. Create initial product data
6. Connect frontend to API

## Support

For issues or questions, please create an issue in the repository.
