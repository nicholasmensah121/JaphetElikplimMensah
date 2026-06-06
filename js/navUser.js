document.addEventListener('DOMContentLoaded', async () => {
  const accountLinks = document.querySelectorAll('[data-account-link]');

  if (accountLinks.length === 0) {
    return;
  }

  let user = storageManager.get('user');

  if (user && apiService && !apiService.hasStoredToken()) {
    // If a user object is cached but no auth token is present, clear stale state.
    storageManager.remove('user');
    user = null;
  }

  if (!user && apiService && apiService.hasStoredToken()) {
    try {
      const profile = await apiService.getProfile();
      user = profile.user;
      if (user) {
        storageManager.set('user', user);
      }
    } catch (error) {
      console.warn('Failed to fetch user profile:', error);
      user = null;
    }
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

  // Subscribe to auth changes so the nav updates live when login/logout/profile change
  if (window.apiService && typeof apiService.onAuthChange === 'function') {
    apiService.onAuthChange(({ isAuthenticated, user }) => {
      const displayName = isAuthenticated && user
        ? (user.firstName || user.lastName) ? `Hi, ${[user.firstName, user.lastName].filter(Boolean)[0]}` : 'Account'
        : 'Account';

      accountLinks.forEach((link) => { link.textContent = displayName; });

      if (!isAuthenticated) {
        // Ensure local cache cleared
        try { storageManager.remove('user'); } catch (e) { /* ignore */ }
      }
    });
  }
});
