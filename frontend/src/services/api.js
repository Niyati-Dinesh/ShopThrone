import axios from 'axios';

// Base URL from 'new' file
const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  // Removed default 'Content-Type': 'application/json'
  // It's better to set it per-request (like in login/upload)
});

// --- Interceptors from 'old' file (more robust) ---

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Added detailed logging from 'old'
    console.log('🚀 Making API request:', config.method.toUpperCase(), config.url);
    console.log('📋 Headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Added detailed logging from 'old'
    console.log('✅ API response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('💥 API error:', error.response || error);
    // Added 401 redirect handling from 'old'
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- API Functions (merged from 'new' file) ---

// Auth
export const signup = (userData) => api.post('/users/signup', userData);

export const login = (credentials) => {
  const formData = new URLSearchParams();
  formData.append('username', credentials.email);
  formData.append('password', credentials.password);
  
  // Uses 'api' instance and correct 'URLSearchParams' from 'new'
  return api.post('/token', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
};

// Image Upload (Step 1)
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  console.log('📤 Uploading file:', file.name, file.type, file.size);
  
  const response = await api.post('/search/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  console.log('✅ Upload response:', response.data);
  return response.data;
};

// Get Deals with Detailed Comparison (Step 2)
// This is the 'new' version with pincode support
export const getDeals = async (product, searchId, pincode = null) => {
  console.log('📊 Fetching deals for:', product, 'Search ID:', searchId, 'Pincode:', pincode);
  
  const params = {  
    product,  
    search_id: searchId  
  };
  
  if (pincode) {
    params.pincode = pincode;
  }
  
  // Uses simple GET request from 'new'
  const response = await api.get('/search/deals', { params });
  
  console.log('✅ Deals response:', response.data);
  return response.data;
};

// User (new functions)
export const getCurrentUser = () => api.get('/users/me');
export const getMySearches = () => api.get('/users/my-searches');

export default api;