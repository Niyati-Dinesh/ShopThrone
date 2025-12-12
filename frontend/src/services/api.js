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

export const saveManualSearch = async (query, prices = null) => {
  console.log("💾 Saving manual search:", query, "with prices:", prices);

  try {
    let response;

    if (prices) {
      // Save with prices directly
      const searchData = {
        query,
        ...prices,
      };
      response = await api.post("/search/manual-with-prices", searchData);
    } else {
      // Save just the query
      const formData = new URLSearchParams();
      formData.append("query", query);
      response = await api.post("/search/manual", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
    }

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

  try {
    const response = await api.get("/search/deals", { params });

    // Extract prices from deals response
    const prices = {
      amazon_price: response.data?.amazon?.price || null,
      flipkart_price: response.data?.flipkart?.price || null,
      snapdeal_price: response.data?.snapdeal?.price || null,
      croma_price: response.data?.croma?.price || null,
      reliance_price: response.data?.reliance?.price || null,
      ajio_price: response.data?.ajio?.price || null,
    };

    // If this is a manual search (searchId = 0), save with prices
    if (searchId === 0) {
      console.log("💾 Saving manual search with prices...");
      await saveManualSearch(product, prices);
    }

    return response.data;
  } catch (error) {
    console.error("❌ Error fetching deals:", error);
    throw error;
  }
};
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
