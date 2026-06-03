require('dotenv').config();
const Product = require('./models/Product');
const connectDB = require('./config/database');
const seedProducts = require('./data/seedProducts');

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert seed data
    await Product.insertMany(seedProducts);
    console.log(`${seedProducts.length} products seeded successfully`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
