// Smooth Page Transition Navigation
// Enables fade-in/fade-out animations between page navigation

class SmoothNavigation {
  constructor() {
    this.isNavigating = false;
    this.fadeDuration = 400; // milliseconds
    this.init();
  }

  init() {
    // Intercept all internal navigation links
    this.setupLinkListeners();
    
    // Fade in on page load
    this.fadeInPage();
  }

  setupLinkListeners() {
    // Select all navigation links
    const navLinks = document.querySelectorAll('nav a, a[data-account-link]');
    
    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        // Only intercept internal page navigation (not anchor links)
        if (href && !href.startsWith('#') && !href.startsWith('http')) {
          e.preventDefault();
          this.navigateToPage(href);
        }
      });
    });
  }

  fadeOutPage() {
    return new Promise((resolve) => {
      const body = document.body;
      body.classList.add('fade-out');
      
      setTimeout(() => {
        resolve();
      }, this.fadeDuration);
    });
  }

  fadeInPage() {
    const body = document.body;
    body.classList.remove('fade-out');
    body.style.animation = 'fadeIn 0.5s ease-in-out';
  }

  async navigateToPage(url) {
    if (this.isNavigating) return;
    
    this.isNavigating = true;
    
    try {
      // Fade out current page
      await this.fadeOutPage();
      
      // Navigate to the new page
      window.location.href = url;
    } catch (error) {
      console.error('Navigation error:', error);
      this.isNavigating = false;
    }
  }
}

// Initialize smooth navigation when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.smoothNav = new SmoothNavigation();
  });
} else {
  window.smoothNav = new SmoothNavigation();
}
