// src/services/realtimeSessionService.js (FIXED)
import axios from 'axios';

class RealtimeSessionService {
  constructor() {
    this.baseURL = 'http://localhost:3003/api';
    this.cache = new Map();
    this.activeRequests = new Map();
    this.lastFetchTimes = new Map();
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Get token from multiple possible sources
        const token = localStorage.getItem('accessToken') || 
                      localStorage.getItem('token') || 
                      localStorage.getItem('authToken');
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Only log unique requests to reduce console spam
        const requestKey = `${config.method?.toUpperCase()} ${config.url}`;
        if (!this.loggedRequests) this.loggedRequests = new Set();
        if (!this.loggedRequests.has(requestKey)) {
          console.log(`🔗 API Request: ${requestKey}`);
          this.loggedRequests.add(requestKey);
          setTimeout(() => this.loggedRequests.delete(requestKey), 30000);
        }
        
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // ✅ FIXED: Add response interceptor with proper role-based redirect
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('❌ RealTime Session API Error:', error);
        
        // Handle auth errors
        if (error.response?.status === 401) {
          console.error('❌ Unauthorized - token may be expired');
          
          // ✅ FIXED: Determine user role and redirect appropriately
          const userRole = this.getUserRole();
          const loginRoute = this.getLoginRoute(userRole);
          
          console.log(`User role: ${userRole}, Redirecting to: ${loginRoute}`);
          
          // Clear auth data
          this.clearAuthData();
          
          // Prevent redirect loop
          if (!window.location.pathname.includes('login')) {
            window.location.href = loginRoute;
          }
        }
        
        if (error.response?.status === 403) {
          console.error('❌ Forbidden - insufficient permissions');
        }
        
        return Promise.reject(error);
      }
    );
  }

  // ✅ NEW: Get user role from localStorage
  getUserRole() {
    try {
      // Check different possible user storage keys
      const userKeys = [
        'loggedInUser',
        'loggedInAdmin', 
        'loggedInDoctor',
        'loggedInTherapist',
        'user'
      ];

      for (const key of userKeys) {
        const userStr = localStorage.getItem(key);
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.role) return user.role;
          if (user.userType) return user.userType;
          
          // Infer from key name
          if (key.includes('Admin')) return 'admin';
          if (key.includes('Doctor')) return 'doctor';
          if (key.includes('Therapist')) return 'therapist';
        }
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
    return null;
  }

  // ✅ NEW: Get appropriate login route based on role
  getLoginRoute(role) {
    const loginRoutes = {
      'admin': '/admin-login',
      'doctor': '/doctor-login',
      'therapist': '/therapist-login',
      'patient': '/patient-login'
    };
    return loginRoutes[role] || '/login'; // Generic fallback
  }

  // ✅ NEW: Clear all authentication data
  clearAuthData() {
    console.log('🧹 Clearing all authentication data');
    const authKeys = [
      'accessToken',
      'token',
      'authToken',
      'loggedInTherapist',
      'loggedInDoctor',
      'loggedInAdmin',
      'loggedInUser',
      'user'
    ];
    
    authKeys.forEach(key => localStorage.removeItem(key));
  }

  // Check if request should be throttled
  shouldThrottle(cacheKey, minInterval = 3000) {
    const lastFetch = this.lastFetchTimes.get(cacheKey);
    const now = Date.now();
    
    if (lastFetch && (now - lastFetch) < minInterval) {
      console.log(`🚫 Throttling request: ${cacheKey} (${now - lastFetch}ms ago)`);
      return true;
    }
    
    return false;
  }

  // Get cached data if available
  getCachedData(cacheKey, maxAge = 30000) {
    const cached = this.cache.get(cacheKey);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < maxAge) {
        console.log(`📋 Using cached data: ${cacheKey} (${Math.round(age/1000)}s old)`);
        return cached.data;
      } else {
        this.cache.delete(cacheKey);
      }
    }
    return null;
  }

  // Cache response data
  setCachedData(cacheKey, data) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    // Auto-cleanup after 5 minutes
    setTimeout(() => {
      this.cache.delete(cacheKey);
    }, 300000);
  }

  // Make request with deduplication
  async makeRequest(url, options = {}, cacheKey = null) {
    const requestKey = `${options.method || 'GET'}_${url}_${JSON.stringify(options.params || {})}`;
    
    // Return cached data if available
    if (cacheKey) {
      const cached = this.getCachedData(cacheKey);
      if (cached && !this.shouldThrottle(cacheKey)) {
        return { data: cached };
      }
    }

    // Check if same request is already in progress
    if (this.activeRequests.has(requestKey)) {
      console.log(`⏳ Request in progress, waiting: ${url}`);
      return this.activeRequests.get(requestKey);
    }

    // Update throttling timestamp
    if (cacheKey) {
      this.lastFetchTimes.set(cacheKey, Date.now());
    }

    // Make the actual request
    const requestPromise = this.axiosInstance.request({
      url,
      ...options
    }).then(response => {
      // Cache successful responses
      if (cacheKey && response.data) {
        this.setCachedData(cacheKey, response.data);
      }
      return response;
    }).finally(() => {
      // Clean up active request tracking
      this.activeRequests.delete(requestKey);
    });

    this.activeRequests.set(requestKey, requestPromise);
    return requestPromise;
  }

  isAuthenticated() {
    const token = localStorage.getItem('accessToken') || 
                  localStorage.getItem('token') || 
                  localStorage.getItem('authToken');
    return !!token;
  }

  // ... (rest of your methods remain the same)

  // Clear all caches and active requests
  clearCache() {
    console.log('🧹 Clearing service cache');
    this.cache.clear();
    this.activeRequests.clear();
    this.lastFetchTimes.clear();
    if (this.loggedRequests) {
      this.loggedRequests.clear();
    }
  }
}

export default new RealtimeSessionService();
