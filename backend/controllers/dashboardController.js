const User = require('../models/User');
const Order = require('../models/Order');

const getGreeting = (firstName, lastName) => {
  const hour = new Date().getHours();
  const title = lastName ? `Mr. ${lastName}` : firstName || 'Gentleman';

  if (hour < 12) {
    return firstName ? `Welcome back, ${firstName}` : `Good morning, ${title}`;
  }

  if (hour < 18) {
    return lastName ? `Good afternoon, ${title}` : `Welcome back, ${firstName || title}`;
  }

  return lastName ? `Good evening, ${title}` : `Welcome back, ${firstName || title}`;
};

const getTierProgress = (points, tier) => {
  const thresholds = {
    Bronze: 500,
    Silver: 1500,
    Gold: 3000,
    Platinum: 5000,
  };

  const target = thresholds[tier] || 2000;
  return Math.min(100, Math.round((points / target) * 100));
};

const formatDate = (date) => {
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(date).toLocaleDateString('en-US', options);
};

const buildRecentActivity = (user, orders) => {
  const activity = [];

  if (orders.length > 0) {
    const lastOrder = orders[0];
    activity.push(`Placed order #${String(lastOrder._id).slice(-6)} on ${formatDate(lastOrder.createdAt)}.`);
    activity.push(`Last order status: ${lastOrder.orderStatus}.`);
  } else {
    activity.push('No recent orders yet. Start shopping the latest styles today.');
  }

  if (activity.length === 0) {
    activity.push('Explore our new collections for your next polished look.');
  }

  return activity;
};

exports.getDashboard = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const totalOrders = await Order.countDocuments({ userId: req.userId });
    const recentOrders = await Order.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(3);

    const dashboard = {
      greeting: getGreeting(user.firstName, user.lastName),
      totalOrders,
      recentActivity: buildRecentActivity(user, recentOrders),
      latestOrder: recentOrders[0] || null,
      measurements: user.measurements || {},
      paymentMethods: user.paymentMethods || [],
    };

    res.status(200).json({ success: true, dashboard });
  } catch (error) {
    next(error);
  }
};
