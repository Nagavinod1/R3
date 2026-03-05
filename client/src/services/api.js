import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  updatePassword: (data) => api.put('/auth/password', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  getNotifications: () => api.get('/auth/notifications'),
  markNotificationsRead: () => api.put('/auth/notifications/read')
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getDashboardStats: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  approveUser: (id, isApproved) => api.put(`/admin/users/${id}/approve`, { isApproved }),
  updateUserStatus: (id, isActive) => api.put(`/admin/users/${id}/status`, { isActive }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getStaff: (params) => api.get('/admin/staff', { params }),
  getPendingStaff: () => api.get('/admin/staff', { params: { isApproved: 'false' } }),
  approveStaff: (id) => api.put(`/admin/users/${id}/approve`, { isApproved: true }),
  rejectStaff: (id) => api.put(`/admin/users/${id}/approve`, { isApproved: false }),
  createStaff: (data) => api.post('/admin/staff', data),
  getHospitals: (params) => api.get('/admin/hospitals', { params }),
  approveHospital: (id, isApproved) => api.put(`/admin/hospitals/${id}/approve`, { isApproved }),
  getAlerts: (params) => api.get('/admin/alerts', { params }),
  resolveAlert: (id, data = {}) => api.put(`/admin/alerts/${id}/resolve`, data),
  getBloodAnalytics: () => api.get('/admin/analytics/blood'),
  getHospitalAnalytics: () => api.get('/admin/analytics/hospitals'),
  getBedBookings: (params) => api.get('/beds/bookings', { params })
};

// Blood API
export const bloodAPI = {
  getInventory: (params) => api.get('/blood/inventory', { params }),
  getSummary: () => api.get('/blood/summary'),
  getBloodStats: () => api.get('/blood/summary'),
  addBloodUnit: (data) => api.post('/blood/add', data),
  updateBloodUnit: (id, data) => api.put(`/blood/${id}`, data),
  getRequests: (params) => api.get('/blood/requests', { params }),
  getBloodRequests: (params) => api.get('/blood/requests', { params }),
  createRequest: (data) => api.post('/blood/request', data),
  createBloodRequest: (data) => api.post('/blood/request', data),
  processRequest: (id, data) => api.put(`/blood/requests/${id}/process`, data),
  updateBloodRequest: (id, data) => api.put(`/blood/requests/${id}`, data),
  getLowStock: (threshold) => api.get('/blood/low-stock', { params: { threshold } }),
  getHistory: (id) => api.get(`/blood/${id}/history`)
};

// Bed API
export const bedAPI = {
  getBeds: (params) => api.get('/beds', { params }),
  getAvailable: (params) => api.get('/beds/available', { params }),
  getAvailableBeds: (params) => api.get('/beds/available', { params }),
  getStats: (hospitalId) => api.get('/beds/stats', { params: { hospitalId } }),
  addBed: (data) => api.post('/beds', data),
  updateBed: (id, data) => api.put(`/beds/${id}`, data),
  deleteBed: (id) => api.delete(`/beds/${id}`),
  reserveBed: (data) => api.post('/beds/reserve', data),
  bookBed: (bedId, data) => api.post('/beds/reserve', { bedId, ...data }),
  getBookings: (params) => api.get('/beds/bookings', { params }),
  processBooking: (id, data) => api.put(`/beds/bookings/${id}/process`, data),
  updateBooking: (id, data) => api.put(`/beds/bookings/${id}`, data)
};

// Hospital API
export const hospitalAPI = {
  getHospitals: (params) => api.get('/hospitals', { params }),
  getNearby: (params) => api.get('/hospitals/nearby', { params }),
  getHospital: (id) => api.get(`/hospitals/${id}`),
  registerHospital: (data) => api.post('/hospitals', data),
  createHospital: (data) => api.post('/hospitals', data),
  updateHospital: (id, data) => api.put(`/hospitals/${id}`, data),
  deleteHospital: (id) => api.delete(`/hospitals/${id}`),
  getHospitalBeds: (id, params) => api.get(`/hospitals/${id}/beds`, { params }),
  getHospitalBlood: (id) => api.get(`/hospitals/${id}/blood`),
  getDistricts: () => api.get('/hospitals/meta/districts')
};

// User API
export const userAPI = {
  getDashboard: () => api.get('/users/dashboard'),
  getBloodRequests: (params) => api.get('/users/blood-requests', { params }),
  getBedBookings: (params) => api.get('/users/bed-bookings', { params }),
  cancelBloodRequest: (id) => api.put(`/users/blood-requests/${id}/cancel`),
  cancelBedBooking: (id) => api.put(`/users/bed-bookings/${id}/cancel`),
  getNotifications: () => api.get('/users/notifications'),
  markAllRead: () => api.put('/users/notifications/read-all'),
  // Additional methods used in components
  getMyBloodRequests: () => api.get('/users/blood-requests'),
  getMyBookings: () => api.get('/users/bed-bookings'),
  cancelBooking: (id) => api.put(`/users/bed-bookings/${id}/cancel`)
};

// Auth API extended
export const authAPIExtended = {
  ...authAPI,
  changePassword: (data) => api.put('/auth/change-password', data)
};

// AI API
export const aiAPI = {
  chat: (data) => api.post('/ai/chat', data),
  getEmergencyRecommendation: (data) => api.post('/ai/emergency-recommendation', data),
  predictStock: () => api.get('/ai/predict-stock'),
  classifyPriority: (data) => api.post('/ai/priority-classification', data),
  getFirstAid: (condition) => api.get(`/ai/first-aid/${condition}`),
  // New Deep Learning Emergency Severity Detection
  analyzeSeverity: (data) => api.post('/ai/severity-detection', data),
  processVoice: (data) => api.post('/ai/voice-process', data),
  emergencyTriage: (data) => api.post('/ai/triage', data),
  getHealthInfo: (topic) => api.get(`/ai/health-info/${topic}`),
  getFirstAidTips: (count = 3) => api.get(`/ai/first-aid-tips?count=${count}`)
};

// Blockchain API
export const blockchainAPI = {
  getStatus: () => api.get('/blockchain/status'),
  getTransactions: (params) => api.get('/blockchain/transactions', { params }),
  verifyTransaction: (hash) => api.get(`/blockchain/verify/${hash}`),
  getHistory: (entityType, entityId) => api.get(`/blockchain/history/${entityType}/${entityId}`),
  getStats: () => api.get('/blockchain/stats')
};

export default api;
