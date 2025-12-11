import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5555";

// Create axios instance with default config
const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("admin_token");
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
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear admin session on unauthorized
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_email");
      window.location.href = "/youarenotsupposedtocomehere";
    }
    return Promise.reject(error);
  }
);

// Admin Authentication
export const adminAuthAPI = {
  login: async (credentials) => {
    const response = await adminApi.post("/api/admin/login", credentials);
    return response.data;
  },

  logout: async () => {
    const response = await adminApi.post("/api/admin/logout");
    return response.data;
  },

  validateSession: async () => {
    try {
      const response = await adminApi.get("/api/admin/validate");
      return response.data;
    } catch (error) {
      return null;
    }
  },
};

// Add this to your existing api.js file

// User Management
export const userManagementAPI = {
  getAllUsers: async (page = 1, limit = 20) => {
    const response = await adminApi.get("/api/admin/users", {
      params: { page, limit },
    });
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await adminApi.get(`/api/admin/users/${userId}`);
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await adminApi.put(`/api/admin/users/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await adminApi.delete(`/api/admin/users/${userId}`);
    return response.data;
  },

  searchUsers: async (query) => {
    const response = await adminApi.get("/api/admin/users/search", {
      params: { q: query },
    });
    return response.data;
  },
};

// Search History Management
export const searchHistoryAPI = {
  getAllSearches: async (page = 1, limit = 20) => {
    const response = await adminApi.get("/api/admin/searches", {
      params: { page, limit },
    });
    return response.data;
  },

  getImageSearches: async (page = 1, limit = 20) => {
    const response = await adminApi.get("/api/admin/searches/image", {
      params: { page, limit },
    });
    return response.data;
  },

  getManualSearches: async (page = 1, limit = 20) => {
    const response = await adminApi.get("/api/admin/searches/manual", {
      params: { page, limit },
    });
    return response.data;
  },

  deleteSearch: async (searchId, type) => {
    const response = await adminApi.delete(`/api/admin/searches/${searchId}`, {
      params: { type },
    });
    return response.data;
  },
};

// System Monitoring
export const systemAPI = {
  getSystemStats: async () => {
    const response = await adminApi.get("/api/admin/system/stats");
    return response.data;
  },

  getApiHealth: async () => {
    const response = await adminApi.get("/api/admin/system/health");
    return response.data;
  },

  getServerLogs: async (limit = 100) => {
    const response = await adminApi.get("/api/admin/system/logs", {
      params: { limit },
    });
    return response.data;
  },

  clearCache: async () => {
    const response = await adminApi.post("/api/admin/system/cache/clear");
    return response.data;
  },
};

// Scraper API (updated)
export const scraperAPI = {
  getScraperStatus: async () => {
    const response = await adminApi.get("/api/admin/scrapers/status");
    return response.data;
  },

  testScraper: async (scraperName, query = "iPhone 15") => {
    const response = await adminApi.post(
      `/api/admin/scrapers/test/${scraperName}`,
      null,
      {
        params: { query },
      }
    );
    return response.data;
  },

  updateScraperConfig: async (config) => {
    const response = await adminApi.put("/api/admin/scraper/config", config);
    return response.data;
  },
};

// Admin Settings
export const adminSettingsAPI = {
  updateSettings: async (settings) => {
    const response = await adminApi.put("/api/admin/settings", settings);
    return response.data;
  },

  getSettings: async () => {
    const response = await adminApi.get("/api/admin/settings");
    return response.data;
  },
};
// Add these new API functions to your existing api.js

// Analytics API
export const analyticsAPI = {
  getDashboardAnalytics: async (timeframe = "7d") => {
    const response = await adminApi.get("/api/admin/analytics/dashboard", {
      params: { timeframe },
    });
    return response.data;
  },

  getTopProducts: async (limit = 10, timeframe = "7d") => {
    const response = await adminApi.get("/api/admin/analytics/top-products", {
      params: { limit, timeframe },
    });
    return response.data;
  },

  getUserLocations: async (limit = 50) => {
    const response = await adminApi.get("/api/admin/analytics/user-locations", {
      params: { limit },
    });
    return response.data;
  },
};

// Export API
export const exportAPI = {
  exportSearches: async (format = "csv", startDate = null, endDate = null) => {
    const response = await adminApi.get("/api/admin/export/searches", {
      params: { format, start_date: startDate, end_date: endDate },
      responseType: "blob",
    });
    return response.data;
  },

  exportUsers: async (format = "csv") => {
    const response = await adminApi.get("/api/admin/export/users", {
      params: { format },
      responseType: "blob",
    });
    return response.data;
  },
};

// Settings API
export const settingsAPI = {
  getSettings: async () => {
    const response = await adminApi.get("/api/admin/settings");
    return response.data;
  },

  updateSettings: async (settings) => {
    const response = await adminApi.put("/api/admin/settings", settings);
    return response.data;
  },
};

// Monitoring API
export const monitoringAPI = {
  getLiveMetrics: async () => {
    const response = await adminApi.get("/api/admin/monitoring/live");
    return response.data;
  },

  getSystemHealth: async () => {
    const response = await adminApi.get("/api/admin/system/health");
    return response.data;
  },
};

// Notifications API
export const notificationsAPI = {
  getNotifications: async (unreadOnly = false, limit = 50) => {
    const response = await adminApi.get("/api/admin/notifications", {
      params: { unread_only: unreadOnly, limit },
    });
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await adminApi.put(
      `/api/admin/notifications/${notificationId}/read`
    );
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await adminApi.put("/api/admin/notifications/read-all");
    return response.data;
  },
};
export default adminApi;
