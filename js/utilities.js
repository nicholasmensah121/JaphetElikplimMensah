// Utility Functions for Input Validation and Sanitization

class Validator {
  // Email validation
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email?.trim() || '');
  }

  // Password validation (min 8 chars, at least 1 uppercase, 1 lowercase, 1 number)
  static isValidPassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password || '');
  }

  // Phone validation (basic international format)
  static isValidPhone(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(phone?.trim() || '');
  }

  // Name validation
  static isValidName(name) {
    return name?.trim().length >= 2 && name.trim().length <= 50;
  }

  // URL validation
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Quantity validation
  static isValidQuantity(qty) {
    const num = Number(qty);
    return Number.isInteger(num) && num > 0 && num <= 999;
  }
}

class Sanitizer {
  // Remove HTML tags and encode special characters
  static sanitizeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Trim and normalize whitespace
  static sanitizeString(str) {
    return (str || '').trim().replace(/\s+/g, ' ');
  }

  // Remove special characters except allowed ones
  static sanitizeInput(str, allowedChars = '') {
    if (!str) return '';
    const regex = new RegExp(`[^a-zA-Z0-9\\s${allowedChars}]`, 'g');
    return str.replace(regex, '').trim();
  }

  // Sanitize form data object
  static sanitizeFormData(formData) {
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
  static getErrorMessage(error) {
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

  static getErrorCode(error) {
    return error?.response?.status || error?.status || 500;
  }

  static isNetworkError(error) {
    return !error?.response || error?.message?.includes('Network');
  }

  static isTimeoutError(error) {
    return error?.code === 'ECONNABORTED' || error?.message?.includes('timeout');
  }
}

class StorageManager {
  static set(key, value, expiresIn = null) {
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

  static get(key) {
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

  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  }

  static clear() {
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
      spinner.style.display = 'flex';
    }
  }

  hide() {
    this.loadingCount = Math.max(0, this.loadingCount - 1);
    if (this.loadingCount === 0) {
      const spinner = document.getElementById('loadingSpinner');
      if (spinner) {
        spinner.style.display = 'none';
      }
    }
  }

  reset() {
    this.loadingCount = 0;
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
      spinner.style.display = 'none';
    }
  }
}

// Global instances
const validator = new Validator();
const sanitizer = new Sanitizer();
const errorHandler = new ErrorHandler();
const storageManager = new StorageManager();
const loadingManager = new LoadingManager();
