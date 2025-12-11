import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Shield } from "lucide-react";

// Admin API helper
const adminAuthAPI = {
  validateSession: async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) throw new Error("No token");

    const response = await fetch("http://localhost:5555/api/admin/validate", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("Invalid session");
    return response.json();
  },
};

export default function AdminProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const token = localStorage.getItem("admin_token");

      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Validate session with backend API
      const session = await adminAuthAPI.validateSession();

      if (session && session.valid) {
        setIsAuthenticated(true);
      } else {
        clearAdminSession();
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Admin session validation error:", error);
      clearAdminSession();
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const clearAdminSession = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_email");
    localStorage.removeItem("admin_name");
    localStorage.removeItem("admin_last_login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center space-y-8 animate-fade-in">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border border-[var(--border-color)] rounded-full"></div>
            <div className="absolute inset-0 border-2 border-transparent border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield
                size={28}
                className="text-[var(--accent-primary)]"
                strokeWidth={1.5}
              />
            </div>
          </div>
          <div>
            <h2 className="font-serif text-3xl text-[var(--text-primary)] mb-3 font-light">
              Verifying Access
            </h2>
            <p className="text-[var(--text-secondary)] text-sm font-light tracking-wide">
              Authenticating admin credentials
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/youarenotsupposedtocomehere"
        state={{ from: location }}
        replace
      />
    );
  }

  return children;
}
