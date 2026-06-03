// Enhanced API Service with Error Handling, Retry Logic, and Timeouts
// This file handles all communication between the frontend and backend with resilience

function resolveApiBaseUrl() {
  const configuredBaseUrl =
    window.__API_BASE_URL__ || storageManager.get('apiBaseUrl');

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, '');
  }

  if (window.location.protocol === 'file:') {
    return 'http://localhost:5000/api';
  }

  return `${window.location.protocol}//${window.location.hostname}:5000/api`;
}

const API_BASE_URL = resolveApiBaseUrl();
const FILE_PROTOCOL_TOKEN_KEY = 'authToken';

class EnhancedAPIService {
  constructor(options = {}) {
    this.baseURL = API_BASE_URL;
    this.token = this.getStoredToken();
    this.timeout = options.timeout || 15000;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.requestCache = new Map();
    this.cacheTimeout = options.cacheTimeout || 5 * 60 * 1000;
    this.listeners = [];
  }

  onAuthChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  notifyAuthChange(isAuthenticated, user = null) {
    this.listeners.forEach(callback => {
      try {
        callback({ isAuthenticated, user });
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }

  createAbortController() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    return { controller, timeoutId };
  }

  getCacheKey(endpoint, options) {
    const method = options?.method || 'GET';
    const body = options?.body || '';
    return `${method}:${endpoint}:${body}`;
  }

  getFromCache(cacheKey) {
    const cached = this.requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.requestCache.delete(cacheKey);
    return null;
  }

  setCache(cacheKey, data) {
    this.requestCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.requestCache.clear();
  }

  getStoredToken() {
    if (window.location.protocol === 'file:') {
      return storageManager.get(FILE_PROTOCOL_TOKEN_KEY);
    }

    return sessionStorage.getItem(FILE_PROTOCOL_TOKEN_KEY);
  }

  hasStoredToken() {
    if (window.location.protocol === 'file:') {
      return !!storageManager.get(FILE_PROTOCOL_TOKEN_KEY);
    }

    return !!sessionStorage.getItem(FILE_PROTOCOL_TOKEN_KEY);
  }

  persistToken(token) {
    this.token = token;

    if (window.location.protocol === 'file:') {
      storageManager.set(FILE_PROTOCOL_TOKEN_KEY, token, 12 * 60 * 60 * 1000);
      return;
    }

    sessionStorage.setItem(FILE_PROTOCOL_TOKEN_KEY, token);
  }

  clearStoredToken() {
    this.token = null;
    storageManager.remove(FILE_PROTOCOL_TOKEN_KEY);
    sessionStorage.removeItem(FILE_PROTOCOL_TOKEN_KEY);
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = this.getCacheKey(endpoint, options);
    const method = options.method || 'GET';

    if (method === 'GET' && !options.skipCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    if (loadingManager) {
      loadingManager.show();
    }

    let lastError = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const { controller, timeoutId } = this.createAbortController();

        const headers = {
          'Content-Type': 'application/json',
          ...options.headers,
        };

        if (this.token) {
          headers.Authorization = `Bearer ${this.token}`;
        }

        const response = await fetch(url, {
          ...options,
          headers,
          credentials: 'include',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (loadingManager) {
          loadingManager.hide();
        }

        if (!response.ok) {
          if (response.status === 401) {
            this.handleUnauthorized();
            throw new Error(data.message || 'Unauthorized');
          }

          throw new Error(data.message || `API Error: ${response.status}`);
        }

        if (method === 'GET') {
          this.setCache(cacheKey, data);
        }

        return data;
      } catch (error) {
        lastError = error;

        const isTimeoutError = error.name === 'AbortError';
        const isNetworkError = error instanceof TypeError;
        const shouldRetry = (isTimeoutError || isNetworkError) && attempt < this.maxRetries;

        if (shouldRetry) {
          const delayMs = this.retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }

        if (loadingManager) {
          loadingManager.hide();
        }

        throw error;
      }
    }

    if (loadingManager) {
      loadingManager.hide();
    }

    throw lastError;
  }

  handleUnauthorized() {
    this.clearStoredToken();
    // SECURITY: Don't store sensitive user data in localStorage (XSS vulnerability)
    this.notifyAuthChange(false, null);
    window.location.href = 'login.html';
  }

  async register(userData) {
    try {
      const sanitized = sanitizer.sanitizeFormData(userData);

      if (!validator.isValidName(sanitized.firstName)) {
        throw new Error('Invalid first name');
      }
      if (!validator.isValidName(sanitized.lastName)) {
        throw new Error('Invalid last name');
      }
      if (!validator.isValidEmail(sanitized.email)) {
        throw new Error('Invalid email address');
      }
      if (!validator.isValidPassword(sanitized.password)) {
        throw new Error('Password must be at least 8 characters with uppercase, lowercase, and numbers');
      }
      if (sanitized.password !== sanitized.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const response = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(sanitized),
      });

      if (response.token) {
        this.persistToken(response.token);
      }

      // SECURITY: Only store token, not user data (fetch from /auth/profile when needed)
      this.notifyAuthChange(true, response.user);

      return response;
    } catch (error) {
      console.error('Registration Error:', error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      if (!validator.isValidEmail(email)) {
        throw new Error('Invalid email address');
      }
      if (!password) {
        throw new Error('Password is required');
      }

      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      });

      if (response.token) {
        this.persistToken(response.token);
      }

      // SECURITY: Only store token, not user data (fetch from /auth/profile when needed)
      this.notifyAuthChange(true, response.user);

      return response;
    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } finally {
      this.clearStoredToken();
    }
    // SECURITY: Don't store sensitive user data in localStorage
    this.clearCache();
    this.notifyAuthChange(false, null);
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(userData) {
    try {
      const sanitized = sanitizer.sanitizeFormData(userData);
      const response = await this.request('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(sanitized),
      });

      // SECURITY: Only store token, user data fetched from server
      this.notifyAuthChange(true, response.user);

      return response;
    } catch (error) {
      console.error('Update Profile Error:', error);
      throw error;
    }
  }

  async getProducts(page = 1, limit = 10, category = null, search = null) {
    try {
      let query = `/products?page=${page}&limit=${limit}`;
      if (category) query += `&category=${sanitizer.sanitizeString(category)}`;
      if (search) query += `&search=${sanitizer.sanitizeString(search)}`;
      return this.request(query, { skipCache: search !== null });
    } catch (error) {
      console.error('Get Products Error:', error);
      throw error;
    }
  }

  async getProductById(id) {
    try {
      if (!id) throw new Error('Product ID is required');
      return this.request(`/products/${sanitizer.sanitizeString(id)}`);
    } catch (error) {
      console.error('Get Product Error:', error);
      throw error;
    }
  }

  async addReview(productId, rating, comment) {
    try {
      if (!productId) throw new Error('Product ID is required');
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      return this.request(`/products/${sanitizer.sanitizeString(productId)}/reviews`, {
        method: 'POST',
        body: JSON.stringify({
          rating,
          comment: sanitizer.sanitizeString(comment)
        }),
      });
    } catch (error) {
      console.error('Add Review Error:', error);
      throw error;
    }
  }

  async getCart() {
    try {
      return this.request('/cart');
    } catch (error) {
      console.error('Get Cart Error:', error);
      throw error;
    }
  }

  async addToCart(productReference, quantity = 1) {
    try {
      if (!validator.isValidQuantity(quantity)) {
        throw new Error('Invalid quantity');
      }

      const payload =
        typeof productReference === 'object' && productReference !== null
          ? { ...productReference, quantity }
          : { productId: sanitizer.sanitizeString(productReference), quantity };

      return this.request('/cart/add', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Add to Cart Error:', error);
      throw error;
    }
  }

  async updateCartItem(productId, quantity) {
    try {
      if (!validator.isValidQuantity(quantity)) {
        throw new Error('Invalid quantity');
      }

      return this.request(`/cart/update/${sanitizer.sanitizeString(productId)}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      });
    } catch (error) {
      console.error('Update Cart Error:', error);
      throw error;
    }
  }

  async removeFromCart(productId) {
    try {
      if (!productId) throw new Error('Product ID is required');

      return this.request(`/cart/remove/${sanitizer.sanitizeString(productId)}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Remove from Cart Error:', error);
      throw error;
    }
  }

  async clearCart() {
    try {
      return this.request('/cart/clear', {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Clear Cart Error:', error);
      throw error;
    }
  }

  async createOrder(shippingAddress, paymentMethod) {
    try {
      const payload = {
        shippingAddress: sanitizer.sanitizeFormData(shippingAddress),
        paymentMethod: sanitizer.sanitizeString(paymentMethod),
      };

      return this.request('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Create Order Error:', error);
      throw error;
    }
  }

  async getOrders() {
    try {
      return this.request('/orders');
    } catch (error) {
      console.error('Get Orders Error:', error);
      throw error;
    }
  }

  async getOrderById(id) {
    try {
      if (!id) throw new Error('Order ID is required');
      return this.request(`/orders/${sanitizer.sanitizeString(id)}`);
    } catch (error) {
      console.error('Get Order Error:', error);
      throw error;
    }
  }

  async cancelOrder(id) {
    try {
      if (!id) throw new Error('Order ID is required');

      return this.request(`/orders/${sanitizer.sanitizeString(id)}/cancel`, {
        method: 'PUT',
      });
    } catch (error) {
      console.error('Cancel Order Error:', error);
      throw error;
    }
  }

  async submitContact(contactData) {
    try {
      const sanitized = sanitizer.sanitizeFormData(contactData);

      if (!validator.isValidName(sanitized.name)) {
        throw new Error('Invalid name');
      }
      if (!validator.isValidEmail(sanitized.email)) {
        throw new Error('Invalid email');
      }

      return this.request('/contact', {
        method: 'POST',
        body: JSON.stringify(sanitized),
      });
    } catch (error) {
      console.error('Contact Error:', error);
      throw error;
    }
  }

  async getContactMessages() {
    try {
      return this.request('/contact');
    } catch (error) {
      console.error('Get Contact Messages Error:', error);
      throw error;
    }
  }

  async deleteContactMessage(contactId) {
    try {
      if (!contactId) {
        throw new Error('Contact ID is required');
      }

      return this.request(`/contact/${sanitizer.sanitizeString(contactId)}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Delete Contact Message Error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const apiService = new EnhancedAPIService({
  timeout: 15000,
  maxRetries: 3,
  retryDelay: 1000,
  cacheTimeout: 5 * 60 * 1000
});

// Export for use in HTML scripts
window.apiService = apiService;
