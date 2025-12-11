import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Moon,
  Sun,
  Crown,
  Menu,
  X,
  User,
  Home,
  LayoutDashboard,
  Info,
  UserCircle,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileMenuOpen(false);
  };

  const handleMobileLinkClick = () => {
    setMobileMenuOpen(false);
  };

  // Navigation items for cleaner mapping
  const navItems = [
    { path: "/", label: "Home", icon: Home },
    ...(token
      ? [{ path: "/dashboard", label: "Dashboard", icon: LayoutDashboard }]
      : []),
    { path: "/about", label: "About", icon: Info },
    ...(token
      ? [{ path: "/profile", label: "Profile", icon: UserCircle }]
      : []),
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[var(--bg-primary)]/95 backdrop-blur-xl shadow-sm border-b border-[var(--border-color)]"
          : "bg-[var(--bg-primary)]/80 backdrop-blur-md"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo Section */}
          <Link
            to="/"
            className="flex items-center gap-2 group"
            onClick={() => setMobileMenuOpen(false)}
            onMouseEnter={() => setHoveredItem("logo")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <Crown
              size={20}
              sm:size={24}
              strokeWidth={1.5}
              className={`text-[var(--text-primary)] transition-all duration-300 ${
                hoveredItem === "logo"
                  ? "scale-110 rotate-12 text-[var(--accent-primary)]"
                  : ""
              }`}
            />
            <span
              className={`font-serif text-xl sm:text-2xl text-[var(--text-primary)] tracking-tight font-light transition-all duration-300 ${
                hoveredItem === "logo" ? "text-[var(--accent-primary)]" : ""
              }`}
            >
              ShopThrone
            </span>
            {/* Hover glow effect */}
            {hoveredItem === "logo" && (
              <div className="absolute -inset-2 bg-gradient-to-r from-[var(--accent-primary)]/10 to-transparent blur-sm rounded-full pointer-events-none"></div>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4 lg:gap-8">
            {/* Navigation Links */}
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="relative px-3 py-2 group"
                onMouseEnter={() => setHoveredItem(item.path)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="flex items-center gap-2">
                  <item.icon
                    size={16}
                    className={`transition-all duration-300 ${
                      hoveredItem === item.path
                        ? "text-[var(--accent-primary)] scale-110"
                        : "text-[var(--text-secondary)]"
                    }`}
                  />
                  <span
                    className={`font-light text-sm tracking-wide transition-all duration-300 ${
                      hoveredItem === item.path
                        ? "text-[var(--text-primary)] translate-x-0.5"
                        : "text-[var(--text-secondary)]"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>

                {/* Hover underline effect */}
                {hoveredItem === item.path && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)]/5 to-transparent rounded-lg blur-sm"></div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-light)] rounded-full"></div>
                  </>
                )}
              </Link>
            ))}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-all duration-300 relative group/theme"
              aria-label="Toggle theme"
              onMouseEnter={() => setHoveredItem("theme")}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {theme === "light" ? (
                <>
                  <Moon
                    size={18}
                    strokeWidth={1.5}
                    className={`text-[var(--text-secondary)] transition-all duration-300 ${
                      hoveredItem === "theme"
                        ? "rotate-12 scale-110 text-[var(--accent-primary)]"
                        : ""
                    }`}
                  />
                  {hoveredItem === "theme" && (
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)]/10 to-transparent rounded-full blur-sm"></div>
                  )}
                </>
              ) : (
                <>
                  <Sun
                    size={18}
                    strokeWidth={1.5}
                    className={`text-[var(--text-secondary)] transition-all duration-300 ${
                      hoveredItem === "theme"
                        ? "rotate-12 scale-110 text-[var(--accent-primary)]"
                        : ""
                    }`}
                  />
                  {hoveredItem === "theme" && (
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)]/10 to-transparent rounded-full blur-sm"></div>
                  )}
                </>
              )}
            </button>

            {/* Conditional buttons based on auth status */}
            {token ? (
              <>
                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="px-4 sm:px-6 py-2 border border-[var(--border-color)] text-[var(--text-primary)] rounded-full hover:border-[var(--accent-primary)] transition-all font-light text-sm tracking-wide relative group/logout"
                  onMouseEnter={() => setHoveredItem("logout")}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  Logout
                  {hoveredItem === "logout" && (
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)]/5 to-transparent rounded-full blur-sm"></div>
                  )}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 sm:px-6 py-2 bg-[var(--accent-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-all font-light text-sm tracking-wide rounded-full relative group/login overflow-hidden"
                  onMouseEnter={() => setHoveredItem("login")}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {/* Shine effect */}
                  {hoveredItem === "login" && (
                    <>
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -inset-y-full -left-20 w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine"></div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-dark)] opacity-90"></div>
                    </>
                  )}
                  <span className="relative">Login</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Theme Toggle (Mobile) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-all duration-300 active:scale-95"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon
                  size={18}
                  strokeWidth={1.5}
                  className="text-[var(--text-secondary)]"
                />
              ) : (
                <Sun
                  size={18}
                  strokeWidth={1.5}
                  className="text-[var(--text-secondary)]"
                />
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-full transition-all duration-300 active:scale-95"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--bg-primary)] border-t border-[var(--border-color)] animate-in slide-in-from-top-4 duration-300">
          <div className="px-6 py-6 space-y-4">
            {/* User Info if logged in */}
            {token && user && (
              <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[var(--bg-secondary)] to-[var(--bg-tertiary)]/30 rounded-lg mb-2">
                <User size={20} className="text-[var(--text-secondary)]" />
                <div>
                  <p className="text-sm font-light text-[var(--text-primary)]">
                    {user.name || user.email}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {user.email}
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleMobileLinkClick}
                  className="flex items-center gap-3 px-4 py-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-all duration-300 active:scale-95"
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
              {token ? (
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] rounded-lg transition-all duration-300 active:scale-95 font-light text-sm"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={handleMobileLinkClick}
                    className="block w-full px-4 py-3 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-dark)] text-white hover:opacity-90 text-center rounded-lg transition-all duration-300 active:scale-95 font-light text-sm"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={handleMobileLinkClick}
                    className="block w-full px-4 py-3 border border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 text-center rounded-lg transition-all duration-300 active:scale-95 font-light text-sm"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>

            {/* Theme Selector (Mobile) */}
            <div className="pt-4 border-t border-[var(--border-color)]">
              <button
                onClick={toggleTheme}
                className="flex items-center justify-between w-full px-4 py-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-all duration-300 active:scale-95"
              >
                <span className="font-light">Theme</span>
                <div className="flex items-center gap-2">
                  {theme === "light" ? (
                    <>
                      <Moon size={16} />
                      <span className="text-xs">Dark Mode</span>
                    </>
                  ) : (
                    <>
                      <Sun size={16} />
                      <span className="text-xs">Light Mode</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add shine animation styles */}
      <style jsx>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(30deg);
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(30deg);
          }
        }
        .animate-shine {
          animation: shine 1.5s ease-in-out;
        }
      `}</style>
    </nav>
  );
}
