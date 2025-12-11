import { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import toast from "react-hot-toast";
import api, {
  requestPasswordReset as apiRequestPasswordReset,
  resetPassword as apiResetPassword,
} from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || null
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUser({ email: decodedToken.sub });
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      } catch (error) {
        console.error("Token decode error:", error);
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    try {
      console.log("🔐 Attempting login for:", email);

      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch("http://localhost:5555/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
        mode: "cors",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Login failed (${response.status})`
        );
      }

      const data = await response.json();
      const { access_token } = data;

      localStorage.setItem("token", access_token);
      setToken(access_token);
      api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

      console.log("✅ Login successful");
      toast.success("Welcome back!");
      return true;
    } catch (error) {
      console.error("💥 Login error:", error);
      toast.error(error.message || "Login failed");
      return false;
    }
  };

  const signup = async (userData) => {
    try {
      console.log("👤 Attempting signup for:", userData.email);
      const response = await api.post("/users/signup", userData);
      console.log("✅ Signup successful");
      const loginSuccess = await login(userData.email, userData.password);
      if (loginSuccess) {
        toast.success("Account created successfully!");
      } else {
        toast.success("Account created! Please log in.");
      }
      return loginSuccess;
    } catch (error) {
      console.error("💥 Signup error:", error);
      let errorMessage = "Signup failed";
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data) {
        errorMessage =
          typeof error.response.data === "string"
            ? error.response.data
            : JSON.stringify(error.response.data);
      }
      toast.error(errorMessage);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common["Authorization"];
    toast.success("Logged out successfully!");
  };

  // ✅ FIXED: Using the correctly imported functions
  const requestPasswordReset = async (email) => {
    try {
      const result = await apiRequestPasswordReset(email); // ✅ Now this exists
      return result;
    } catch (error) {
      console.error("Password reset request error:", error);
      throw error;
    }
  };

  const resetPassword = async (email, otp, newPassword) => {
    try {
      const result = await apiResetPassword(email, otp, newPassword); // ✅ Now this exists
      return result;
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        signup,
        loading,
        requestPasswordReset,
        resetPassword,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
