import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
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
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      // Redirect to login screen
    }
    
    return Promise.reject(error.response?.data || error.message);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => 
    api.post('/auth/login', { email, password }),
  
  register: (userData) => 
    api.post('/auth/register', userData),
  
  logout: () => 
    api.post('/auth/logout'),
  
  getProfile: () => 
    api.get('/auth/me'),
  
  updateProfile: (profileData) => 
    api.put('/auth/profile', profileData),
};

// Products API
export const productsAPI = {
  getProducts: (params = {}) => 
    api.get('/products', { params }),
  
  getProduct: (id) => 
    api.get(`/products/${id}`),
  
  createProduct: (productData) => 
    api.post('/products', productData),
  
  updateProduct: (id, productData) => 
    api.put(`/products/${id}`, productData),
  
  deleteProduct: (id) => 
    api.delete(`/products/${id}`),
  
  getProductsByCategory: (category, params = {}) => 
    api.get(`/products/category/${category}`, { params }),
};

// Stores API
export const storesAPI = {
  getStores: (params = {}) => 
    api.get('/stores', { params }),
  
  getStore: (id) => 
    api.get(`/stores/${id}`),
  
  createStore: (storeData) => 
    api.post('/stores', storeData),
  
  updateStore: (id, storeData) => 
    api.put(`/stores/${id}`, storeData),
  
  deleteStore: (id) => 
    api.delete(`/stores/${id}`),
  
  getStoreProducts: (id, params = {}) => 
    api.get(`/stores/${id}/products`, { params }),
  
  getStoresByCity: (city, params = {}) => 
    api.get(`/stores/city/${city}`, { params }),
};

// Categories API
export const categoriesAPI = {
  getCategories: (params = {}) => 
    api.get('/categories', { params }),
  
  getCategory: (slug) => 
    api.get(`/categories/${slug}`),
  
  createCategory: (categoryData) => 
    api.post('/categories', categoryData),
  
  updateCategory: (id, categoryData) => 
    api.put(`/categories/${id}`, categoryData),
  
  deleteCategory: (id) => 
    api.delete(`/categories/${id}`),
  
  getFeaturedCategories: (params = {}) => 
    api.get('/categories/featured', { params }),
};

// Chat API
export const chatAPI = {
  getMessages: (storeId, params = {}) => 
    api.get(`/chat/${storeId}`, { params }),
  
  sendMessage: (storeId, messageData) => 
    api.post(`/chat/${storeId}`, messageData),
  
  getConversations: () => 
    api.get('/chat/conversations'),
  
  markAsRead: (messageId) => 
    api.put(`/chat/${messageId}/read`),
  
  deleteMessage: (messageId) => 
    api.delete(`/chat/${messageId}`),
};

// Reviews API
export const reviewsAPI = {
  getReviews: (params = {}) => 
    api.get('/reviews', { params }),
  
  createReview: (reviewData) => 
    api.post('/reviews', reviewData),
  
  updateReview: (id, reviewData) => 
    api.put(`/reviews/${id}`, reviewData),
  
  deleteReview: (id) => 
    api.delete(`/reviews/${id}`),
  
  markHelpful: (id) => 
    api.post(`/reviews/${id}/helpful`),
};

// Favorites API
export const favoritesAPI = {
  getFavorites: (params = {}) => 
    api.get('/favorites', { params }),
  
  addToFavorites: (targetType, targetId) => 
    api.post('/favorites', { targetType, targetId }),
  
  removeFromFavorites: (id) => 
    api.delete(`/favorites/${id}`),
  
  removeByTarget: (targetType, targetId) => 
    api.delete('/favorites/remove', { data: { targetType, targetId } }),
  
  checkFavorite: (targetType, targetId) => 
    api.get('/favorites/check', { params: { targetType, targetId } }),
};

// Flags API
export const flagsAPI = {
  createFlag: (flagData) => 
    api.post('/flags', flagData),
  
  getFlags: (params = {}) => 
    api.get('/flags', { params }),
  
  getFlag: (id) => 
    api.get(`/flags/${id}`),
  
  updateFlag: (id, flagData) => 
    api.put(`/flags/${id}/review`, flagData),
  
  deleteFlag: (id) => 
    api.delete(`/flags/${id}`),
};

// Users API
export const usersAPI = {
  getProfile: () => 
    api.get('/users/profile'),
  
  getHistory: (params = {}) => 
    api.get('/users/history', { params }),
  
  clearHistory: () => 
    api.delete('/users/history'),
  
  getMerchantDashboard: () => 
    api.get('/users/merchant/dashboard'),
  
  changeRole: (userId, newRole) => 
    api.put('/users/role', { userId, newRole }),
  
  changeStatus: (userId, isActive) => 
    api.put('/users/status', { userId, isActive }),
};

// Admin API
export const adminAPI = {
  getDashboard: () => 
    api.get('/admin/dashboard'),
  
  getUsers: (params = {}) => 
    api.get('/admin/users', { params }),
  
  getStores: (params = {}) => 
    api.get('/admin/stores', { params }),
  
  getProducts: (params = {}) => 
    api.get('/admin/products', { params }),
  
  toggleProductFeatured: (id, isFeatured) => 
    api.put(`/admin/products/${id}/featured`, { isFeatured }),
  
  toggleStoreFeatured: (id, isFeatured) => 
    api.put(`/admin/stores/${id}/featured`, { isFeatured }),
  
  getAnalytics: (params = {}) => 
    api.get('/admin/analytics', { params }),
};

export default api;