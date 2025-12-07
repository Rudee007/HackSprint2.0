// services/apiService.js (CRITICAL FIX)
const API_BASE_URL = 'http://localhost:3003/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getAuthToken() {
    // ✅ Check all possible token keys
    return localStorage.getItem('accessToken') || 
           localStorage.getItem('token') || 
           localStorage.getItem('authToken') ||
           localStorage.getItem('jwt') ||
           localStorage.getItem('adminToken');
  }

  // Set default headers
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        // ✅ CRITICAL: Add "Bearer " prefix
        headers.Authorization = `Bearer ${token}`;
        console.log('✅ Token added to headers:', `Bearer ${token.substring(0, 20)}...`);
      } else {
        console.warn('⚠️ No token found in localStorage');
      }
    }

    return headers;
  }

  // Generic request method with error handling
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(options.auth !== false),
      ...options,
    };

    console.log(`📡 API Request: ${options.method || 'GET'} ${endpoint}`);

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          // Token expired or invalid
          console.error('❌ 401 Unauthorized - clearing tokens');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('token');
          localStorage.removeItem('authToken');
          localStorage.removeItem('loggedInTherapist');
          localStorage.removeItem('loggedInDoctor');
          localStorage.removeItem('loggedInAdmin');
          localStorage.removeItem('loggedInUser');
          
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('login')) {
            // Determine redirect based on current path
            if (window.location.pathname.includes('/admin')) {
              window.location.href = '/admin-login';
            } else if (window.location.pathname.includes('/doctor')) {
              window.location.href = '/doctor-login';
            } else {
              window.location.href = '/therapist-login';
            }
          }
        }
        throw new Error(data.message || data.error?.message || `HTTP error! status: ${response.status}`);
      }

      console.log(`✅ API Success: ${options.method || 'GET'} ${endpoint}`);
      return data;
    } catch (error) {
      console.error('❌ API request failed:', error);
      throw error;
    }
  }

  // HTTP methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiService = new ApiService();
