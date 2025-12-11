import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import {
  Sparkles,
  LogIn,
  Eye,
  EyeOff,
  Shield,
  Mail,
  Lock,
  ArrowLeft,
  Key,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const auth = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await auth.login(email, password);
      if (success) {
        navigate("/dashboard");
      } else {
        toast.error("Login failed. Please try again.");
      }
    } catch (error) {
      console.error("💥 Login component error:", error);

      // Handle different error types properly
      let errorMessage = "Login failed";
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!otpSent) {
        // Send OTP request
        await auth.requestPasswordReset(email);
        toast.success(`OTP sent to ${email}`);
        setOtpSent(true);
      } else {
        // Reset password with OTP
        if (newPassword !== confirmNewPassword) {
          toast.error("Passwords do not match");
          setLoading(false);
          return;
        }

        await auth.resetPassword(email, otp, newPassword);
        toast.success("Password reset successful!");

        // Reset form and go back to login
        setTimeout(() => {
          setShowForgot(false);
          setOtpSent(false);
          setEmail("");
          setOtp("");
          setNewPassword("");
          setConfirmNewPassword("");
        }, 1500);
      }
    } catch (error) {
      console.error("💥 Forgot password error:", error);
      toast.error(error.response?.data?.detail || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const resetForgotForm = () => {
    setShowForgot(false);
    setOtpSent(false);
    setOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Side - Brand & Welcome */}
          <div className="flex flex-col justify-center">
            <div className="mb-8 lg:mb-12">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[var(--accent-primary)]/10 to-[var(--accent-primary)]/5 rounded-full border border-[var(--accent-primary)]/20 mb-6">
                <Sparkles size={20} className="text-[var(--accent-primary)]" />
                <span className="text-[var(--accent-primary)] font-medium text-sm tracking-wide">
                  {showForgot ? "RESET PASSWORD" : "SECURE LOGIN"}
                </span>
              </div>

              <h1 className="font-serif text-4xl lg:text-5xl text-[var(--text-primary)] mb-4 leading-tight">
                {showForgot ? (
                  <>
                    Reset Your{" "}
                    <span className="text-[var(--accent-primary)]">
                      Password
                    </span>
                  </>
                ) : (
                  <>
                    Welcome Back{" "}
                    <span className="text-[var(--accent-primary)]">~</span>
                  </>
                )}
              </h1>
              <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
                {showForgot
                  ? "Enter your email to receive OTP and reset your password securely."
                  : "Continue your smart shopping journey with smart price comparison. Access your saved searches, track savings, and discover new deals."}
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[var(--bg-secondary)] to-white/50 rounded-xl border border-[var(--border-color)]">
                <div className="w-10 h-10 bg-[var(--accent-primary)]/10 rounded-lg flex items-center justify-center">
                  <Shield size={20} className="text-[var(--accent-primary)]" />
                </div>
                <div>
                  <h3 className="font-medium text-[var(--text-primary)]">
                    Secure & Protected
                  </h3>
                  <p className="text-[var(--text-tertiary)] text-sm">
                    Your data is encrypted and secure
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[var(--bg-secondary)] to-white/50 rounded-xl border border-[var(--border-color)]">
                <div className="w-10 h-10 bg-[var(--accent-primary)]/10 rounded-lg flex items-center justify-center">
                  {showForgot ? (
                    <Key size={20} className="text-[var(--accent-primary)]" />
                  ) : (
                    <Sparkles
                      size={20}
                      className="text-[var(--accent-primary)]"
                    />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-[var(--text-primary)]">
                    {showForgot
                      ? "Secure Password Reset"
                      : "AI-Powered Insights"}
                  </h3>
                  <p className="text-[var(--text-tertiary)] text-sm">
                    {showForgot
                      ? "OTP verification for added security"
                      : "Smart price comparison with ML"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
              <div className="bg-gradient-to-br from-[var(--bg-secondary)] to-white/50 rounded-2xl p-8 border border-[var(--border-color)] shadow-lg">
                {/* Forgot Password Back Button */}
                {showForgot && (
                  <button
                    onClick={resetForgotForm}
                    className="flex items-center gap-2 text-[var(--accent-primary)] hover:text-[var(--accent-hover)] transition-colors mb-6"
                  >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Back to Login</span>
                  </button>
                )}

                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-dark)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    {showForgot ? (
                      <Key size={28} className="text-white" />
                    ) : (
                      <LogIn size={28} className="text-white" />
                    )}
                  </div>
                  <h2 className="font-serif text-2xl text-[var(--text-primary)]">
                    {showForgot
                      ? otpSent
                        ? "Enter OTP & New Password"
                        : "Reset Password"
                      : "Sign In to Your Account"}
                  </h2>
                  <p className="text-[var(--text-secondary)] text-sm mt-2">
                    {showForgot
                      ? otpSent
                        ? "Check your email for OTP and enter new password"
                        : "Enter your email to receive OTP"
                      : "Enter your credentials to access your dashboard"}
                  </p>
                </div>

                {showForgot ? (
                  /* Forgot Password Form */
                  <form onSubmit={handleForgotSubmit} className="space-y-6">
                    {/* Email Field (always visible) */}
                    <div>
                      <label className="flex items-center gap-2 text-[var(--text-primary)] text-sm font-medium mb-3">
                        <Mail
                          size={16}
                          className="text-[var(--accent-primary)]"
                        />
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          className="w-full py-3.5 pl-12 pr-4 bg-white/80 border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all duration-300 placeholder:text-[var(--text-tertiary)]"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={otpSent}
                        />
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                          <Mail
                            size={18}
                            className="text-[var(--text-tertiary)]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* OTP Field (only after OTP sent) */}
                    {otpSent && (
                      <div>
                        <label className="flex items-center gap-2 text-[var(--text-primary)] text-sm font-medium mb-3">
                          <CheckCircle
                            size={16}
                            className="text-[var(--accent-primary)]"
                          />
                          OTP Code
                        </label>
                        <div className="relative">
                          <input
                            className="w-full py-3.5 pl-12 pr-4 bg-white/80 border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all duration-300 placeholder:text-[var(--text-tertiary)] text-center tracking-widest font-mono"
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) =>
                              setOtp(
                                e.target.value.replace(/\D/g, "").slice(0, 6)
                              )
                            }
                            maxLength={6}
                            required
                          />
                          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                            <CheckCircle
                              size={18}
                              className="text-[var(--text-tertiary)]"
                            />
                          </div>
                        </div>
                        <p className="text-[var(--text-tertiary)] text-xs mt-2">
                          OTP sent to {email}
                        </p>
                      </div>
                    )}

                    {/* New Password Fields (only after OTP sent) */}
                    {otpSent && (
                      <>
                        <div>
                          <label className="flex items-center gap-2 text-[var(--text-primary)] text-sm font-medium mb-3">
                            <Lock
                              size={16}
                              className="text-[var(--accent-primary)]"
                            />
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              className="w-full py-3.5 pl-12 pr-12 bg-white/80 border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all duration-300 placeholder:text-[var(--text-tertiary)]"
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter new password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              required
                              minLength={8}
                            />
                            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                              <Lock
                                size={18}
                                className="text-[var(--text-tertiary)]"
                              />
                            </div>
                            <button
                              type="button"
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff size={20} />
                              ) : (
                                <Eye size={20} />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="flex items-center gap-2 text-[var(--text-primary)] text-sm font-medium mb-3">
                            <Lock
                              size={16}
                              className="text-[var(--accent-primary)]"
                            />
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <input
                              className="w-full py-3.5 pl-12 pr-4 bg-white/80 border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all duration-300 placeholder:text-[var(--text-tertiary)]"
                              type={showPassword ? "text" : "password"}
                              placeholder="Confirm new password"
                              value={confirmNewPassword}
                              onChange={(e) =>
                                setConfirmNewPassword(e.target.value)
                              }
                              required
                            />
                            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                              <Lock
                                size={18}
                                className="text-[var(--text-tertiary)]"
                              />
                            </div>
                          </div>
                          {newPassword &&
                            confirmNewPassword &&
                            newPassword !== confirmNewPassword && (
                              <p className="text-[var(--danger)] text-xs mt-2">
                                Passwords do not match
                              </p>
                            )}
                        </div>

                        {/* Password Strength Indicator */}
                        {newPassword && (
                          <div className="p-4 bg-white/50 border border-[var(--border-color)] rounded-xl">
                            <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
                              Password Strength
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    newPassword.length >= 8
                                      ? "bg-[var(--success)]"
                                      : "bg-[var(--text-tertiary)]"
                                  }`}
                                />
                                <span
                                  className={`text-xs ${
                                    newPassword.length >= 8
                                      ? "text-[var(--success)]"
                                      : "text-[var(--text-tertiary)]"
                                  }`}
                                >
                                  At least 8 characters
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    /[A-Z]/.test(newPassword)
                                      ? "bg-[var(--success)]"
                                      : "bg-[var(--text-tertiary)]"
                                  }`}
                                />
                                <span
                                  className={`text-xs ${
                                    /[A-Z]/.test(newPassword)
                                      ? "text-[var(--success)]"
                                      : "text-[var(--text-tertiary)]"
                                  }`}
                                >
                                  At least one uppercase letter
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    /[0-9]/.test(newPassword)
                                      ? "bg-[var(--success)]"
                                      : "bg-[var(--text-tertiary)]"
                                  }`}
                                />
                                <span
                                  className={`text-xs ${
                                    /[0-9]/.test(newPassword)
                                      ? "text-[var(--success)]"
                                      : "text-[var(--text-tertiary)]"
                                  }`}
                                >
                                  At least one number
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Submit Button */}
                    <button
                      className="w-full mt-2 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-dark)] text-white font-medium py-4 px-4 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl hover:from-[var(--accent-hover)] hover:to-[var(--accent-primary)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg group"
                      type="submit"
                      disabled={loading}
                    >
                      <div className="flex items-center justify-center gap-3">
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : otpSent ? (
                          <CheckCircle
                            size={20}
                            className="group-hover:scale-110 transition-transform"
                          />
                        ) : (
                          <Key
                            size={20}
                            className="group-hover:scale-110 transition-transform"
                          />
                        )}
                        <span>
                          {loading
                            ? otpSent
                              ? "Resetting..."
                              : "Sending OTP..."
                            : otpSent
                            ? "Reset Password"
                            : "Send OTP"}
                        </span>
                      </div>
                    </button>
                  </form>
                ) : (
                  /* Login Form */
                  <form onSubmit={handleLoginSubmit} className="space-y-6">
                    {/* Email Field */}
                    <div>
                      <label className="flex items-center gap-2 text-[var(--text-primary)] text-sm font-medium mb-3">
                        <Mail
                          size={16}
                          className="text-[var(--accent-primary)]"
                        />
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          className="w-full py-3.5 pl-12 pr-4 bg-white/80 border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all duration-300 placeholder:text-[var(--text-tertiary)]"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                          <Mail
                            size={18}
                            className="text-[var(--text-tertiary)]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Password Field */}
                    <div>
                      <label className="flex items-center gap-2 text-[var(--text-primary)] text-sm font-medium mb-3">
                        <Lock
                          size={16}
                          className="text-[var(--accent-primary)]"
                        />
                        Password
                      </label>
                      <div className="relative">
                        <input
                          className="w-full py-3.5 pl-12 pr-12 bg-white/80 border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all duration-300 placeholder:text-[var(--text-tertiary)]"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                          <Lock
                            size={18}
                            className="text-[var(--text-tertiary)]"
                          />
                        </div>
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </button>
                      </div>
                      <div className="flex justify-end mt-2">
                        <button
                          type="button"
                          onClick={() => setShowForgot(true)}
                          className="text-[var(--accent-primary)] text-sm hover:text-[var(--accent-hover)] transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      className="w-full mt-2 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-dark)] text-white font-medium py-4 px-4 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl hover:from-[var(--accent-hover)] hover:to-[var(--accent-primary)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg group"
                      type="submit"
                      disabled={loading}
                    >
                      <div className="flex items-center justify-center gap-3">
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <LogIn
                            size={20}
                            className="group-hover:scale-110 transition-transform"
                          />
                        )}
                        <span>
                          {loading ? "Signing In..." : "Sign In to Dashboard"}
                        </span>
                      </div>
                    </button>

                    {/* Divider */}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[var(--border-color)]"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-[var(--bg-secondary)] text-[var(--text-tertiary)]">
                          New to Compario?
                        </span>
                      </div>
                    </div>

                    {/* Sign Up Link */}
                    <div className="text-center">
                      <Link
                        to="/signup"
                        className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white transition-all duration-300 rounded-xl font-medium"
                      >
                        <span>Create New Account</span>
                        <span className="text-lg">→</span>
                      </Link>
                    </div>
                  </form>
                )}

                <p className="text-center text-[var(--text-tertiary)] text-xs mt-8 pt-6 border-t border-[var(--border-color)]">
                  By signing in, you agree to our{" "}
                  <a
                    href="#"
                    className="text-[var(--accent-primary)] hover:underline"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="text-[var(--accent-primary)] hover:underline"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
