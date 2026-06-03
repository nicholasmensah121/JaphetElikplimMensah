document.addEventListener('DOMContentLoaded', async () => {
  const accountLinks = document.querySelectorAll('[data-account-link]');

  if (accountLinks.length === 0) {
    return;
  }

  let user = null;

  try {
    // SECURITY: Fetch user from server instead of localStorage to prevent XSS attacks
    if (apiService && apiService.hasStoredToken()) {
      try {
        const profile = await apiService.getProfile();
        user = profile.user;
      } catch (error) {
        console.warn('Failed to fetch user profile:', error);
        user = null;
      }
    }
  } catch (error) {
    user = null;
  }

  const firstName = user?.firstName?.trim();
  const lastName = user?.lastName?.trim();
  const displayName =
    firstName || lastName
      ? `Hi, ${[firstName, lastName].filter(Boolean)[0]}`
      : 'Account';

  accountLinks.forEach((link) => {
    link.textContent = displayName;
  });

  if (user?.role === 'admin') {
    const navList = document.querySelector('nav ul');
    if (navList && !navList.querySelector('.admin-link')) {
      const adminItem = document.createElement('li');
      adminItem.className = 'admin-link';
      const adminLink = document.createElement('a');
      adminLink.href = 'admin.html';
      adminLink.textContent = 'Admin';
      adminItem.appendChild(adminLink);
      const accountItem = accountLinks[0]?.closest('li');
      if (accountItem) {
        navList.insertBefore(adminItem, accountItem);
      } else {
        navList.appendChild(adminItem);
      }
    }
  }
});
