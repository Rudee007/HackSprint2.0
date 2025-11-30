// API Configuration
export const API_CONFIG = {
  // Update this when you get your backend URL
  BASE_URL: process.env.REACT_APP_API_BASE_URL || "http://localhost:3003/api",
  
  // Set to false when you have real backend endpoints
  USE_MOCK_DATA: !process.env.REACT_APP_API_BASE_URL,
  
  // API Endpoints
  ENDPOINTS: {
    DOCTORS: "/doctors",
    DOCTOR_DETAILS: (doctorId) => `/doctors/${doctorId}`,
    RECOMMENDATIONS: "/recommendations",
    APPOINTMENTS: "/appointments"
  },
  
  // Request timeout
  TIMEOUT: 10000
};

// When you get your backend URL, just update your .env file:
// REACT_APP_API_BASE_URL=https://your-backend-url.com/api