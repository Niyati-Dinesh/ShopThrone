import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import {
  Sparkles,
  UserPlus,
  Eye,
  EyeOff,
  Check,
  X,
  Info,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Calendar,
  Users,
  Award,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Signup() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    address: "",
    pin: "",
    age: "",
    gender: "other",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const auth = useAuth();
  const navigate = useNavigate();

  // Password requirements
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // Validate password in real-time
  useEffect(() => {
    const requirements = {
      length: formData.password.length >= 8,
      uppercase: /[A-Z]/.test(formData.password),
      lowercase: /[a-z]/.test(formData.password),
      number: /[0-9]/.test(formData.password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    };
    setPasswordRequirements(requirements);
  }, [formData.password]);

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case "email":
        if (!value) {
          newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = "Please enter a valid email address";
        } else {
          delete newErrors.email;
        }
        break;

      case "password":
        if (!value) {
          newErrors.password = "Password is required";
        } else if (
          !passwordRequirements.length ||
          !passwordRequirements.uppercase ||
          !passwordRequirements.lowercase ||
          !passwordRequirements.number ||
          !passwordRequirements.special
        ) {
          newErrors.password = "Password does not meet requirements";
        } else {
          delete newErrors.password;
        }
        break;

      case "name":
        if (!value) {
          newErrors.name = "Full name is required";
        } else if (value.length < 2) {
          newErrors.name = "Name must be at least 2 characters";
        } else {
          delete newErrors.name;
        }
        break;

      case "phone":
        if (!value) {
          newErrors.phone = "Phone number is required";
        } else if (!/^[0-9]{10}$/.test(value.replace(/\D/g, ""))) {
          newErrors.phone = "Please enter a valid 10-digit phone number";
        } else {
          delete newErrors.phone;
        }
        break;

      case "pin":
        if (!value) {
          newErrors.pin = "PIN code is required";
        } else if (!/^[0-9]{6}$/.test(value)) {
          newErrors.pin = "Please enter a valid 6-digit PIN code";
        } else {
          delete newErrors.pin;
        }
        break;

      case "age":
        if (!value) {
          newErrors.age = "Age is required";
        } else if (parseInt(value) < 13) {
          newErrors.age = "You must be at least 13 years old";
        } else if (parseInt(value) > 120) {
          newErrors.age = "Please enter a valid age";
        } else {
          delete newErrors.age;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Format phone number
    if (name === "phone") {
      processedValue = value.replace(/\D/g, "").slice(0, 10);
    }

    // Format PIN code
    if (name === "pin") {
      processedValue = value.replace(/\D/g, "").slice(0, 6);
    }

    // Format age
    if (name === "age") {
      processedValue = value.replace(/\D/g, "").slice(0, 3);
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    // Validate field if it's been touched
    if (touched[name]) {
      validateField(name, processedValue);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const validateForm = () => {
    const newTouched = {};
    Object.keys(formData).forEach((key) => {
      if (key !== "gender") {
        // gender has a default value
        newTouched[key] = true;
      }
    });
    setTouched(newTouched);

    Object.keys(formData).forEach((key) => {
      if (key !== "gender") {
        validateField(key, formData[key]);
      }
    });

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);
    const success = await auth.signup({
      ...formData,
      age: parseInt(formData.age),
    });
    if (success) {
      navigate("/dashboard");
    }
    setLoading(false);
  };

  const isFormValid =
    Object.keys(errors).length === 0 &&
    Object.values(formData).every((value) => value !== "") &&
    formData.password &&
    Object.values(passwordRequirements).every((req) => req);

  // Password strength indicator
  const getPasswordStrength = () => {
    const metRequirements =
      Object.values(passwordRequirements).filter(Boolean).length;
    if (metRequirements <= 2)
      return {
        strength: "Weak",
        color: "text-[var(--danger)]",
        bg: "bg-[var(--danger)]",
      };
    if (metRequirements <= 4)
      return {
        strength: "Medium",
        color: "text-[var(--warning)]",
        bg: "bg-[var(--warning)]",
      };
    return {
      strength: "Strong",
      color: "text-[var(--success)]",
      bg: "bg-[var(--success)]",
    };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Side - Form */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-2xl">
              <div className="bg-gradient-to-br from-[var(--bg-secondary)] to-white/50 rounded-2xl p-8 border border-[var(--border-color)] shadow-lg">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-dark)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <UserPlus size={28} className="text-white" />
                  </div>
                  <h2 className="font-serif text-2xl text-[var(--text-primary)]">
                    Create Your Account
                  </h2>
                  <p className="text-[var(--text-secondary)] text-sm mt-2">
                    Join thousands of smart shoppers saving money daily
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name Field */}
                    <InputField
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.name}
                      touched={touched.name}
                      icon={User}
                      required
                    />

                    {/* Email Field */}
                    <InputField
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.email}
                      touched={touched.email}
                      icon={Mail}
                      required
                    />

                    {/* Password Field */}
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-[var(--text-primary)] text-sm font-medium mb-3">
                        <Lock
                          size={16}
                          className="text-[var(--accent-primary)]"
                        />
                        Password
                      </label>
                      <div className="relative">
                        <input
                          className={`w-full py-3.5 pl-12 pr-12 bg-white/80 border ${
                            errors.password && touched.password
                              ? "border-[var(--danger)] bg-[var(--danger)]/5"
                              : "border-[var(--border-color)]"
                          } text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all duration-300 placeholder:text-[var(--text-tertiary)]`}
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={formData.password}
                          onChange={handleChange}
                          onBlur={handleBlur}
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

                      {touched.password && (
                        <>
                          {/* Password Strength Indicator */}
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-sm text-[var(--text-secondary)]">
                              Password strength:
                            </span>
                            <span
                              className={`text-sm font-medium ${passwordStrength.color}`}
                            >
                              {passwordStrength.strength}
                            </span>
                          </div>
                          <div className="w-full bg-[var(--border-color)] rounded-full h-1.5 mt-1">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.bg}`}
                              style={{
                                width: `${
                                  (Object.values(passwordRequirements).filter(
                                    Boolean
                                  ).length /
                                    5) *
                                  100
                                }%`,
                              }}
                            />
                          </div>

                          {/* Password Requirements */}
                          <div className="mt-4 p-4 bg-white/50 border border-[var(--border-color)] rounded-xl">
                            <div className="flex items-center gap-2 mb-3">
                              <Info
                                size={16}
                                className="text-[var(--accent-primary)]"
                              />
                              <span className="text-sm font-medium text-[var(--text-primary)]">
                                Password must contain:
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <RequirementItem
                                met={passwordRequirements.length}
                                text="At least 8 characters"
                              />
                              <RequirementItem
                                met={passwordRequirements.uppercase}
                                text="One uppercase letter (A-Z)"
                              />
                              <RequirementItem
                                met={passwordRequirements.lowercase}
                                text="One lowercase letter (a-z)"
                              />
                              <RequirementItem
                                met={passwordRequirements.number}
                                text="One number (0-9)"
                              />
                              <RequirementItem
                                met={passwordRequirements.special}
                                text="One special character (!@#$%^&*)"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {errors.password && touched.password && (
                        <p className="text-[var(--danger)] text-sm mt-2 flex items-center gap-2">
                          <X size={14} />
                          {errors.password}
                        </p>
                      )}
                    </div>

                    {/* Phone Field */}
                    <InputField
                      label="Phone Number"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.phone}
                      touched={touched.phone}
                      icon={Phone}
                      required
                    />

                    {/* Address Field */}
                    <InputField
                      label="Address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.address}
                      touched={touched.address}
                      icon={MapPin}
                      required
                    />

                    {/* PIN Code Field */}
                    <InputField
                      label="PIN Code"
                      name="pin"
                      value={formData.pin}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.pin}
                      touched={touched.pin}
                      icon={Calendar}
                      required
                    />

                    {/* Age Field */}
                    <InputField
                      label="Age"
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.age}
                      touched={touched.age}
                      icon={Users}
                      required
                    />

                    {/* Gender Field */}
                    <div>
                      <label className="flex items-center gap-2 text-[var(--text-primary)] text-sm font-medium mb-3">
                        <Users
                          size={16}
                          className="text-[var(--accent-primary)]"
                        />
                        Gender
                      </label>
                      <div className="relative">
                        <select
                          name="gender"
                          id="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="w-full py-3.5 pl-12 pr-4 bg-white/80 border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all duration-300 appearance-none"
                        >
                          <option value="other">Prefer not to say</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                          <Users
                            size={18}
                            className="text-[var(--text-tertiary)]"
                          />
                        </div>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <ChevronDown
                            size={18}
                            className="text-[var(--text-tertiary)]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    className={`w-full mt-8 ${
                      isFormValid
                        ? "bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-dark)] hover:from-[var(--accent-hover)] hover:to-[var(--accent-primary)] cursor-pointer"
                        : "bg-[var(--border-color)] cursor-not-allowed"
                    } text-white font-medium py-4 px-4 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group disabled:opacity-70`}
                    type="submit"
                    disabled={loading || !isFormValid}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <UserPlus
                        size={20}
                        className="group-hover:scale-110 transition-transform"
                      />
                    )}
                    {loading
                      ? "Creating Account..."
                      : "Create Account & Start Saving"}
                  </button>

                  {/* Login Link */}
                  <p className="text-center text-[var(--text-secondary)] text-sm mt-6">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="text-[var(--accent-primary)] hover:text-[var(--accent-hover)] font-medium transition-colors"
                    >
                      Sign In
                    </Link>
                  </p>
                </form>

                <p className="text-center text-[var(--text-tertiary)] text-xs mt-8 pt-6 border-t border-[var(--border-color)]">
                  By creating an account, you agree to our{" "}
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

          {/* Right Side - Benefits & Features */}
          <div className="flex flex-col justify-center">
            <div className="mb-8 lg:mb-12">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[var(--accent-primary)]/10 to-[var(--accent-primary)]/5 rounded-full border border-[var(--accent-primary)]/20 mb-6">
                <Sparkles size={20} className="text-[var(--accent-primary)]" />
                <span className="text-[var(--accent-primary)] font-medium text-sm tracking-wide">
                  JOIN SMART SHOPPERS
                </span>
              </div>

              <h1 className="font-serif text-4xl lg:text-5xl text-[var(--text-primary)] mb-4 leading-tight">
                Start Saving with{" "}
                <span className="text-[var(--accent-primary)]">ShopThrone</span>
              </h1>
              <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
                Join our community of smart shoppers who save an average of
                ₹5,000+ monthly using smart price comparison and deal hunting.
              </p>
            </div>

            {/* Benefits List */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[var(--bg-secondary)] to-white/50 rounded-xl border border-[var(--border-color)]">
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--success)] to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-[var(--text-primary)]">
                    Smart Price Comparison
                  </h3>
                  <p className="text-[var(--text-tertiary)] text-sm">
                    AI scans Amazon, Flipkart & Snapdeal for best deals
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[var(--bg-secondary)] to-white/50 rounded-xl border border-[var(--border-color)]">
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-dark)] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-[var(--text-primary)]">
                    AI-Powered Image Search
                  </h3>
                  <p className="text-[var(--text-tertiary)] text-sm">
                    Upload product images to find best prices instantly
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[var(--bg-secondary)] to-white/50 rounded-xl border border-[var(--border-color)]">
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--warning)] to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Award size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-[var(--text-primary)]">
                    Track Your Savings
                  </h3>
                  <p className="text-[var(--text-tertiary)] text-sm">
                    Monitor how much you save with detailed analytics
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--accent-primary)]">
                  ₹5000+
                </div>
                <div className="text-[var(--text-tertiary)] text-xs">
                  Avg. Monthly Savings
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--accent-primary)]">
                  50K+
                </div>
                <div className="text-[var(--text-tertiary)] text-xs">
                  Active Users
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--accent-primary)]">
                  ₹25M+
                </div>
                <div className="text-[var(--text-tertiary)] text-xs">
                  Total Savings
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
const InputField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  touched,
  icon: Icon,
  required,
}) => (
  <div>
    <label className="flex items-center gap-2 text-[var(--text-primary)] text-sm font-medium mb-3">
      <Icon size={16} className="text-[var(--accent-primary)]" />
      {label} {required && <span className="text-[var(--danger)]">*</span>}
    </label>
    <div className="relative">
      <input
        className={`w-full py-3.5 pl-12 pr-4 bg-white/80 border ${
          error && touched
            ? "border-[var(--danger)] bg-[var(--danger)]/5"
            : "border-[var(--border-color)]"
        } text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all duration-300 placeholder:text-[var(--text-tertiary)]`}
        id={name}
        name={name}
        type={type}
        placeholder={label}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
      />
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
        <Icon size={18} className="text-[var(--text-tertiary)]" />
      </div>
    </div>
    {error && touched && (
      <p className="text-[var(--danger)] text-sm mt-2 flex items-center gap-2">
        <X size={14} />
        {error}
      </p>
    )}
  </div>
);

const RequirementItem = ({ met, text }) => (
  <div className="flex items-center gap-3">
    {met ? (
      <Check size={16} className="text-[var(--success)]" />
    ) : (
      <X size={16} className="text-[var(--danger)]" />
    )}
    <span
      className={`text-sm ${
        met ? "text-[var(--success)]" : "text-[var(--text-tertiary)]"
      }`}
    >
      {text}
    </span>
  </div>
);

// Missing icon component
const ChevronDown = ({ size, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);
