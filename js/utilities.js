// Utility Functions for Input Validation and Sanitization

class Validator {
  // Email validation
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email?.trim() || '');
  }

  // Password validation (min 8 chars, at least 1 uppercase, 1 lowercase, 1 number)
  isValidPassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\-_#]).{8,}$/;
    return passwordRegex.test(password || '');
  }

  // Phone validation (basic international format)
  isValidPhone(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(phone?.trim() || '');
  }

  // Name validation
  isValidName(name) {
    return name?.trim().length >= 2 && name.trim().length <= 50;
  }

  // URL validation
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Quantity validation
  isValidQuantity(qty) {
    const num = Number(qty);
    return Number.isInteger(num) && num > 0 && num <= 999;
  }
}

class Sanitizer {
  // Remove HTML tags and encode special characters
  sanitizeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Trim and normalize whitespace
  sanitizeString(str) {
    return (str || '').trim().replace(/\s+/g, ' ');
  }

  // Remove special characters except allowed ones
  sanitizeInput(str, allowedChars = '') {
    if (!str) return '';
    const regex = new RegExp(`[^a-zA-Z0-9\\s${allowedChars}]`, 'g');
    return str.replace(regex, '').trim();
  }

  // Sanitize form data object
  sanitizeFormData(formData) {
    const sanitized = {};
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}

class ErrorHandler {
  getErrorMessage(error) {
    if (typeof error === 'string') {
      return error;
    }

    if (error?.response?.data?.message) {
      return error.response.data.message;
    }

    if (error?.message) {
      return error.message;
    }

    if (error?.statusText) {
      return `Error: ${error.statusText}`;
    }

    return 'An unexpected error occurred. Please try again.';
  }

  getErrorCode(error) {
    return error?.response?.status || error?.status || 500;
  }

  isNetworkError(error) {
    return !error?.response || error?.message?.includes('Network');
  }

  isTimeoutError(error) {
    return error?.code === 'ECONNABORTED' || error?.message?.includes('timeout');
  }
}

class StorageManager {
  set(key, value, expiresIn = null) {
    try {
      const item = {
        value,
        timestamp: Date.now(),
        expiresIn
      };
      localStorage.setItem(key, JSON.stringify(item));
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  }

  get(key) {
    try {
      const item = JSON.parse(localStorage.getItem(key));
      
      if (!item) return null;

      // Check if expired
      if (item.expiresIn) {
        const age = Date.now() - item.timestamp;
        if (age > item.expiresIn) {
          localStorage.removeItem(key);
          return null;
        }
      }

      return item.value;
    } catch (error) {
      console.error('Storage error:', error);
      return null;
    }
  }

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  }

  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  }
}

class LoadingManager {
  constructor() {
    this.loadingCount = 0;
  }

  show() {
    this.loadingCount++;
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
      // Use class toggle so CSS rules (including !important) control visibility
      spinner.classList.remove('hidden');
    }
  }

  hide() {
    this.loadingCount = Math.max(0, this.loadingCount - 1);
    if (this.loadingCount === 0) {
      const spinner = document.getElementById('loadingSpinner');
      if (spinner) {
        spinner.classList.add('hidden');
      }
    }
  }

  reset() {
    this.loadingCount = 0;
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
      spinner.classList.add('hidden');
    }
  }
}

// Global instances
const validator = new Validator();
const sanitizer = new Sanitizer();
const errorHandler = new ErrorHandler();
const storageManager = new StorageManager();
const loadingManager = new LoadingManager();

// Responsive helper: update CSS var with actual header height to prevent overlap
function updateHeaderHeightVar() {
  try {
    const header = document.querySelector('header');
    if (!header) return;
    const height = header.offsetHeight;
    document.documentElement.style.setProperty('--header-height-px', height + 'px');
  } catch (e) {
    // fail silently
  }
}

let _hdrResizeTimer = null;
window.addEventListener('load', () => {
  updateHeaderHeightVar();
});
window.addEventListener('resize', () => {
  clearTimeout(_hdrResizeTimer);
  _hdrResizeTimer = setTimeout(updateHeaderHeightVar, 120);
});

// Mobile nav toggle: collapse/expand primary nav and update header height var
document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('.nav-toggle');
  const header = document.querySelector('header');
  const primaryNav = document.getElementById('primary-nav');

  if (!navToggle || !header || !primaryNav) return;

  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    header.classList.toggle('nav-open');

    // Force update header height variable after menu animation
    setTimeout(updateHeaderHeightVar, 280);
  });

  // Close nav on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && header.classList.contains('nav-open')) {
      header.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
      updateHeaderHeightVar();
    }
  });
});
