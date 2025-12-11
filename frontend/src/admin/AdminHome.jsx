import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Activity,
  TrendingUp,
  Clock,
  Database,
  Server,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  RefreshCw,
  Download,
  Filter,
  Menu,
  X,
  MapPin,
  Package,
  PieChart,
  BarChart,
  LineChart,
  Bell,
  Cpu,
  HardDrive,
  Wifi,
  Shield,
  Zap,
  TrendingDown,
  DollarSign,
  Percent,
  Calendar,
  UserPlus,
  ShoppingCart,
  Smartphone,
  Shirt,
  Home,
  Globe as GlobeIcon,
  AlertTriangle,
  Info,
  Settings,
  LogOut,
  BarChart3,
  ShoppingBag,
  Image as ImageIcon,
  FileText,
  Map,
  Target,
  UserX,
  ShieldAlert,
  Globe,
  Mail,
  Save,
  Upload,
  BellRing,
  DatabaseBackup,
  BarChart4,
  Users as UsersIcon,
  SearchCheck,
  ActivitySquare,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Thermometer,
  Gauge,
  Network,
  HardDrive as Storage,
  Clock4,
  ShieldCheck,
  Key,
  DownloadCloud,
  Cloud,
  ShieldOff,
  BellOff,
  MailCheck,
  MoreVertical,
  Grid,
} from "lucide-react";

const API_BASE = "http://localhost:5555";

