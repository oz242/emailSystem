import axios from 'axios';
let baseURL =  'http://localhost:5000';
const api = axios.create({
  baseURL: `${baseURL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for global error normalization
api.interceptors.response.use(
  response => response,
  error => {
    console.log('API Error:', error);
    const message = error.response?.data?.message || error.message || 'Network error';
    if ([401, 403].includes(error.response?.status)) {
      window.dispatchEvent(new CustomEvent('auth:rejected', { detail: { message } }));
    }
    return Promise.reject(new Error(message));
  }
);

export default api;
