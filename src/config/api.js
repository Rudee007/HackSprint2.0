// API Configuration
export const API_CONFIG = {
  // Backend URL - defaults to local development server
  BASE_URL: process.env.REACT_APP_API_BASE_URL || "http://localhost:3003/api",
  
  // Set to false when you have real backend endpoints
  USE_MOCK_DATA: false, // Always try real API first, fallback to mock on error
  
  // API Endpoints
  ENDPOINTS: {
    // User endpoints
    USER_DETAILS: (userId) => `/users/${userId}`,
    
    // Booking endpoints
    CHECK_AVAILABILITY: "/booking/check-availability",
    CREATE_BOOKING: "/booking/create",
    PROVIDER_BOOKINGS: (providerId) => `/booking/provider/${providerId}/bookings`,
    ALTERNATIVE_SLOTS: "/booking/alternative-slots",
    
    // Notification endpoints
    PATIENT_NOTIFICATIONS: (userId) => `/notifications/patient/${userId}`,
    MARK_NOTIFICATION_READ: (notificationId) => `/notifications/${notificationId}/read`,
    MARK_ALL_READ: (userId) => `/notifications/patient/${userId}/read-all`,
    
    // Legacy endpoints
    DOCTORS: "/doctors",
    DOCTOR_DETAILS: (doctorId) => `/doctors/${doctorId}`,
    RECOMMENDATIONS: "/recommendations",
    APPOINTMENTS: "/appointments"
  },
  
  // Request timeout
  TIMEOUT: 10000
};

// Environment setup:
// Create .env.local file with: REACT_APP_API_BASE_URL=http://localhost:3003/api