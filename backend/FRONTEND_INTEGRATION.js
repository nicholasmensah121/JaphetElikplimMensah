// Frontend API Service
// Place this file in your frontend project (e.g., js/apiService.js)

const API_BASE_URL = 'http://localhost:5000/api';
const FILE_PROTOCOL_TOKEN_KEY = 'authToken';

class APIService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = this.getStoredToken();
  }

  getStoredToken() {
    if (window.location.protocol === 'file:') {
      try {
        const item = JSON.parse(localStorage.getItem(FILE_PROTOCOL_TOKEN_KEY));
        return item?.value || null;
      } catch {
        return null;
      }
    }

    return sessionStorage.getItem(FILE_PROTOCOL_TOKEN_KEY);
  }

  persistToken(token) {
    this.token = token;

    if (window.location.protocol === 'file:') {
      localStorage.setItem(FILE_PROTOCOL_TOKEN_KEY, JSON.stringify({ value: token, timestamp: Date.now() }));
      return;
    }

    sessionStorage.setItem(FILE_PROTOCOL_TOKEN_KEY, token);
  }

  clearStoredToken() {
    this.token = null;
    localStorage.removeItem(FILE_PROTOCOL_TOKEN_KEY);
    sessionStorage.removeItem(FILE_PROTOCOL_TOKEN_KEY);
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.token) {
      this.persistToken(response.token);
    }

    return response;
  }

  async logout() {
    try {
      return await this.request('/auth/logout', {
        method: 'POST',
      });
    } finally {
      this.clearStoredToken();
    }
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(userData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Products
  async getProducts(page = 1, limit = 10, category = null, search = null) {
    let query = `/products?page=${page}&limit=${limit}`;
    if (category) query += `&category=${category}`;
    if (search) query += `&search=${search}`;
    return this.request(query);
  }

  async getProductById(id) {
    return this.request(`/products/${id}`);
  }

  async addReview(productId, rating, comment) {
    return this.request(`/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
  }

  // Cart
  async getCart() {
    return this.request('/cart');
  }

  async addToCart(productId, quantity) {
    return this.request('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  }

  async updateCartItem(productId, quantity) {
    return this.request(`/cart/update/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(productId) {
    return this.request(`/cart/remove/${productId}`, {
      method: 'DELETE',
    });
  }

  async clearCart() {
    return this.request('/cart/clear', {
      method: 'DELETE',
    });
  }

  // Orders
  async createOrder(shippingAddress, paymentMethod) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify({ shippingAddress, paymentMethod }),
    });
  }

  async getOrders() {
    return this.request('/orders');
  }

  async getOrderById(id) {
    return this.request(`/orders/${id}`);
  }

  async cancelOrder(id) {
    return this.request(`/orders/${id}/cancel`, {
      method: 'PUT',
    });
  }
}

// Create singleton instance
const apiService = new APIService();

// Export for use in HTML scripts
window.apiService = apiService;
