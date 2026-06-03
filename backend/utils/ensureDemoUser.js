const User = require('../models/User');

const DEMO_USERS = [
  {
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@example.com',
    password: 'Demo123456',
    role: 'customer',
  },
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'Admin123456',
    role: 'admin',
  },
];

const ensureDemoUser = async () => {
  // SECURITY: Never create demo users in production
  if (process.env.NODE_ENV === 'production') {
    console.warn('Skipping demo user creation in production environment.');
    return [];
  }

  const results = [];

  for (const userData of DEMO_USERS) {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      results.push(existingUser);
      continue;
    }

    const createdUser = await User.create(userData);
    console.log(`Demo user created: ${createdUser.email} (${createdUser.role})`);
    results.push(createdUser);
  }

  return results;
};

module.exports = ensureDemoUser;
