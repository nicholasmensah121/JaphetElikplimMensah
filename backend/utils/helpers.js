/**
 * DEPRECATED: These helper functions are currently unused
 * Consider removing in future refactoring or implement if needed
 */

const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `ORD-${timestamp}-${random}`;
};

const generateSKU = (category, index) => {
  const prefix = category.substring(0, 3).toUpperCase();
  return `${prefix}-${Date.now()}-${index}`;
};

module.exports = { generateOrderNumber, generateSKU };
