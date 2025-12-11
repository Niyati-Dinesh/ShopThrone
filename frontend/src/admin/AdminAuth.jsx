import { useState, useEffect } from "react";
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Terminal,
  ArrowRight,
  AlertCircle,
  Fingerprint,
  CheckCircle,
  Server,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

const adminAuthAPI = {
  login: async (credentials) => {
    const response = await fetch("http://localhost:5555/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw { response: { status: response.status, data: error } };
    }

    return response.json();
  },

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

export default function AdminAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [apiStatus, setApiStatus] = useState(null);

  useEffect(() => {
    checkApiStatus();
    checkExistingSession();
  }, []);

  const checkApiStatus = async () => {
    try {
      const response = await fetch("http://localhost:5555/api/health");
      setApiStatus(response.ok ? "online" : "offline");
    } catch {
      setApiStatus("offline");
    }
  };

  const checkExistingSession = async () => {
    const adminToken = localStorage.getItem("admin_token");
    if (adminToken) {
      try {
        await adminAuthAPI.validateSession();
        setSuccess("Session active. Redirecting...");
        setTimeout(() => {
          window.location.href = "/youarenotsupposedtocomehere/dashboard";
        }, 1000);
      } catch {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_email");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!email || !password || !adminKey) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    try {
      const result = await adminAuthAPI.login({
        email,
        password,
        admin_key: adminKey,
      });

      localStorage.setItem("admin_token", result.access_token);
      localStorage.setItem("admin_email", email);
      localStorage.setItem("admin_last_login", new Date().toISOString());
      localStorage.setItem("admin_name", result.name || "Administrator");

      setSuccess("Authentication successful!");

      setTimeout(() => {
        window.location.href = "/youarenotsupposedtocomehere/dashboard";
      }, 1000);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Invalid credentials. Please check your inputs.");
      } else if (err.response?.status === 0) {
        setError("Cannot connect to server on port 5555.");
      } else {
        setError(err.response?.data?.detail || "Authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#1a1412] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#6b2d3d]/20 to-transparent rounded-full blur-3xl -translate-y-48 translate-x-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#520c2b]/20 to-transparent rounded-full blur-3xl translate-y-48 -translate-x-48" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center opacity-[0.02]">
        <Shield size={600} className="text-[#6b2d3d]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* API Status */}
        <div className="mb-8">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm border ${
              apiStatus === "online"
                ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${
                apiStatus === "online" ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span>
              {apiStatus === "online" ? "API Connected" : "API Offline"}
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-[#f5f1eb] dark:bg-[#211c18] rounded-full border border-[#e3ddd4] dark:border-[#3a342e] mb-8">
            <Server size={18} className="text-[#6b2d3d]" strokeWidth={1.5} />
            <span className="text-[#6b2d3d] text-sm tracking-widest uppercase">
              Administration
            </span>
          </div>
          <h1 className="font-serif text-5xl lg:text-6xl text-[#2d2520] dark:text-[#f5f1eb] mb-4">
            Admin Control
          </h1>
          <p className="text-[#5a4e42] dark:text-[#d4c9bc] text-sm tracking-wide">
            Secure platform management
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[#f5f1eb] dark:bg-[#211c18] rounded-xl p-8 border border-[#e3ddd4] dark:border-[#3a342e] shadow-lg">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[#e3ddd4] dark:border-[#3a342e]">
            <div className="w-14 h-14 bg-gradient-to-br from-[#6b2d3d] to-[#4a1f2c] rounded-xl flex items-center justify-center shadow-md">
              <Fingerprint size={24} className="text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-serif text-xl text-[#2d2520] dark:text-[#f5f1eb]">
                Authentication
              </h2>
              <p className="text-[#8b7d6b] dark:text-[#a89a8b] text-sm">
                Enter credentials
              </p>
            </div>
          </div>

          {/* Success */}
          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
                <CheckCircle size={20} strokeWidth={1.5} />
                <p className="text-sm">{success}</p>
              </div>
            </div>
          )}

          {/* API Warning */}
          {apiStatus === "offline" && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
                <AlertTriangle size={20} strokeWidth={1.5} />
                <div>
                  <p className="text-sm">Backend API Offline</p>
                  <p className="text-xs opacity-90 mt-1">
                    Ensure server runs on port 5555
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-2 mb-6">
            <label className="flex items-center gap-2 text-[#5a4e42] dark:text-[#d4c9bc] text-sm">
              <Mail size={14} className="text-[#6b2d3d]" strokeWidth={1.5} />
              Admin Email
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="w-full py-3.5 pl-12 pr-4 bg-[#F0E6C5] dark:bg-[#2a2420] border border-[#e3ddd4] dark:border-[#3a342e] text-[#2d2520] dark:text-[#f5f1eb] rounded-lg focus:outline-none focus:border-[#6b2d3d] focus:ring-2 focus:ring-[#6b2d3d]/20"
                placeholder="admin@shopthrone.com"
                disabled={loading}
              />
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b7d6b]"
                strokeWidth={1.5}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2 mb-6">
            <label className="flex items-center gap-2 text-[#5a4e42] dark:text-[#d4c9bc] text-sm">
              <Lock size={14} className="text-[#6b2d3d]" strokeWidth={1.5} />
              Password
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="w-full py-3.5 pl-12 pr-12 bg-[#F0E6C5] dark:bg-[#2a2420] border border-[#e3ddd4] dark:border-[#3a342e] text-[#2d2520] dark:text-[#f5f1eb] rounded-lg focus:outline-none focus:border-[#6b2d3d] focus:ring-2 focus:ring-[#6b2d3d]/20"
                placeholder="••••••••"
                disabled={loading}
              />
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b7d6b]"
                strokeWidth={1.5}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b7d6b] hover:text-[#6b2d3d]"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff size={20} strokeWidth={1.5} />
                ) : (
                  <Eye size={20} strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>

          {/* Security Key */}
          <div className="space-y-2 mb-6">
            <label className="flex items-center gap-2 text-[#5a4e42] dark:text-[#d4c9bc] text-sm">
              <Terminal
                size={14}
                className="text-[#6b2d3d]"
                strokeWidth={1.5}
              />
              Security Key
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={adminKey}
                onChange={(e) => {
                  setAdminKey(e.target.value);
                  setError("");
                }}
                className="w-full py-3.5 pl-12 pr-4 bg-[#F0E6C5] dark:bg-[#2a2420] border border-[#e3ddd4] dark:border-[#3a342e] text-[#2d2520] dark:text-[#f5f1eb] rounded-lg focus:outline-none focus:border-[#6b2d3d] focus:ring-2 focus:ring-[#6b2d3d]/20"
                placeholder="Enter key"
                disabled={loading}
              />
              <Terminal
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b7d6b]"
                strokeWidth={1.5}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
                <AlertCircle size={20} strokeWidth={1.5} />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-8 bg-gradient-to-r from-[#6b2d3d] to-[#4a1f2c] hover:from-[#8b3d52] hover:to-[#6b2d3d] text-white py-4 rounded-lg shadow-md hover:shadow-lg flex items-center justify-center gap-3 group disabled:opacity-70"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <Shield size={20} strokeWidth={1.5} />
                <span>Authenticate</span>
                <ArrowRight
                  size={18}
                  strokeWidth={1.5}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </>
            )}
          </button>

          {/* Footer */}
          <div className="pt-6 mt-6 border-t border-[#e3ddd4] dark:border-[#3a342e]">
            <div className="flex items-center justify-center gap-2 text-[#8b7d6b] dark:text-[#a89a8b] text-xs mb-2">
              <Sparkles
                size={12}
                className="text-[#6b2d3d]"
                strokeWidth={1.5}
              />
              <span>Secure API authentication</span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-[#8b7d6b] dark:text-[#a89a8b] text-xs">
            © 2025 ShopThrone Admin
          </p>
        </div>
      </div>
    </div>
  );
}