export default function AdminHome() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState({ users: [], total: 0, total_pages: 1 });
  const [searches, setSearches] = useState({
    image_searches: [],
    manual_searches: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [userPage, setUserPage] = useState(1);
  const [searchPage, setSearchPage] = useState(1);
  const [filterActive, setFilterActive] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [scraperStatus, setScraperStatus] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [adminSettings, setAdminSettings] = useState(null);
  const [userRegions, setUserRegions] = useState([]);
  const [searchInsights, setSearchInsights] = useState(null);
  const [realtimeAnalytics, setRealtimeAnalytics] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [settingsChanged, setSettingsChanged] = useState(false);
  const [tempSettings, setTempSettings] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check screen size for responsive behavior
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    loadDashboardData();
    loadSystemMetrics();
    loadNotifications();
    loadScraperStatus();
    loadRealtimeAnalytics();

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    if (activeTab === "users") loadUsers();
    else if (activeTab === "searches") loadSearches();
    else if (activeTab === "analytics") loadAnalytics();
    else if (activeTab === "settings") loadSettings();
    else if (activeTab === "regions") loadUserRegions();
    else if (activeTab === "insights") loadSearchInsights();
  }, [activeTab, userPage, searchPage, filterActive, searchFilter]);

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
  });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/admin/system/stats`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      setStats(await response.json());
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await fetch(
        `${API_BASE}/api/admin/analytics/dashboard?timeframe=7d`,
        {
          headers: getAuthHeaders(),
        }
      );
      if (!response.ok) throw new Error("Failed to fetch analytics");
      setAnalyticsData(await response.json());
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadSystemMetrics = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/monitoring/live`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) setSystemMetrics(await response.json());
    } catch (error) {
      console.error("Error loading system metrics:", error);
    }
  };

  const loadScraperStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/scrapers/status`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) setScraperStatus(await response.json());
    } catch (error) {
      console.error("Error loading scraper status:", error);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/notifications?unread_only=true`,
        {
          headers: getAuthHeaders(),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/settings`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setAdminSettings(data.settings);
        setTempSettings(data.settings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const loadUserRegions = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/analytics/user-regions`,
        {
          headers: getAuthHeaders(),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setUserRegions(data.regions || []);
      }
    } catch (error) {
      console.error("Error loading user regions:", error);
    }
  };

  const loadSearchInsights = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/analytics/search-insights?timeframe=7d`,
        {
          headers: getAuthHeaders(),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSearchInsights(data);
      }
    } catch (error) {
      console.error("Error loading search insights:", error);
    }
  };

  const loadRealtimeAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/analytics/realtime`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setRealtimeAnalytics(data.realtime);
      }
    } catch (error) {
      console.error("Error loading realtime analytics:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/users?page=${userPage}&limit=10&active_only=${filterActive}&search=${searchFilter}`,
        { headers: getAuthHeaders() }
      );
      if (!response.ok) throw new Error("Failed to fetch users");
      setUsers(await response.json());
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadSearches = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/searches?page=${searchPage}&limit=20`,
        { headers: getAuthHeaders() }
      );
      if (!response.ok) throw new Error("Failed to fetch searches");
      setSearches(await response.json());
    } catch (error) {
      console.error("Error loading searches:", error);
    }
  };

  const viewUserDetails = async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch user details");
      setSelectedUser(await response.json());
      setShowUserModal(true);
    } catch (error) {
      console.error("Error loading user details:", error);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (!response.ok) throw new Error("Failed to update user");
      loadUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser((prev) => ({ ...prev, is_active: !currentStatus }));
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const deleteUser = async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to delete user");
      loadUsers();
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      alert("User deleted successfully!");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    if (activeTab === "users") await loadUsers();
    if (activeTab === "searches") await loadSearches();
    if (activeTab === "analytics") await loadAnalytics();
    if (activeTab === "settings") await loadSettings();
    if (activeTab === "regions") await loadUserRegions();
    if (activeTab === "insights") await loadSearchInsights();
    await loadSystemMetrics();
    await loadNotifications();
    await loadRealtimeAnalytics();
    setTimeout(() => setRefreshing(false), 500);
  };

  const clearCache = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/system/cache/clear`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to clear cache");
      alert("Cache cleared successfully!");
    } catch (error) {
      console.error("Error clearing cache:", error);
      alert("Failed to clear cache");
    }
  };

  const exportData = async (type) => {
    try {
      const endpoint =
        type === "searches"
          ? "/api/admin/export/searches?format=csv"
          : "/api/admin/export/users?format=csv";
      const filename = `${type}_export_${
        new Date().toISOString().split("T")[0]
      }.csv`;

      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Failed to export data");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Failed to export data");
    }
  };

  const updateSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/settings/bulk`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(tempSettings),
      });
      if (!response.ok) throw new Error("Failed to update settings");
      const data = await response.json();
      setAdminSettings(tempSettings);
      setSettingsChanged(false);
      alert("Settings updated successfully!");
    } catch (error) {
      console.error("Error updating settings:", error);
      alert("Failed to update settings");
    }
  };

  const handleSettingChange = (key, value) => {
    setTempSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSettingsChanged(true);
  };

  const testScraper = async (scraperName) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/scrapers/test/${scraperName}?query=iPhone%2015`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );
      if (!response.ok) throw new Error("Failed to test scraper");
      const result = await response.json();
      alert(
        `${scraperName} scraper test ${
          result.success ? "passed" : "failed"
        }. Response time: ${result.response_time}s`
      );
    } catch (error) {
      console.error("Error testing scraper:", error);
      alert("Failed to test scraper");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_email");
    window.location.href = "/youarenotsupposedtocomehere";
  };

  // Component: Stat Card - Responsive
  const StatCard = ({
    icon: Icon,
    label,
    value,
    change,
    color,
    trend,
    description,
  }) => (
    <div className="bg-[#f5f1eb] dark:bg-[#211c18] border border-[#e3ddd4] dark:border-[#3a342e] rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[#8b7d6b] dark:text-[#a89a8b] text-xs sm:text-sm mb-2">
            {label}
          </p>
          <h3 className="font-serif text-xl sm:text-3xl text-[#2d2520] dark:text-[#f5f1eb] mb-1 sm:mb-2">
            {typeof value === "number" ? value?.toLocaleString() : value || "0"}
          </h3>
          {change && (
            <div className="flex items-center gap-1 text-xs sm:text-sm">
              {trend === "up" ? (
                <TrendingUp size={12} className="text-[#6b2d3d]" />
              ) : trend === "down" ? (
                <TrendingDown size={12} className="text-[#6b2d3d]" />
              ) : (
                <TrendingUp size={12} className="text-[#6b2d3d]" />
              )}
              <span className="text-[#6b2d3d]">{change}</span>
            </div>
          )}
          {description && (
            <p className="text-xs text-[#8b7d6b] dark:text-[#a89a8b] mt-1 sm:mt-2">
              {description}
            </p>
          )}
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#6b2d3d] to-[#4a1f2c] rounded-lg sm:rounded-xl flex items-center justify-center ml-2">
          <Icon
            size={isMobile ? 18 : 24}
            className="text-white"
            strokeWidth={1.5}
          />
        </div>
      </div>
    </div>
  );

  // Component: Metric Card - Responsive
  const MetricCard = ({ icon: Icon, label, value, unit, color, subtitle }) => (
    <div className="bg-[#f5f1eb] dark:bg-[#211c18] border border-[#e3ddd4] dark:border-[#3a342e] rounded-xl p-3 sm:p-4 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-[#6b2d3d]/10 flex items-center justify-center">
            <Icon size={isMobile ? 12 : 16} className="text-[#6b2d3d]" />
          </div>
          <span className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b]">
            {label}
          </span>
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg sm:text-2xl font-bold text-[#2d2520] dark:text-[#f5f1eb]">
          {value}
        </span>
        {unit && (
          <span className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b]">
            {unit}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-[#8b7d6b] dark:text-[#a89a8b] mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );

  // Component: Scraper Status Card - Responsive
  const ScraperStatusCard = ({ scraper }) => (
    <div
      className={`bg-[#f5f1eb] dark:bg-[#211c18] border ${
        scraper.enabled
          ? "border-[#e3ddd4] dark:border-[#3a342e]"
          : "border-red-200"
      } rounded-lg p-3 sm:p-4`}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
              scraper.success_rate > 90
                ? "bg-green-500"
                : scraper.success_rate > 80
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
          />
          <span className="font-medium text-sm sm:text-base text-[#2d2520] dark:text-[#f5f1eb] truncate">
            {scraper.name}
          </span>
        </div>
        <span
          className={`text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full ${
            scraper.enabled
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-700"
          }`}
        >
          {scraper.enabled ? "Active" : "Disabled"}
        </span>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-[#8b7d6b] dark:text-[#a89a8b]">
            Success Rate
          </span>
          <span className="font-medium text-[#2d2520] dark:text-[#f5f1eb]">
            {scraper.success_rate}%
          </span>
        </div>
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-[#8b7d6b] dark:text-[#a89a8b]">
            Response Time
          </span>
          <span className="font-medium text-[#2d2520] dark:text-[#f5f1eb]">
            {scraper.avg_response_time}s
          </span>
        </div>
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-[#8b7d6b] dark:text-[#a89a8b]">Category</span>
          <span className="font-medium text-[#2d2520] dark:text-[#f5f1eb] truncate">
            {scraper.category}
          </span>
        </div>
      </div>

      <button
        onClick={() => testScraper(scraper.key)}
        className="w-full mt-2 sm:mt-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-[#F0E6C5] dark:bg-[#2a2420] hover:bg-[#e3ddd4] dark:hover:bg-[#3a342e] rounded-lg transition-colors text-[#2d2520] dark:text-[#f5f1eb]"
      >
        Test Scraper
      </button>
    </div>
  );

  // Component: Region Card - Responsive
  const RegionCard = ({ region }) => (
    <div className="bg-[#f5f1eb] dark:bg-[#211c18] border border-[#e3ddd4] dark:border-[#3a342e] rounded-lg p-3 sm:p-4 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <MapPin size={isMobile ? 14 : 16} className="text-[#6b2d3d]" />
          <span className="font-medium text-sm sm:text-base text-[#2d2520] dark:text-[#f5f1eb] truncate">
            Region {region.region_code}
          </span>
        </div>
        <span className="text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full bg-[#F0E6C5] dark:bg-[#2a2420] text-[#2d2520] dark:text-[#f5f1eb]">
          {region.user_count} users
        </span>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-[#8b7d6b] dark:text-[#a89a8b]">
            Active Users
          </span>
          <span className="font-medium text-[#2d2520] dark:text-[#f5f1eb]">
            {region.active_users}
          </span>
        </div>
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-[#8b7d6b] dark:text-[#a89a8b]">
            Inactive Users
          </span>
          <span className="font-medium text-[#2d2520] dark:text-[#f5f1eb]">
            {region.user_count - region.active_users}
          </span>
        </div>
      </div>

      <button
        onClick={() => setSelectedRegion(region)}
        className="w-full mt-2 sm:mt-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-[#F0E6C5] dark:bg-[#2a2420] hover:bg-[#e3ddd4] dark:hover:bg-[#3a342e] rounded-lg transition-colors text-[#2d2520] dark:text-[#f5f1eb]"
      >
        View Details
      </button>
    </div>
  );

  // Component: User Row - Responsive
  const UserRow = ({ user }) => (
    <tr className="border-b border-[#e3ddd4] dark:border-[#3a342e] hover:bg-[#f5f1eb] dark:hover:bg-[#211c18] transition-colors">
      <td className="py-3 px-3 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#6b2d3d] to-[#4a1f2c] rounded-full flex items-center justify-center text-white text-sm sm:text-base font-medium">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm sm:text-base text-[#2d2520] dark:text-[#f5f1eb] truncate">
              {user.name}
            </p>
            <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b] truncate">
              {user.email}
            </p>
          </div>
        </div>
      </td>
      <td className="py-3 px-3 sm:px-6 text-sm sm:text-base text-[#5a4e42] dark:text-[#d4c9bc]">
        {isMobile ? (
          <span className="truncate block max-w-[100px]">
            {user.phone || "N/A"}
          </span>
        ) : (
          user.phone || "N/A"
        )}
      </td>
      <td className="py-3 px-3 sm:px-6 text-sm sm:text-base text-[#5a4e42] dark:text-[#d4c9bc] hidden sm:table-cell">
        {user.pin || "N/A"}
      </td>
      <td className="py-3 px-3 sm:px-6">
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
            user.is_active
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {user.is_active ? <CheckCircle size={10} /> : <XCircle size={10} />}
          {isMobile
            ? user.is_active
              ? "✓"
              : "✗"
            : user.is_active
            ? "Active"
            : "Inactive"}
        </span>
      </td>
      <td className="py-3 px-3 sm:px-6 text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b] hidden md:table-cell">
        {user.created_at
          ? new Date(user.created_at).toLocaleDateString()
          : "N/A"}
      </td>
      <td className="py-3 px-3 sm:px-6">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => viewUserDetails(user.id)}
            className="p-1.5 sm:p-2 hover:bg-[#F0E6C5] dark:hover:bg-[#2a2420] rounded-lg transition-colors"
            title="View Details"
          >
            <Eye size={isMobile ? 14 : 16} className="text-[#6b2d3d]" />
          </button>
          <button
            onClick={() => toggleUserStatus(user.id, user.is_active)}
            className="p-1.5 sm:p-2 hover:bg-[#F0E6C5] dark:hover:bg-[#2a2420] rounded-lg transition-colors"
            title={user.is_active ? "Deactivate" : "Activate"}
          >
            {user.is_active ? (
              <UserX size={isMobile ? 14 : 16} className="text-red-500" />
            ) : (
              <CheckCircle
                size={isMobile ? 14 : 16}
                className="text-green-500"
              />
            )}
          </button>
          <button
            onClick={() => {
              setUserToDelete(user);
              setShowDeleteConfirm(true);
            }}
            className="p-1.5 sm:p-2 hover:bg-[#F0E6C5] dark:hover:bg-[#2a2420] rounded-lg transition-colors"
            title="Delete User"
          >
            <Trash2 size={isMobile ? 14 : 16} className="text-red-500" />
          </button>
        </div>
      </td>
    </tr>
  );

  // Component: Search Row with user info - Responsive
  const SearchRow = ({ search, type }) => {
    const hasPrices =
      search.amazon_price ||
      search.flipkart_price ||
      search.snapdeal_price ||
      search.croma_price ||
      search.reliance_price ||
      search.ajio_price;

    return (
      <tr className="border-b border-[#e3ddd4] dark:border-[#3a342e] hover:bg-[#f5f1eb] dark:hover:bg-[#211c18] transition-colors">
        <td className="py-3 px-3 sm:px-6">
          <div className="flex items-center gap-2">
            {type === "image" ? (
              <ImageIcon size={isMobile ? 14 : 18} className="text-[#6b2d3d]" />
            ) : (
              <FileText size={isMobile ? 14 : 18} className="text-[#6b2d3d]" />
            )}
            <div className="min-w-0 flex-1">
              <span className="text-sm sm:text-base text-[#2d2520] dark:text-[#f5f1eb] block truncate">
                {type === "image" ? search.predicted_product : search.query}
              </span>
              <span className="text-xs text-[#8b7d6b] dark:text-[#a89a8b]">
                {type === "image" ? "Image" : "Manual"}
              </span>
            </div>
          </div>
        </td>
        <td className="py-3 px-3 sm:px-6">
          <button
            onClick={() => viewUserDetails(search.user_id)}
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-[#6b2d3d] hover:text-[#8b3d52] transition-colors"
          >
            <Users size={isMobile ? 12 : 14} />
            <span>User #{search.user_id}</span>
          </button>
        </td>
        <td className="py-3 px-3 sm:px-6">
          {hasPrices ? (
            <div className="space-y-0.5 sm:space-y-1">
              {search.amazon_price && (
                <div className="text-xs sm:text-sm text-[#5a4e42] dark:text-[#d4c9bc] flex items-center gap-1">
                  <ShoppingBag size={isMobile ? 10 : 12} /> Amazon: ₹
                  {search.amazon_price}
                </div>
              )}
              {search.flipkart_price && (
                <div className="text-xs sm:text-sm text-[#5a4e42] dark:text-[#d4c9bc] flex items-center gap-1">
                  <ShoppingCart size={isMobile ? 10 : 12} /> Flipkart: ₹
                  {search.flipkart_price}
                </div>
              )}
            </div>
          ) : (
            <span className="text-xs text-[#8b7d6b] dark:text-[#a89a8b] italic">
              No prices
            </span>
          )}
        </td>
        <td className="py-3 px-3 sm:px-6 text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b]">
          {isMobile
            ? new Date(search.created_at).toLocaleDateString()
            : new Date(search.created_at).toLocaleString()}
        </td>
      </tr>
    );
  };

  // Mobile Sidebar Component
  const MobileSidebar = () => (
    <div
      className={`fixed inset-0 z-40 lg:hidden ${
        mobileMenuOpen ? "block" : "hidden"
      }`}
    >
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => setMobileMenuOpen(false)}
      />
      <div className="fixed inset-y-0 left-0 w-64 bg-[#f5f1eb] dark:bg-[#211c18] border-r border-[#e3ddd4] dark:border-[#3a342e] overflow-y-auto">
        <div className="p-6">
          <div
            className={`flex items-center ${
              sidebarOpen ? "justify-between mb-8" : "justify-center mb-10"
            }`}
          >
            {sidebarOpen ? (
              <h2 className="font-serif text-2xl text-[#2d2520] dark:text-[#f5f1eb]">
                Admin
              </h2>
            ) : (
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-[#6b2d3d] to-[#4a1f2c] rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3
                    size={22}
                    className="text-white"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#f5f1eb] dark:bg-[#211c18] border-2 border-[#6b2d3d] rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-[#6b2d3d] rounded-full"></div>
                </div>
              </div>
            )}
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-[#F0E6C5] dark:hover:bg-[#2a2420] rounded-lg transition-colors"
              >
                <X size={20} className="text-[#2d2520] dark:text-[#f5f1eb]" />
              </button>
            )}
          </div>

          <nav className="space-y-2">
            {[
              { id: "overview", icon: BarChart3, label: "Overview" },
              { id: "users", icon: Users, label: "Users" },
              { id: "searches", icon: Search, label: "Searches" },
              { id: "analytics", icon: PieChart, label: "Analytics" },
              { id: "insights", icon: Target, label: "Insights" },
              { id: "regions", icon: Map, label: "User Regions" },
              { id: "system", icon: Server, label: "System" },
              { id: "scrapers", icon: ShoppingBag, label: "Scrapers" },
              { id: "settings", icon: Settings, label: "Settings" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#6b2d3d] text-white"
                    : "text-[#5a4e42] dark:text-[#d4c9bc] hover:bg-[#F0E6C5] dark:hover:bg-[#2a2420]"
                }`}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-[#e3ddd4] dark:border-[#3a342e]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] dark:bg-[#1a1412] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#6b2d3d] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#5a4e42] dark:text-[#d4c9bc]">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#1a1412] flex">
      {/* Mobile Sidebar */}
      <MobileSidebar />

      {/* Desktop Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-[#f5f1eb] dark:bg-[#211c18] border-r border-[#e3ddd4] dark:border-[#3a342e] transition-all duration-300 hidden lg:flex flex-col`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            {sidebarOpen ? (
              <h2 className="font-serif text-2xl text-[#2d2520] dark:text-[#f5f1eb]">
                Admin
              </h2>
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-[#6b2d3d] to-[#4a1f2c] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-[#F0E6C5] dark:hover:bg-[#2a2420] rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <X size={20} className="text-[#2d2520] dark:text-[#f5f1eb]" />
              ) : (
                <Menu
                  size={20}
                  className="text-[#2d2520] dark:text-[#f5f1eb]"
                />
              )}
            </button>
          </div>

          <nav className="space-y-2">
            {[
              { id: "overview", icon: BarChart3, label: "Overview" },
              { id: "users", icon: Users, label: "Users" },
              { id: "searches", icon: Search, label: "Searches" },
              { id: "analytics", icon: PieChart, label: "Analytics" },
              { id: "insights", icon: Target, label: "Insights" },
              { id: "regions", icon: Map, label: "User Regions" },
              { id: "system", icon: Server, label: "System" },
              { id: "scrapers", icon: ShoppingBag, label: "Scrapers" },
              { id: "settings", icon: Settings, label: "Settings" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center ${
                  sidebarOpen
                    ? "justify-start gap-3 px-4 py-3"
                    : "justify-center p-3"
                } rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#6b2d3d] text-white"
                    : "text-[#5a4e42] dark:text-[#d4c9bc] hover:bg-[#F0E6C5] dark:hover:bg-[#2a2420]"
                }`}
                title={!sidebarOpen ? tab.label : ""}
              >
                <tab.icon size={20} />
                {sidebarOpen && <span>{tab.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-[#e3ddd4] dark:border-[#3a342e]">
          <div className="flex items-center justify-between mb-4">
            {sidebarOpen && realtimeAnalytics && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-[#6b2d3d]" />
                  <span className="text-sm text-[#2d2520] dark:text-[#f5f1eb]">
                    {realtimeAnalytics.searches_last_hour} searches/hour
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-[#6b2d3d]" />
                  <span className="text-sm text-[#2d2520] dark:text-[#f5f1eb]">
                    {notifications.filter((n) => !n.read).length} notifications
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${
              sidebarOpen
                ? "justify-start gap-3 px-4 py-3"
                : "justify-center p-3"
            } rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors`}
            title={!sidebarOpen ? "Logout" : ""}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header - Mobile Optimized */}
        <header className="bg-[#f5f1eb] dark:bg-[#211c18] border-b border-[#e3ddd4] dark:border-[#3a342e] sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden p-2 hover:bg-[#F0E6C5] dark:hover:bg-[#2a2420] rounded-lg transition-colors"
                >
                  <Menu
                    size={20}
                    className="text-[#2d2520] dark:text-[#f5f1eb]"
                  />
                </button>
                <div>
                  <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl text-[#2d2520] dark:text-[#f5f1eb]">
                    Admin Dashboard
                  </h1>
                  <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b] hidden sm:block">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-[#8b7d6b] dark:text-[#a89a8b] sm:hidden">
                    {new Date().toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                {isMobile ? (
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="p-2 bg-[#6b2d3d] text-white rounded-lg hover:bg-[#8b3d52] transition-colors disabled:opacity-50"
                    title="Refresh"
                  >
                    <RefreshCw
                      size={18}
                      className={refreshing ? "animate-spin" : ""}
                    />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => exportData("searches")}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#F0E6C5] dark:bg-[#2a2420] hover:bg-[#e3ddd4] dark:hover:bg-[#3a342e] rounded-lg transition-colors text-[#2d2520] dark:text-[#f5f1eb] text-sm sm:text-base"
                    >
                      <Download size={isMobile ? 16 : 18} />
                      <span className="hidden sm:inline">Export Data</span>
                    </button>
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#6b2d3d] text-white rounded-lg hover:bg-[#8b3d52] transition-colors disabled:opacity-50 text-sm sm:text-base"
                    >
                      <RefreshCw
                        size={isMobile ? 16 : 18}
                        className={refreshing ? "animate-spin" : ""}
                      />
                      <span className="hidden sm:inline">Refresh</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Mobile Tab Navigation */}
          {isMobile && (
            <div className="mb-6 overflow-x-auto">
              <div className="flex space-x-2 pb-2 min-w-max">
                {[
                  { id: "overview", icon: BarChart3, label: "Overview" },
                  { id: "users", icon: Users, label: "Users" },
                  { id: "searches", icon: Search, label: "Searches" },
                  { id: "analytics", icon: PieChart, label: "Analytics" },
                  { id: "settings", icon: Settings, label: "Settings" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg min-w-[80px] transition-colors ${
                      activeTab === tab.id
                        ? "bg-[#6b2d3d] text-white"
                        : "bg-[#F0E6C5] dark:bg-[#2a2420] text-[#2d2520] dark:text-[#f5f1eb]"
                    }`}
                  >
                    <tab.icon size={18} />
                    <span className="text-xs mt-1">{tab.label}</span>
                  </button>
                ))}
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="flex flex-col items-center justify-center px-4 py-2 rounded-lg min-w-[80px] bg-[#F0E6C5] dark:bg-[#2a2420] text-[#2d2520] dark:text-[#f5f1eb]"
                >
                  <MoreVertical size={18} />
                  <span className="text-xs mt-1">More</span>
                </button>
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6 sm:space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard
                  icon={Users}
                  label="Total Users"
                  value={stats?.total_users}
                  change="+12% this month"
                  color="green"
                  trend="up"
                />
                <StatCard
                  icon={Search}
                  label="Total Searches"
                  value={stats?.total_searches}
                  change="+8% this week"
                  color="blue"
                  trend="up"
                />
                <StatCard
                  icon={Activity}
                  label="Active Users (24h)"
                  value={realtimeAnalytics?.active_users_24h || 0}
                  change="Active now"
                  color="purple"
                  trend="up"
                />
                <StatCard
                  icon={Server}
                  label="API Uptime"
                  value={`${stats?.api_uptime}%`}
                  change="Excellent"
                  color="green"
                  trend="up"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-[#f5f1eb] dark:bg-[#211c18] border border-[#e3ddd4] dark:border-[#3a342e] rounded-xl p-4 sm:p-6">
                  <h3 className="font-serif text-lg sm:text-xl text-[#2d2520] dark:text-[#f5f1eb] mb-3 sm:mb-4">
                    System Information
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#5a4e42] dark:text-[#d4c9bc]">
                        Server Time
                      </span>
                      <span className="text-[#2d2520] dark:text-[#f5f1eb] font-medium text-xs sm:text-sm">
                        {new Date(stats?.server_time).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#5a4e42] dark:text-[#d4c9bc]">
                        Database Size
                      </span>
                      <span className="text-[#2d2520] dark:text-[#f5f1eb] font-medium text-xs sm:text-sm">
                        {stats?.database_size}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#5a4e42] dark:text-[#d4c9bc]">
                        Active Scrapers
                      </span>
                      <span className="text-[#2d2520] dark:text-[#f5f1eb] font-medium text-xs sm:text-sm">
                        {stats?.active_scrapers}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#5a4e42] dark:text-[#d4c9bc]">
                        New Users Today
                      </span>
                      <span className="text-[#2d2520] dark:text-[#f5f1eb] font-medium text-xs sm:text-sm">
                        {realtimeAnalytics?.new_users_today || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#f5f1eb] dark:bg-[#211c18] border border-[#e3ddd4] dark:border-[#3a342e] rounded-xl p-4 sm:p-6">
                  <h3 className="font-serif text-lg sm:text-xl text-[#2d2520] dark:text-[#f5f1eb] mb-3 sm:mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <button
                      onClick={clearCache}
                      className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-[#F0E6C5] dark:bg-[#2a2420] hover:bg-[#e3ddd4] dark:hover:bg-[#3a342e] rounded-lg transition-colors text-left text-sm sm:text-base"
                    >
                      <RefreshCw
                        size={isMobile ? 16 : 18}
                        className="text-[#6b2d3d]"
                      />
                      <span className="text-[#2d2520] dark:text-[#f5f1eb]">
                        Clear Cache
                      </span>
                    </button>
                    <button
                      onClick={() => exportData("searches")}
                      className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-[#F0E6C5] dark:bg-[#2a2420] hover:bg-[#e3ddd4] dark:hover:bg-[#3a342e] rounded-lg transition-colors text-left text-sm sm:text-base"
                    >
                      <Download
                        size={isMobile ? 16 : 18}
                        className="text-[#6b2d3d]"
                      />
                      <span className="text-[#2d2520] dark:text-[#f5f1eb]">
                        Export Data
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab("settings")}
                      className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-[#F0E6C5] dark:bg-[#2a2420] hover:bg-[#e3ddd4] dark:hover:bg-[#3a342e] rounded-lg transition-colors text-left text-sm sm:text-base"
                    >
                      <Settings
                        size={isMobile ? 16 : 18}
                        className="text-[#6b2d3d]"
                      />
                      <span className="text-[#2d2520] dark:text-[#f5f1eb]">
                        Settings
                      </span>
                    </button>
                  </div>
                </div>

                <div className="bg-[#f5f1eb] dark:bg-[#211c18] border border-[#e3ddd4] dark:border-[#3a342e] rounded-xl p-4 sm:p-6">
                  <h3 className="font-serif text-lg sm:text-xl text-[#2d2520] dark:text-[#f5f1eb] mb-3 sm:mb-4">
                    Recent Activity
                  </h3>
                  <div className="space-y-2 sm:space-y-3 max-h-48 overflow-y-auto">
                    {realtimeAnalytics && (
                      <div className="space-y-3">
                        <div className="p-3 bg-[#F0E6C5] dark:bg-[#2a2420] rounded-lg">
                          <p className="text-xs sm:text-sm font-medium text-[#2d2520] dark:text-[#f5f1eb]">
                            Searches Last Hour
                          </p>
                          <p className="text-xl sm:text-2xl font-bold text-[#6b2d3d] mt-1">
                            {realtimeAnalytics.searches_last_hour}
                          </p>
                        </div>
                        <div className="p-3 bg-[#F0E6C5] dark:bg-[#2a2420] rounded-lg">
                          <p className="text-xs sm:text-sm font-medium text-[#2d2520] dark:text-[#f5f1eb]">
                            Active Users (24h)
                          </p>
                          <p className="text-xl sm:text-2xl font-bold text-[#6b2d3d] mt-1">
                            {realtimeAnalytics.active_users_24h}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="font-serif text-xl sm:text-2xl text-[#2d2520] dark:text-[#f5f1eb]">
                  User Management
                </h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="px-3 sm:px-4 py-2 bg-[#F0E6C5] dark:bg-[#2a2420] border border-[#e3ddd4] dark:border-[#3a342e] rounded-lg text-[#2d2520] dark:text-[#f5f1eb] placeholder-[#8b7d6b] dark:placeholder-[#a89a8b] text-sm"
                  />
                  <button
                    onClick={() => setFilterActive(!filterActive)}
                    className={`px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 text-sm ${
                      filterActive
                        ? "bg-[#6b2d3d] text-white"
                        : "bg-[#F0E6C5] dark:bg-[#2a2420] text-[#2d2520] dark:text-[#f5f1eb]"
                    }`}
                  >
                    <Filter size={16} />
                    {filterActive ? "Active Only" : "All Users"}
                  </button>
                </div>
              </div>

              <div className="bg-[#f5f1eb] dark:bg-[#211c18] border border-[#e3ddd4] dark:border-[#3a342e] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-[#F0E6C5] dark:bg-[#2a2420] border-b border-[#e3ddd4] dark:border-[#3a342e]">
                      <tr>
                        <th className="py-3 px-3 sm:px-6 text-left text-sm sm:text-base text-[#2d2520] dark:text-[#f5f1eb] font-medium">
                          User
                        </th>
                        <th className="py-3 px-3 sm:px-6 text-left text-sm sm:text-base text-[#2d2520] dark:text-[#f5f1eb] font-medium">
                          Phone
                        </th>
                        <th className="py-3 px-3 sm:px-6 text-left text-sm sm:text-base text-[#2d2520] dark:text-[#f5f1eb] font-medium hidden sm:table-cell">
                          PIN
                        </th>
                        <th className="py-3 px-3 sm:px-6 text-left text-sm sm:text-base text-[#2d2520] dark:text-[#f5f1eb] font-medium">
                          Status
                        </th>
                        <th className="py-3 px-3 sm:px-6 text-left text-sm sm:text-base text-[#2d2520] dark:text-[#f5f1eb] font-medium hidden md:table-cell">
                          Joined
                        </th>
                        <th className="py-3 px-3 sm:px-6 text-left text-sm sm:text-base text-[#2d2520] dark:text-[#f5f1eb] font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.users?.map((user) => (
                        <UserRow key={user.id} user={user} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {users.total_pages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                  <div className="text-sm text-[#8b7d6b] dark:text-[#a89a8b]">
                    Showing {users.users?.length} of {users.total} users
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setUserPage(Math.max(1, userPage - 1))}
                      disabled={userPage === 1}
                      className="px-3 sm:px-4 py-2 bg-[#f5f1eb] dark:bg-[#211c18] rounded-lg disabled:opacity-50 text-sm text-[#2d2520] dark:text-[#f5f1eb]"
                    >
                      Previous
                    </button>
                    <span className="px-3 sm:px-4 py-2 text-sm text-[#2d2520] dark:text-[#f5f1eb]">
                      Page {userPage} of {users.total_pages}
                    </span>
                    <button
                      onClick={() =>
                        setUserPage(Math.min(users.total_pages, userPage + 1))
                      }
                      disabled={userPage === users.total_pages}
                      className="px-3 sm:px-4 py-2 bg-[#f5f1eb] dark:bg-[#211c18] rounded-lg disabled:opacity-50 text-sm text-[#2d2520] dark:text-[#f5f1eb]"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Searches Tab */}
          {activeTab === "searches" && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="font-serif text-xl sm:text-2xl text-[#2d2520] dark:text-[#f5f1eb]">
                  Search History
                </h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="text-sm text-[#8b7d6b] dark:text-[#a89a8b] text-center sm:text-right">
                    Total: {searches.total || 0} searches
                  </div>
                  <button
                    onClick={() => exportData("searches")}
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-[#6b2d3d] text-white rounded-lg hover:bg-[#8b3d52] transition-colors text-sm"
                  >
                    <Download size={16} />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              <div className="bg-[#f5f1eb] dark:bg-[#211c18] border border-[#e3ddd4] dark:border-[#3a342e] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-[#F0E6C5] dark:bg-[#2a2420] border-b border-[#e3ddd4] dark:border-[#3a342e]">
                      <tr>
                        <th className="py-3 px-3 sm:px-6 text-left text-sm sm:text-base text-[#2d2520] dark:text-[#f5f1eb] font-medium">
                          Query
                        </th>
                        <th className="py-3 px-3 sm:px-6 text-left text-sm sm:text-base text-[#2d2520] dark:text-[#f5f1eb] font-medium">
                          User
                        </th>
                        <th className="py-3 px-3 sm:px-6 text-left text-sm sm:text-base text-[#2d2520] dark:text-[#f5f1eb] font-medium">
                          Prices
                        </th>
                        <th className="py-3 px-3 sm:px-6 text-left text-sm sm:text-base text-[#2d2520] dark:text-[#f5f1eb] font-medium">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {searches.image_searches?.map((search) => (
                        <SearchRow
                          key={`img-${search.id}`}
                          search={search}
                          type="image"
                        />
                      ))}
                      {searches.manual_searches?.map((search) => (
                        <SearchRow
                          key={`man-${search.id}`}
                          search={search}
                          type="manual"
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="font-serif text-xl sm:text-2xl text-[#2d2520] dark:text-[#f5f1eb]">
                  Analytics Dashboard
                </h2>
                <div className="flex items-center gap-2">
                  {["7d", "30d", "90d"].map((period) => (
                    <button
                      key={period}
                      onClick={() => loadAnalytics()}
                      className={`px-3 py-1 rounded-lg text-xs sm:text-sm ${
                        period === "7d"
                          ? "bg-[#6b2d3d] text-white"
                          : "bg-[#F0E6C5] dark:bg-[#2a2420] text-[#2d2520] dark:text-[#f5f1eb]"
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              {analyticsLoading ? (
                <div className="flex justify-center items-center h-48 sm:h-64">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#6b2d3d] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[#5a4e42] dark:text-[#d4c9bc]">
                      Loading analytics...
                    </p>
                  </div>
                </div>
              ) : analyticsData ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <StatCard
                      icon={Users}
                      label="Total Users"
                      value={analyticsData.summary?.total_users}
                      color="green"
                    />
                    <StatCard
                      icon={Search}
                      label="Total Searches"
                      value={analyticsData.summary?.total_searches}
                      color="blue"
                    />
                    <StatCard
                      icon={UserPlus}
                      label="New Users Today"
                      value={analyticsData.summary?.new_users_today}
                      color="purple"
                    />
                    <StatCard
                      icon={Activity}
                      label="Search Types"
                      value={`${analyticsData.summary?.image_searches} / ${analyticsData.summary?.manual_searches}`}
                      description="Image / Manual"
                      color="orange"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-[#f5f1eb] dark:bg-[#211c18] border border-[#e3ddd4] dark:border-[#3a342e] rounded-xl p-4 sm:p-6">
                      <h3 className="font-serif text-lg sm:text-xl text-[#2d2520] dark:text-[#f5f1eb] mb-3 sm:mb-4">
                        Category Distribution
                      </h3>
                      <div className="space-y-2 sm:space-y-3">
                        {analyticsData.category_distribution &&
                          Object.entries(
                            analyticsData.category_distribution
                          ).map(([category, count]) => (
                            <div
                              key={category}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-[#5a4e42] dark:text-[#d4c9bc] capitalize truncate mr-2">
                                {category}
                              </span>
                              <span className="text-[#2d2520] dark:text-[#f5f1eb] font-medium whitespace-nowrap">
                                {count} searches
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="bg-[#f5f1eb] dark:bg-[#211c18] border border-[#e3ddd4] dark:border-[#3a342e] rounded-xl p-4 sm:p-6">
                      <h3 className="font-serif text-lg sm:text-xl text-[#2d2520] dark:text-[#f5f1eb] mb-3 sm:mb-4">
                        Platform Usage
                      </h3>
                      <div className="space-y-2 sm:space-y-3">
                        {analyticsData.platform_stats &&
                          Object.entries(analyticsData.platform_stats).map(
                            ([platform, count]) => (
                              <div
                                key={platform}
                                className="flex justify-between items-center text-sm"
                              >
                                <span className="text-[#5a4e42] dark:text-[#d4c9bc] capitalize truncate mr-2">
                                  {platform}
                                </span>
                                <span className="text-[#2d2520] dark:text-[#f5f1eb] font-medium whitespace-nowrap">
                                  {count} results
                                </span>
                              </div>
                            )
                          )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-[#8b7d6b] dark:text-[#a89a8b] mb-4">
                    No analytics data available
                  </p>
                  <button
                    onClick={loadAnalytics}
                    className="px-4 py-2 bg-[#6b2d3d] text-white rounded-lg hover:bg-[#8b3d52] transition-colors text-sm sm:text-base"
                  >
                    Load Analytics
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === "insights" && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="font-serif text-xl sm:text-2xl text-[#2d2520] dark:text-[#f5f1eb]">
                  Search Insights
                </h2>
                <button
                  onClick={loadSearchInsights}
                  className="px-3 sm:px-4 py-2 bg-[#F0E6C5] dark:bg-[#2a2420] hover:bg-[#e3ddd4] dark:hover:bg-[#3a342e] rounded-lg transition-colors text-[#2d2520] dark:text-[#f5f1eb] text-sm sm:text-base"
                >
                  Refresh Insights
                </button>
              </div>

              {searchInsights ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    <div className="bg-[#f5f1eb] dark:bg-[#211c18] border border-[#e3ddd4] dark:border-[#3a342e] rounded-xl p-4 sm:p-6">
                      <h3 className="font-serif text-lg sm:text-xl text-[#2d2520] dark:text-[#f5f1eb] mb-3 sm:mb-4">
                        Search Success Rate
                      </h3>
                      <div className="text-center">
                        <p className="text-3xl sm:text-4xl font-bold text-[#6b2d3d] mb-2">
                          {searchInsights.success_rate}%
                        </p>
                        <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b]">
                          {searchInsights.successful_searches} successful out of{" "}
                          {searchInsights.total_searches_period} searches
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#f5f1eb] dark:bg-[#211c18] border border-[#e3ddd4] dark:border-[#3a342e] rounded-xl p-4 sm:p-6 md:col-span-2">
                      <h3 className="font-serif text-lg sm:text-xl text-[#2d2520] dark:text-[#f5f1eb] mb-3 sm:mb-4">
                        Top Search Users
                      </h3>
                      <div className="space-y-2 sm:space-y-3 max-h-64 overflow-y-auto">
                        {searchInsights.top_users?.map((user, index) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-2 sm:p-3 bg-[#F0E6C5] dark:bg-[#2a2420] rounded-lg"
                          >
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                              <span className="text-xs text-[#8b7d6b] dark:text-[#a89a8b]">
                                #{index + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm sm:text-base text-[#2d2520] dark:text-[#f5f1eb] truncate">
                                  {user.name}
                                </p>
                                <p className="text-xs text-[#8b7d6b] dark:text-[#a89a8b] truncate">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            <div className="text-right pl-2">
                              <p className="font-bold text-sm sm:text-base text-[#6b2d3d]">
                                {user.total_searches} searches
                              </p>
                              <p className="text-xs text-[#8b7d6b] dark:text-[#a89a8b]">
                                {user.image_searches} img •{" "}
                                {user.manual_searches} man
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-[#8b7d6b] dark:text-[#a89a8b] mb-4">
                    No insights data available
                  </p>
                  <button
                    onClick={loadSearchInsights}
                    className="px-4 py-2 bg-[#6b2d3d] text-white rounded-lg hover:bg-[#8b3d52] transition-colors text-sm sm:text-base"
                  >
                    Load Insights
                  </button>
                </div>
              )}
            </div>
          )}

          {/* User Regions Tab */}
          {activeTab === "regions" && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="font-serif text-xl sm:text-2xl text-[#2d2520] dark:text-[#f5f1eb]">
                  User Geographic Distribution
                </h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <span className="text-sm text-[#8b7d6b] dark:text-[#a89a8b] text-center sm:text-right">
                    {userRegions.length} regions detected
                  </span>
                  <button
                    onClick={loadUserRegions}
                    className="px-3 sm:px-4 py-2 bg-[#F0E6C5] dark:bg-[#2a2420] hover:bg-[#e3ddd4] dark:hover:bg-[#3a342e] rounded-lg transition-colors text-[#2d2520] dark:text-[#f5f1eb] text-sm sm:text-base"
                  >
                    Refresh Regions
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {userRegions.map((region) => (
                  <RegionCard key={region.region_code} region={region} />
                ))}
              </div>

              {userRegions.length === 0 && (
                <div className="text-center py-8 sm:py-12">
                  <Map
                    size={isMobile ? 32 : 48}
                    className="mx-auto text-[#8b7d6b] dark:text-[#a89a8b] mb-4"
                  />
                  <p className="text-[#8b7d6b] dark:text-[#a89a8b] mb-4">
                    No regional data available
                  </p>
                  <button
                    onClick={loadUserRegions}
                    className="px-4 py-2 bg-[#6b2d3d] text-white rounded-lg hover:bg-[#8b3d52] transition-colors text-sm sm:text-base"
                  >
                    Load Regional Data
                  </button>
                </div>
              )}
            </div>
          )}

          {/* System Tab */}
          {activeTab === "system" && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              <h2 className="font-serif text-xl sm:text-2xl text-[#2d2520] dark:text-[#f5f1eb]">
                System Health
              </h2>

              {systemMetrics ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    <div className="bg-[#f5f1eb] dark:bg-[#211c18] border border-[#e3ddd4] dark:border-[#3a342e] rounded-xl p-4 sm:p-6">
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <Cpu
                          size={isMobile ? 20 : 24}
                          className="text-blue-500"
                        />
                        <h3 className="font-serif text-base sm:text-lg text-[#2d2520] dark:text-[#f5f1eb]">
                          CPU Usage
                        </h3>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                        {systemMetrics.system?.cpu_usage}%
                      </p>
                      <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b] mt-1 sm:mt-2">
                        {systemMetrics.system?.cpu_usage > 80
                          ? "High load detected"
                          : "Normal operation"}
                      </p>
                    </div>

                    <div className="bg-[#f5f1eb] dark:bg-[#211c18] border border-[#e3ddd4] dark:border-[#3a342e] rounded-xl p-4 sm:p-6">
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <HardDrive
                          size={isMobile ? 20 : 24}
                          className="text-green-500"
                        />
                        <h3 className="font-serif text-base sm:text-lg text-[#2d2520] dark:text-[#f5f1eb]">
                          Memory
                        </h3>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-green-600">
                        {systemMetrics.system?.memory_usage}%
                      </p>
                      <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b] mt-1 sm:mt-2">
                        {systemMetrics.system?.memory_used_gb} GB /{" "}
                        {systemMetrics.system?.memory_total_gb} GB
                      </p>
                    </div>

                    <div className="bg-[#f5f1eb] dark:bg-[#211c18] border border-[#e3ddd4] dark:border-[#3a342e] rounded-xl p-4 sm:p-6">
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <Database
                          size={isMobile ? 20 : 24}
                          className="text-purple-500"
                        />
                        <h3 className="font-serif text-base sm:text-lg text-[#2d2520] dark:text-[#f5f1eb]">
                          Database
                        </h3>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-purple-600">
                        {systemMetrics.database?.active_connections || 0}
                      </p>
                      <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b] mt-1 sm:mt-2">
                        Active connections
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#f5f1eb] dark:bg-[#211c18] border border-[#e3ddd4] dark:border-[#3a342e] rounded-xl p-4 sm:p-6">
                    <h3 className="font-serif text-lg sm:text-xl text-[#2d2520] dark:text-[#f5f1eb] mb-3 sm:mb-4">
                      Real-time Metrics
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      <MetricCard
                        icon={Zap}
                        label="Response Time"
                        value={systemMetrics.application?.response_time_ms}
                        unit="ms"
                        color="blue"
                      />
                      <MetricCard
                        icon={Users}
                        label="Active Users"
                        value={systemMetrics.application?.active_users_15min}
                        unit="users"
                        color="green"
                      />
                      <MetricCard
                        icon={Search}
                        label="Recent Searches"
                        value={systemMetrics.application?.recent_searches_5min}
                        unit="searches"
                        color="purple"
                      />
                      <MetricCard
                        icon={Server}
                        label="API Uptime"
                        value={systemMetrics.application?.api_uptime}
                        color="green"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-[#8b7d6b] dark:text-[#a89a8b] mb-4">
                    System metrics unavailable
                  </p>
                  <button
                    onClick={loadSystemMetrics}
                    className="px-4 py-2 bg-[#6b2d3d] text-white rounded-lg hover:bg-[#8b3d52] transition-colors text-sm sm:text-base"
                  >
                    Load Metrics
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Scrapers Tab */}
          {activeTab === "scrapers" && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="font-serif text-xl sm:text-2xl text-[#2d2520] dark:text-[#f5f1eb]">
                  Scraper Management
                </h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <span className="text-sm text-[#8b7d6b] dark:text-[#a89a8b] text-center sm:text-right">
                    Overall Success: {scraperStatus?.overall_success_rate}%
                  </span>
                  <button
                    onClick={loadScraperStatus}
                    className="px-3 sm:px-4 py-2 bg-[#F0E6C5] dark:bg-[#ffeadc] hover:bg-[#e3ddd4] dark:hover:bg-[#6b2d3d] rounded-lg transition-colors text-sm sm:text-base"
                  >
                    Refresh Status
                  </button>
                </div>
              </div>

              {scraperStatus ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {scraperStatus.scrapers?.map((scraper) => (
                      <ScraperStatusCard key={scraper.key} scraper={scraper} />
                    ))}
                  </div>

                  <div className="bg-[#f5f1eb] dark:bg-[#211c18] border border-[#e3ddd4] dark:border-[#3a342e] rounded-xl p-4 sm:p-6">
                    <h3 className="font-serif text-lg sm:text-xl text-[#2d2520] dark:text-[#f5f1eb] mb-3 sm:mb-4">
                      Scraper Statistics
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      <div className="text-center">
                        <p className="text-xl sm:text-2xl font-bold text-[#2d2520] dark:text-[#f5f1eb]">
                          {scraperStatus.total_enabled}
                        </p>
                        <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b]">
                          Enabled
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl sm:text-2xl font-bold text-[#2d2520] dark:text-[#f5f1eb]">
                          {scraperStatus.overall_success_rate}%
                        </p>
                        <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b]">
                          Success Rate
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl sm:text-2xl font-bold text-[#2d2520] dark:text-[#f5f1eb]">
                          6
                        </p>
                        <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b]">
                          Platforms
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl sm:text-2xl font-bold text-[#2d2520] dark:text-[#f5f1eb]">
                          3
                        </p>
                        <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b]">
                          Categories
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-[#8b7d6b] dark:text-[#a89a8b] mb-4">
                    Scraper status unavailable
                  </p>
                  <button
                    onClick={loadScraperStatus}
                    className="px-4 py-2 bg-[#6b2d3d] text-white rounded-lg hover:bg-[#8b3d52] transition-colors text-sm sm:text-base"
                  >
                    Load Status
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && tempSettings && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="font-serif text-xl sm:text-2xl text-[#2d2520] dark:text-[#f5f1eb]">
                  System Settings
                </h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    onClick={loadSettings}
                    className="px-3 sm:px-4 py-2 bg-[#F0E6C5] dark:bg-[#2a2420] hover:bg-[#e3ddd4] dark:hover:bg-[#3a342e] rounded-lg transition-colors text-[#2d2520] dark:text-[#f5f1eb] text-sm sm:text-base"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={updateSettings}
                    disabled={!settingsChanged}
                    className={`px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm sm:text-base ${
                      settingsChanged
                        ? "bg-[#6b2d3d] text-white hover:bg-[#8b3d52]"
                        : "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    <Save size={isMobile ? 16 : 18} />
                    Save Changes
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* General Settings */}
                <div className="bg-[#f5f1eb] dark:bg-[#211c18] border border-[#e3ddd4] dark:border-[#3a342e] rounded-xl p-4 sm:p-6">
                  <h3 className="font-serif text-lg sm:text-xl text-[#2d2520] dark:text-[#f5f1eb] mb-4 sm:mb-6 flex items-center gap-2">
                    <Settings size={isMobile ? 18 : 20} />
                    General Settings
                  </h3>

                  <div className="space-y-4 sm:space-y-6">
                    {/* System Name */}
                    <div>
                      <label className="block text-sm font-medium text-[#2d2520] dark:text-[#f5f1eb] mb-2">
                        System Name
                      </label>
                      <input
                        type="text"
                        value={tempSettings.system_name || "ShopThrone Admin"}
                        onChange={(e) =>
                          handleSettingChange("system_name", e.target.value)
                        }
                        className="w-full px-3 sm:px-4 py-2 bg-[#F0E6C5] dark:bg-[#2a2420] border border-[#e3ddd4] dark:border-[#3a342e] rounded-lg text-[#2d2520] dark:text-[#f5f1eb] text-sm sm:text-base"
                      />
                    </div>

                    {/* Registration */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm sm:text-base font-medium text-[#2d2520] dark:text-[#f5f1eb]">
                          User Registration
                        </p>
                        <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b]">
                          Allow new users to register
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleSettingChange(
                            "registration_enabled",
                            !tempSettings.registration_enabled
                          )
                        }
                        className={`w-12 sm:w-14 h-6 sm:h-8 flex items-center rounded-full p-1 transition-colors ${
                          tempSettings.registration_enabled
                            ? "bg-[#6b2d3d]"
                            : "bg-gray-300 dark:bg-gray-700"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 sm:w-6 sm:h-6 rounded-full shadow-md transform transition-transform ${
                            tempSettings.registration_enabled
                              ? "translate-x-6 sm:translate-x-6"
                              : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Maintenance Mode */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm sm:text-base font-medium text-[#2d2520] dark:text-[#f5f1eb]">
                          Maintenance Mode
                        </p>
                        <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b]">
                          Disable public access
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleSettingChange(
                            "maintenance_mode",
                            !tempSettings.maintenance_mode
                          )
                        }
                        className={`w-12 sm:w-14 h-6 sm:h-8 flex items-center rounded-full p-1 transition-colors ${
                          tempSettings.maintenance_mode
                            ? "bg-yellow-500"
                            : "bg-gray-300 dark:bg-gray-700"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 sm:w-6 sm:h-6 rounded-full shadow-md transform transition-transform ${
                            tempSettings.maintenance_mode
                              ? "translate-x-6 sm:translate-x-6"
                              : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="bg-[#f5f1eb] dark:bg-[#211c18] border border-[#e3ddd4] dark:border-[#3a342e] rounded-xl p-4 sm:p-6">
                  <h3 className="font-serif text-lg sm:text-xl text-[#2d2520] dark:text-[#f5f1eb] mb-4 sm:mb-6 flex items-center gap-2">
                    <Shield size={isMobile ? 18 : 20} />
                    Security Settings
                  </h3>

                  <div className="space-y-4 sm:space-y-6">
                    {/* Rate Limiting */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm sm:text-base font-medium text-[#2d2520] dark:text-[#f5f1eb]">
                          Rate Limiting
                        </p>
                        <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b]">
                          Protect against abuse
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleSettingChange(
                            "enable_rate_limiting",
                            !tempSettings.enable_rate_limiting
                          )
                        }
                        className={`w-12 sm:w-14 h-6 sm:h-8 flex items-center rounded-full p-1 transition-colors ${
                          tempSettings.enable_rate_limiting
                            ? "bg-[#6b2d3d]"
                            : "bg-gray-300 dark:bg-gray-700"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 sm:w-6 sm:h-6 rounded-full shadow-md transform transition-transform ${
                            tempSettings.enable_rate_limiting
                              ? "translate-x-6 sm:translate-x-6"
                              : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* API Rate Limit */}
                    <div>
                      <label className="block text-sm font-medium text-[#2d2520] dark:text-[#f5f1eb] mb-2">
                        API Rate Limit (requests/minute)
                      </label>
                      <input
                        type="number"
                        value={tempSettings.api_rate_limit || 100}
                        onChange={(e) =>
                          handleSettingChange(
                            "api_rate_limit",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-3 sm:px-4 py-2 bg-[#F0E6C5] dark:bg-[#2a2420] border border-[#e3ddd4] dark:border-[#3a342e] rounded-lg text-[#2d2520] dark:text-[#f5f1eb] text-sm sm:text-base"
                        min="1"
                        max="1000"
                      />
                    </div>

                    {/* Max Users per IP */}
                    <div>
                      <label className="block text-sm font-medium text-[#2d2520] dark:text-[#f5f1eb] mb-2">
                        Max Users per IP
                      </label>
                      <input
                        type="number"
                        value={tempSettings.max_users_per_ip || 5}
                        onChange={(e) =>
                          handleSettingChange(
                            "max_users_per_ip",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-3 sm:px-4 py-2 bg-[#F0E6C5] dark:bg-[#2a2420] border border-[#e3ddd4] dark:border-[#3a342e] rounded-lg text-[#2d2520] dark:text-[#f5f1eb] text-sm sm:text-base"
                        min="1"
                        max="50"
                      />
                    </div>
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-[#f5f1eb] dark:bg-[#211c18] border border-[#e3ddd4] dark:border-[#3a342e] rounded-xl p-4 sm:p-6">
                  <h3 className="font-serif text-lg sm:text-xl text-[#2d2520] dark:text-[#f5f1eb] mb-4 sm:mb-6 flex items-center gap-2">
                    <Bell size={isMobile ? 18 : 20} />
                    Notification Settings
                  </h3>

                  <div className="space-y-4 sm:space-y-6">
                    {/* Email Notifications */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm sm:text-base font-medium text-[#2d2520] dark:text-[#f5f1eb]">
                          Email Notifications
                        </p>
                        <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b]">
                          Send system notifications
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleSettingChange(
                            "email_notifications",
                            !tempSettings.email_notifications
                          )
                        }
                        className={`w-12 sm:w-14 h-6 sm:h-8 flex items-center rounded-full p-1 transition-colors ${
                          tempSettings.email_notifications
                            ? "bg-[#6b2d3d]"
                            : "bg-gray-300 dark:bg-gray-700"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 sm:w-6 sm:h-6 rounded-full shadow-md transform transition-transform ${
                            tempSettings.email_notifications
                              ? "translate-x-6 sm:translate-x-6"
                              : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* System Email */}
                    <div>
                      <label className="block text-sm font-medium text-[#2d2520] dark:text-[#f5f1eb] mb-2">
                        System Email
                      </label>
                      <input
                        type="email"
                        value={
                          tempSettings.system_email || "admin@shopthrone.com"
                        }
                        onChange={(e) =>
                          handleSettingChange("system_email", e.target.value)
                        }
                        className="w-full px-3 sm:px-4 py-2 bg-[#F0E6C5] dark:bg-[#2a2420] border border-[#e3ddd4] dark:border-[#3a342e] rounded-lg text-[#2d2520] dark:text-[#f5f1eb] text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Data Settings */}
                <div className="bg-[#f5f1eb] dark:bg-[#211c18] border border-[#e3ddd4] dark:border-[#3a342e] rounded-xl p-4 sm:p-6">
                  <h3 className="font-serif text-lg sm:text-xl text-[#2d2520] dark:text-[#f5f1eb] mb-4 sm:mb-6 flex items-center gap-2">
                    <Database size={isMobile ? 18 : 20} />
                    Data Settings
                  </h3>

                  <div className="space-y-4 sm:space-y-6">
                    {/* Auto Backup */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm sm:text-base font-medium text-[#2d2520] dark:text-[#f5f1eb]">
                          Automatic Backups
                        </p>
                        <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b]">
                          Frequency: {tempSettings.backup_frequency}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleSettingChange(
                            "auto_backup",
                            !tempSettings.auto_backup
                          )
                        }
                        className={`w-12 sm:w-14 h-6 sm:h-8 flex items-center rounded-full p-1 transition-colors ${
                          tempSettings.auto_backup
                            ? "bg-[#6b2d3d]"
                            : "bg-gray-300 dark:bg-gray-700"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 sm:w-6 sm:h-6 rounded-full shadow-md transform transition-transform ${
                            tempSettings.auto_backup
                              ? "translate-x-6 sm:translate-x-6"
                              : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Data Retention */}
                    <div>
                      <label className="block text-sm font-medium text-[#2d2520] dark:text-[#f5f1eb] mb-2">
                        Data Retention (days)
                      </label>
                      <input
                        type="number"
                        value={tempSettings.data_retention_days || 365}
                        onChange={(e) =>
                          handleSettingChange(
                            "data_retention_days",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-3 sm:px-4 py-2 bg-[#F0E6C5] dark:bg-[#2a2420] border border-[#e3ddd4] dark:border-[#3a342e] rounded-lg text-[#2d2520] dark:text-[#f5f1eb] text-sm sm:text-base"
                        min="30"
                        max="1095"
                      />
                    </div>

                    {/* Max Upload Size */}
                    <div>
                      <label className="block text-sm font-medium text-[#2d2520] dark:text-[#f5f1eb] mb-2">
                        Max Upload Size (MB)
                      </label>
                      <input
                        type="number"
                        value={tempSettings.max_upload_size || 10}
                        onChange={(e) =>
                          handleSettingChange(
                            "max_upload_size",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-3 sm:px-4 py-2 bg-[#F0E6C5] dark:bg-[#2a2420] border border-[#e3ddd4] dark:border-[#3a342e] rounded-lg text-[#2d2520] dark:text-[#f5f1eb] text-sm sm:text-base"
                        min="1"
                        max="100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* User Details Modal - Mobile Optimized */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-[#f5f1eb] dark:bg-[#211c18] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto border border-[#e3ddd4] dark:border-[#3a342e]">
            <div className="p-4 sm:p-6 border-b border-[#e3ddd4] dark:border-[#3a342e] flex justify-between items-center">
              <h3 className="font-serif text-xl sm:text-2xl text-[#2d2520] dark:text-[#f5f1eb]">
                User Details
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-1.5 sm:p-2 hover:bg-[#F0E6C5] dark:hover:bg-[#2a2420] rounded-lg transition-colors"
              >
                <X
                  size={isMobile ? 18 : 20}
                  className="text-[#2d2520] dark:text-[#f5f1eb]"
                />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#6b2d3d] to-[#4a1f2c] rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-serif">
                  {selectedUser.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-lg sm:text-xl font-medium text-[#2d2520] dark:text-[#f5f1eb] truncate">
                    {selectedUser.name}
                  </h4>
                  <p className="text-sm sm:text-base text-[#8b7d6b] dark:text-[#a89a8b] truncate">
                    {selectedUser.email}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs mt-1 sm:mt-2 ${
                      selectedUser.is_active
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {selectedUser.is_active
                      ? "Active Account"
                      : "Inactive Account"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-[#F0E6C5] dark:bg-[#2a2420] rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b] mb-1">
                    Phone
                  </p>
                  <p className="text-sm sm:text-base text-[#2d2520] dark:text-[#f5f1eb] font-medium truncate">
                    {selectedUser.phone || "N/A"}
                  </p>
                </div>
                <div className="bg-[#F0E6C5] dark:bg-[#2a2420] rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b] mb-1">
                    PIN Code
                  </p>
                  <p className="text-sm sm:text-base text-[#2d2520] dark:text-[#f5f1eb] font-medium">
                    {selectedUser.pin || "N/A"}
                  </p>
                </div>
                <div className="bg-[#F0E6C5] dark:bg-[#2a2420] rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b] mb-1">
                    Age
                  </p>
                  <p className="text-sm sm:text-base text-[#2d2520] dark:text-[#f5f1eb] font-medium">
                    {selectedUser.age ? `${selectedUser.age} years` : "N/A"}
                  </p>
                </div>
                <div className="bg-[#F0E6C5] dark:bg-[#2a2420] rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b] mb-1">
                    Gender
                  </p>
                  <p className="text-sm sm:text-base text-[#2d2520] dark:text-[#f5f1eb] font-medium capitalize">
                    {selectedUser.gender || "N/A"}
                  </p>
                </div>
              </div>

              <div className="bg-[#F0E6C5] dark:bg-[#2a2420] rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b] mb-1">
                  Address
                </p>
                <p className="text-sm sm:text-base text-[#2d2520] dark:text-[#f5f1eb] break-words">
                  {selectedUser.address || "N/A"}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="text-center bg-[#F0E6C5] dark:bg-[#2a2420] rounded-lg p-3 sm:p-4">
                  <p className="text-xl sm:text-2xl font-bold text-[#6b2d3d]">
                    {selectedUser.image_searches_count || 0}
                  </p>
                  <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b] mt-1">
                    Image Searches
                  </p>
                </div>
                <div className="text-center bg-[#F0E6C5] dark:bg-[#2a2420] rounded-lg p-3 sm:p-4">
                  <p className="text-xl sm:text-2xl font-bold text-[#6b2d3d]">
                    {selectedUser.manual_searches_count || 0}
                  </p>
                  <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b] mt-1">
                    Manual Searches
                  </p>
                </div>
                <div className="text-center bg-[#F0E6C5] dark:bg-[#2a2420] rounded-lg p-3 sm:p-4">
                  <p className="text-xl sm:text-2xl font-bold text-[#6b2d3d]">
                    {selectedUser.total_searches || 0}
                  </p>
                  <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b] mt-1">
                    Total Searches
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-[#e3ddd4] dark:border-[#3a342e]">
                <div>
                  <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b] mb-1">
                    Joined
                  </p>
                  <p className="text-sm sm:text-base text-[#2d2520] dark:text-[#f5f1eb] font-medium">
                    {selectedUser.created_at
                      ? new Date(selectedUser.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b] mb-1">
                    Last Seen
                  </p>
                  <p className="text-sm sm:text-base text-[#2d2520] dark:text-[#f5f1eb] font-medium">
                    {selectedUser.last_seen
                      ? new Date(selectedUser.last_seen).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-3 sm:pt-4">
                <button
                  onClick={() => {
                    toggleUserStatus(selectedUser.id, selectedUser.is_active);
                    setShowUserModal(false);
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                    selectedUser.is_active
                      ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                      : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                  }`}
                >
                  {selectedUser.is_active ? "Deactivate User" : "Activate User"}
                </button>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-3 bg-[#F0E6C5] dark:bg-[#2a2420] hover:bg-[#e3ddd4] dark:hover:bg-[#3a342e] rounded-lg font-medium transition-colors text-[#2d2520] dark:text-[#f5f1eb] text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Mobile Optimized */}
      {showDeleteConfirm && userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-[#f5f1eb] dark:bg-[#211c18] rounded-xl w-full max-w-md max-h-[90vh] overflow-auto border border-[#e3ddd4] dark:border-[#3a342e]">
            <div className="p-4 sm:p-6 border-b border-[#e3ddd4] dark:border-[#3a342e]">
              <h3 className="font-serif text-xl sm:text-2xl text-[#2d2520] dark:text-[#f5f1eb] flex items-center gap-2">
                <AlertTriangle
                  className="text-red-500"
                  size={isMobile ? 20 : 24}
                />
                Delete User
              </h3>
            </div>

            <div className="p-4 sm:p-6">
              <p className="text-sm sm:text-base text-[#5a4e42] dark:text-[#d4c9bc] mb-4 sm:mb-6">
                Are you sure you want to permanently delete{" "}
                <span className="font-bold text-[#2d2520] dark:text-[#f5f1eb]">
                  {userToDelete.name}
                </span>
                ? This action cannot be undone and will delete all their search
                history and data.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => deleteUser(userToDelete.id)}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors text-sm sm:text-base"
                >
                  Delete Permanently
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setUserToDelete(null);
                  }}
                  className="px-4 py-3 bg-[#F0E6C5] dark:bg-[#2a2420] hover:bg-[#e3ddd4] dark:hover:bg-[#3a342e] rounded-lg font-medium transition-colors text-[#2d2520] dark:text-[#f5f1eb] text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Region Details Modal - Mobile Optimized */}
      {selectedRegion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-[#f5f1eb] dark:bg-[#211c18] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto border border-[#e3ddd4] dark:border-[#3a342e]">
            <div className="p-4 sm:p-6 border-b border-[#e3ddd4] dark:border-[#3a342e] flex justify-between items-center">
              <h3 className="font-serif text-xl sm:text-2xl text-[#2d2520] dark:text-[#f5f1eb] flex items-center gap-2">
                <MapPin className="text-[#6b2d3d]" size={isMobile ? 18 : 20} />
                Region {selectedRegion.region_code}
              </h3>
              <button
                onClick={() => setSelectedRegion(null)}
                className="p-1.5 sm:p-2 hover:bg-[#F0E6C5] dark:hover:bg-[#2a2420] rounded-lg transition-colors"
              >
                <X
                  size={isMobile ? 18 : 20}
                  className="text-[#2d2520] dark:text-[#f5f1eb]"
                />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-[#F0E6C5] dark:bg-[#2a2420] rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b] mb-1">
                    Total Users
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-[#6b2d3d]">
                    {selectedRegion.user_count}
                  </p>
                </div>
                <div className="bg-[#F0E6C5] dark:bg-[#2a2420] rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-[#8b7d6b] dark:text-[#a89a8b] mb-1">
                    Active Users
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-[#6b2d3d]">
                    {selectedRegion.active_users}
                  </p>
                </div>
              </div>

              <h4 className="font-serif text-lg sm:text-xl text-[#2d2520] dark:text-[#f5f1eb] mb-3 sm:mb-4">
                Users in this Region
              </h4>
              <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-96 overflow-y-auto">
                {selectedRegion.users?.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 sm:p-3 bg-[#F0E6C5] dark:bg-[#2a2420] rounded-lg"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-[#6b2d3d] to-[#4a1f2c] rounded-full flex items-center justify-center text-white text-xs sm:text-sm">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base text-[#2d2520] dark:text-[#f5f1eb] truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-[#8b7d6b] dark:text-[#a89a8b] truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right pl-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          user.is_active
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                      <p className="text-xs text-[#8b7d6b] dark:text-[#a89a8b] mt-1">
                        PIN: {user.pin}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 sm:pt-6 border-t border-[#e3ddd4] dark:border-[#3a342e]">
                <button
                  onClick={() => setSelectedRegion(null)}
                  className="px-4 py-2 sm:px-6 sm:py-3 bg-[#F0E6C5] dark:bg-[#2a2420] hover:bg-[#e3ddd4] dark:hover:bg-[#3a342e] rounded-lg font-medium transition-colors text-[#2d2520] dark:text-[#f5f1eb] text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
