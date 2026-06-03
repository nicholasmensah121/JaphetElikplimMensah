# Gentlemen Parlor - Complete Setup Guide

## Backend Setup

### Step 1: Install Dependencies

Navigate to the backend directory and install all required packages:

```bash
cd backend
npm install
```

### Step 2: Configure Environment

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your settings:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gentlemen-parlor
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
STRIPE_API_KEY=your_stripe_api_key_here
NODE_ENV=development
```

### Step 3: Set Up MongoDB

Install MongoDB locally or use MongoDB Atlas:

**Option 1: Local MongoDB**
- Download from https://www.mongodb.com/try/download/community
- Follow the installation guide for your OS
- MongoDB should run on `mongodb://localhost:27017`

**Option 2: MongoDB Atlas (Cloud)**
- Sign up at https://www.mongodb.com/cloud/atlas
- Create a cluster
- Get connection string and update `MONGODB_URI` in `.env`

### Step 4: Seed Database

Add initial product data to the database:

```bash
node seed.js
```

### Step 5: Start the Server

Development mode (with auto-reload):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The server will run on `http://localhost:5000`

## Frontend Integration

### Step 1: Copy API Service

Copy the `FRONTEND_INTEGRATION.js` file to your frontend project:

```bash
cp FRONTEND_INTEGRATION.js ../js/apiService.js
```

### Step 2: Update Frontend HTML

In your `index.html`, add the API service before your existing scripts:

```html
<script src="js/apiService.js"></script>
<script src="js/app.js"></script> <!-- Your existing app.js -->
```

### Step 3: Update Add to Cart Button

Replace the add-to-cart button logic with API calls:

```javascript
document.querySelectorAll('.add-to-cart').forEach(button => {
  button.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const card = button.closest('.product-card');
    const productName = card.querySelector('h3').textContent;
    
    // You'll need to get the product ID from the card data
    // This is a simplified example
    try {
      const response = await apiService.addToCart(productId, 1);
      alert(productName + ' added to cart!');
    } catch (error) {
      alert('Error adding to cart: ' + error.message);
    }
  });
});
```

### Step 4: Create Cart Page

Create a new file `cart.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Shopping Cart - GENTLEMEN PARLOR</title>
    <link rel="stylesheet" href="style.css" />
</head>
<body>
    <header><!-- Same as index.html --></header>

    <section class="cart">
        <div class="container">
            <h2>Shopping Cart</h2>
            <div id="cartItems"></div>
            <div class="cart-summary">
                <p>Total: $<span id="cartTotal">0.00</span></p>
                <button id="checkoutBtn" class="btn">Proceed to Checkout</button>
            </div>
        </div>
    </section>

    <footer><!-- Same as index.html --></footer>

    <script src="js/apiService.js"></script>
    <script>
        async function loadCart() {
            try {
                const cart = await apiService.getCart();
                // Display cart items
                console.log(cart);
            } catch (error) {
                console.error('Error loading cart:', error);
            }
        }

        loadCart();
    </script>
</body>
</html>
```

### Step 5: Create Authentication Pages

Create `login.html` and `register.html` with forms that use the API service.

## Testing the API

### Test Authentication

Register:
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

Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Test Products

Get products:
```bash
curl http://localhost:5000/api/products
```

Get single product:
```bash
curl http://localhost:5000/api/products/PRODUCT_ID
```

## Deployment

### Option 1: Deploy to Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Set environment variables:
   ```bash
   heroku config:set MONGODB_URI=your_mongodb_url
   heroku config:set JWT_SECRET=your_jwt_secret
   ```
5. Deploy: `git push heroku main`

### Option 2: Deploy to AWS

1. Set up EC2 instance
2. Install Node.js and MongoDB
3. Clone repository
4. Set up environment variables
5. Use PM2 or similar for process management

### Option 3: Deploy to DigitalOcean

1. Create Droplet
2. Install Node.js and MongoDB
3. Configure firewall
4. Clone and deploy application

## Troubleshooting

### MongoDB Connection Error

**Problem**: Cannot connect to MongoDB

**Solution**:
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- For MongoDB Atlas, ensure IP is whitelisted

### CORS Error

**Problem**: Frontend cannot access backend API

**Solution**:
- Ensure CORS is enabled in server.js
- Check that frontend URL is allowed
- Update CORS configuration if needed

### JWT Token Error

**Problem**: "Invalid token" error

**Solution**:
- Ensure token is included in Authorization header
- Check JWT_SECRET matches between login and request
- Verify token hasn't expired

### Port Already in Use

**Problem**: Port 5000 is already in use

**Solution**:
- Change PORT in .env
- Kill process using port 5000
- Use different port

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [JWT Documentation](https://jwt.io/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-dev-environment-setup/)

## Support

For issues or questions:
1. Check the README.md in the backend directory
2. Review error logs
3. Check API response messages
4. Verify environment configuration
