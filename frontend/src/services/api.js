import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Add auth token if available from AsyncStorage
    try {
      const token = await AsyncStorage.getItem('@token');
      console.log('[API] Token found:', token ? 'yes' : 'no');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[API] Authorization header set');
      } else {
        console.log('[API] No token found in AsyncStorage');
      }
    } catch (err) {
      console.error('[API] Error getting token from storage:', err);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('[API] Response:', response.status);
    return response;
  },
  async (error) => {
    console.log('[API] Error:', error.response?.status || 'network');
    // Don't automatically clear token on 401
    // Let AuthContext handle authentication state
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => 
    api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  updateVehiclePreference: (vehicleType) => 
    api.put('/users/me/vehicle-preference', null, { params: { vehicle_type: vehicleType } }),
};

// Vehicles API
export const vehiclesAPI = {
  getAll: () => api.get('/vehicles'),
  create: (data) => api.post('/vehicles', data),
  deactivate: (id) => api.put(`/vehicles/${id}/deactivate`),
};

// Safety Checks API
export const safetyChecksAPI = {
  create: (data) => api.post('/safety-checks', data),
  getCurrent: () => api.get('/safety-checks/current'),
  updateItems: (id, items) => api.put(`/safety-checks/${id}/update-items`, { items }),
  approve: (id) => api.post(`/safety-checks/${id}/approve`),
  getById: (id) => api.get(`/safety-checks/${id}`),
};

// Trips API
export const tripsAPI = {
  create: (data) => api.post('/trips', data),
  getActive: () => api.get('/trips/active'),
  getAll: (params) => api.get('/trips', { params }),
  getById: (id) => api.get(`/trips/${id}`),
  updateLocation: (id, location) => api.post(`/trips/${id}/location`, location),
  complete: (id, endLocation) => 
    api.put(`/trips/${id}/complete`, null, { params: endLocation }),
  setEmergency: (id) => api.put(`/trips/${id}/emergency`),
};

// Emergencies API
export const emergenciesAPI = {
  create: (data) => api.post('/emergencies', data),
  getAll: (params) => api.get('/emergencies', { params }),
  getById: (id) => api.get(`/emergencies/${id}`),
  getContacts: () => api.get('/emergencies/emergency-contacts'),
  resolve: (id, data) => api.put(`/emergencies/${id}/resolve`, data),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),
  getWeeklyStats: () => api.get('/dashboard/weekly-stats'),
  getMonthlySummary: () => api.get('/dashboard/monthly-summary'),
};

export default api;
