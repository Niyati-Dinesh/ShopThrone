import axios from "axios";
const API_URL = "http://localhost:5555/api";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(
      "🚀 Making API request:",
      config.method?.toUpperCase() || "GET",
      config.url
    );
    console.log("📋 Headers:", config.headers);
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log("✅ API response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("💥 API error:", error.response || error);

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const signup = (userData) => api.post("/users/signup", userData);

export const login = (credentials) => {
  const formData = new URLSearchParams();
  formData.append("username", credentials.email);
  formData.append("password", credentials.password);

  return api.post("/token", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};

// Image Upload (Step 1)
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  console.log("📤 Uploading file:", file.name, file.type, file.size);

  const response = await api.post("/search/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  console.log("✅ Upload response:", response.data);
  return response.data;
};

export const saveManualSearch = async (query) => {
  const formData = new URLSearchParams();
  formData.append("query", query);

  console.log("💾 Saving manual search:", query);

  try {
    const response = await api.post("/search/manual", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    console.log("✅ Manual search saved:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error saving manual search:", error);
    throw error;
  }
};

export const getDeals = async (product, searchId = 0, pincode = null) => {
  const params = { product, search_id: searchId };
  if (pincode) params.pincode = pincode;

  console.log("🔍 Fetching deals for:", product, "searchId:", searchId);

  const response = await api.get("/search/deals", { params });
  return response.data;
};

// Forgot Password API functions
export const requestPasswordReset = async (email) => {
  console.log("🔐 Requesting password reset for:", email);

  try {
    const response = await api.post("/auth/reset-request", { email });
    console.log("✅ Password reset request sent:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error requesting password reset:", error);
    throw error;
  }
};

export const resetPassword = async (email, otp, newPassword) => {
  console.log("🔄 Resetting password for:", email);

  try {
    const response = await api.post("/auth/reset-password", {
      email,
      otp,
      new_password: newPassword,
    });
    console.log("✅ Password reset successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error resetting password:", error);
    throw error;
  }
};

export const submitFeedback = async (feedbackData) => {
  try {
    const response = await api.post("/feedback", feedbackData);
    return response.data;
  } catch (error) {
    console.error("Feedback API error:", error);
    throw error;
  }
};

export const getCurrentUser = () => api.get("/users/me");
export const getMySearches = () => api.get("/users/my-searches");

export const getMyManualSearches = () => api.get("/users/my-manual-searches");

export default api;
