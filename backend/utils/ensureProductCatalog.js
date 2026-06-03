const Product = require('../models/Product');
const seedProducts = require('../data/seedProducts');

const ensureProductCatalog = async () => {
  const productCount = await Product.countDocuments();

  if (productCount > 0) {
    return productCount;
  }

  await Product.insertMany(seedProducts);
  console.log(`${seedProducts.length} products seeded automatically`);
  return seedProducts.length;
};

module.exports = ensureProductCatalog;
