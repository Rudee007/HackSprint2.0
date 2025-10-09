import axios from 'axios';

const API_BASE_URL = 'http://localhost:3003/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Export API Error:', error);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/doctor-login';
    }
    
    return Promise.reject(error);
  }
);

export const exportPatients = async (format, doctorId) => {
  try {
    console.log(`📤 Exporting patients as ${format} for doctor:`, doctorId);
    
    const response = await apiClient.get(`/patients/export/${format}`, {
      params: {
        doctorId: doctorId,
      },
      responseType: 'blob',
      headers: {
        'Accept': getAcceptHeader(format),
      },
    });
    
    console.log(`✅ Export successful:`, response);
    return response;
    
  } catch (error) {
    console.error(`❌ Export failed:`, error);
    throw error;
  }
};

const getAcceptHeader = (format) => {
  switch (format) {
    case 'csv':
      return 'text/csv';
    case 'excel':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
};

export default {
  exportPatients,
};
