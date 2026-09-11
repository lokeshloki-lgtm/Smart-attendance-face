import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const getApiErrorMessage = (error, fallback = 'Request failed. Please try again.') => {
  const status = error.response?.status;
  if (status === 409) return error.response?.data?.message || 'This record already exists.';
  if (status === 404) return error.response?.data?.message || 'The requested service endpoint is unavailable.';
  if (status === 422) return error.response?.data?.message || 'The submitted data could not be verified.';
  if (status >= 500) return error.response?.data?.message || 'Server error. Please try again.';
  return error.response?.data?.message || error.message || fallback;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
    const isAuthPage = typeof window !== 'undefined' && (window.location.pathname === '/login' || window.location.pathname === '/register');
    const authMessage = error.response?.data?.message;
    const isAuthenticationFailure = ['No authorization token provided', 'Invalid or expired token', 'Invalid token', 'Token expired'].includes(authMessage);

    if (error.response?.status === 401 && isAuthenticationFailure && !isAuthRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!isAuthPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// User endpoints
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  registerFace: (id, data) => api.post(`/users/${id}/face`, data),
  recognizeFace: (data) => api.post('/users/face/recognize', data),
  getStats: (id) => api.get(`/users/${id}/stats`),
  getTeacherStudents: (params) => api.get('/users/teacher/students', { params }),
  getTeacherStudentAttendance: (id) => api.get(`/users/teacher/students/${id}/attendance`),
};

// Face registration endpoints
export const faceAPI = {
  register: (faceDescriptor) => api.post('/face/register', { faceDescriptor }),
};

// Attendance endpoints
export const attendanceAPI = {
  mark: (data, config) => api.post('/attendance/mark', data, config),
  history: (params) => api.get('/attendance/history', { params }),
  getAll: (params) => api.get('/attendance', { params }),
  getToday: () => api.get('/attendance/today'),
  getWeek: () => api.get('/attendance/week'),
  getMonth: () => api.get('/attendance/month'),
  getByUser: (userId, params) => api.get(`/attendance/user/${userId}`, { params }),
  getReport: (params) => api.get('/attendance/report', { params }),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  delete: (id) => api.delete(`/attendance/${id}`),
};

// Dashboard endpoints
export const dashboardAPI = {
  getAdminDashboard: () => api.get('/dashboard/admin'),
  getUserDashboard: () => api.get('/dashboard/user'),
};

// Analytics endpoints
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getMonthly: (params) => api.get('/analytics/monthly', { params }),
  getDepartment: (params) => api.get('/analytics/department', { params }),
  getUserPercentage: () => api.get('/analytics/user-percentage'),
  getTrends: (params) => api.get('/analytics/trends', { params }),
  getWeekly: () => api.get('/analytics/trends', { params: { days: 7 } }),
  getLocations: () => api.get('/analytics/locations'),
  getAttendanceInsights: (params) => api.get('/analytics/attendance-insights', { params }),
};

export const departmentAPI = {
  getAll: () => api.get('/departments'),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  deactivate: (id) => api.delete(`/departments/${id}`),
};

export const settingsAPI = {
  getAttendance: () => api.get('/settings/attendance'),
  updateAttendance: (data) => api.put('/settings/attendance', data),
};

// AI endpoints
export const aiAPI = {
  chat: (message) => api.post('/ai/chat', { message }),
  getSummary: (params) => api.get('/ai/summary', { params }),
};

export default api;
