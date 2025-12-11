import { useAuth } from "../hooks/useAuth";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Search,
  ShoppingBag,
  Crown,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  Edit,
  Clock,
  TrendingUp,
  Award,
  Target,
  Filter,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import api from "../services/api";

export default function Profile() {
  const { user, token } = useAuth();
  const [userDetails, setUserDetails] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [manualSearches, setManualSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (user && token) {
      fetchUserData();
    }
  }, [user, token]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userResponse = await api.get("/users/me");
      setUserDetails(userResponse.data);

      // Fetch image searches
      const historyResponse = await api.get("/users/my-searches");
      const sortedImageSearches = historyResponse.data.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });

      // Fetch manual searches
      const manualResponse = await api.get("/users/my-manual-searches");
      const sortedManualSearches = manualResponse.data.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });

      setSearchHistory(sortedImageSearches);
      setManualSearches(sortedManualSearches);
    } catch (error) {
      console.error("Error fetching profile data:", error);
      setUserDetails(null);
      setSearchHistory([]);
      setManualSearches([]);
    } finally {
      setLoading(false);
    }
  };

  const getBestPrice = (search) => {
    const prices = [
      search.amazon_price,
      search.flipkart_price,
      search.snapdeal_price,
    ].filter(Boolean);
    return prices.length > 0 ? Math.min(...prices) : null;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMoneySaved = () => {
    const allSearches = [...searchHistory, ...manualSearches];
    return allSearches.reduce((total, search) => {
      const prices = [
        search.amazon_price,
        search.flipkart_price,
        search.snapdeal_price,
      ].filter(Boolean);
      if (prices.length > 1) {
        const maxPrice = Math.max(...prices);
        const minPrice = Math.min(...prices);
        return total + (maxPrice - minPrice);
      }
      return total;
    }, 0);
  };

  const getRecentSearches = () => {
    const allSearches = [...searchHistory, ...manualSearches].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    return allSearches.slice(0, 5);
  };

  const getTotalSearches = () => {
    return searchHistory.length + manualSearches.length;
  };

  const getAllSearches = () => {
    const allSearches = [...searchHistory, ...manualSearches].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    return allSearches.map((search) => ({
      ...search,
      type: search.query ? "manual" : "image",
    }));
  };

  const formatPrice = (price) => {
    if (!price) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getSavingsPercentage = (search) => {
    const prices = [
      search.amazon_price,
      search.flipkart_price,
      search.snapdeal_price,
    ].filter(Boolean);

    if (prices.length < 2) return 0;

    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    return Math.round(((maxPrice - minPrice) / maxPrice) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <Loader2
            size={32}
            className="animate-spin text-[var(--accent-primary)] mx-auto mb-4"
          />
          <p className="text-[var(--text-secondary)] font-light">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <p className="text-[var(--text-secondary)] font-light">
          Please log in to view your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-20 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[var(--accent-primary)]/10 to-[var(--accent-primary)]/5 rounded-full border border-[var(--accent-primary)]/20 mb-6">
            <Sparkles size={20} className="text-[var(--accent-primary)]" />
            <span className="text-[var(--accent-primary)] font-medium text-sm tracking-wide">
              PERSONAL PROFILE
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-[var(--text-primary)] mb-3">
            Welcome Back, {userDetails?.name?.split(" ")[0] || "User"}!
          </h1>
          <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
            Track your savings journey and manage your preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-80">
            <div className="sticky top-24 space-y-6">
              {/* User Card */}
              <div className="bg-gradient-to-br from-[var(--bg-secondary)] to-white/50 dark:bg-[var(--bg-elevated)] rounded-2xl p-6 border border-[var(--border-color)] shadow-sm">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-dark)] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg">
                    {userDetails?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <h2 className="font-serif text-xl text-[var(--text-primary)] mb-1">
                    {userDetails?.name || "User"}
                  </h2>
                  <p className="text-[var(--text-tertiary)] text-sm truncate">
                    {userDetails?.email}
                  </p>
                </div>

                {/* Stats */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center dark:p-3 dark:bg-[var(--bg-tertiary)]/50 dark:rounded-lg">
                    <span className="text-[var(--text-secondary)] text-sm">
                      Total Searches
                    </span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {getTotalSearches()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center dark:p-3 dark:bg-[var(--bg-tertiary)]/50 dark:rounded-lg">
                    <span className="text-[var(--text-secondary)] text-sm">
                      Total Savings
                    </span>
                    <span className="font-bold text-[var(--success)]">
                      {formatPrice(getMoneySaved())}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-[var(--border-color)] pt-4 dark:border-0 dark:p-3 dark:bg-[var(--bg-tertiary)]/50 dark:rounded-lg">
                    <span className="text-[var(--text-secondary)] text-sm">
                      Member Since
                    </span>
                    <span className="font-medium text-[var(--text-primary)] text-sm">
                      {userDetails?.created_at
                        ? formatDate(userDetails.created_at)
                        : "Recent"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="bg-gradient-to-br from-[var(--bg-secondary)] to-white/50 dark:bg-[var(--bg-elevated)] rounded-2xl p-6 border border-[var(--border-color)] shadow-sm">
                <h3 className="font-serif text-lg text-[var(--text-primary)] mb-4">
                  Navigation
                </h3>
                <div className="space-y-2">
                  {[
                    {
                      id: "profile",
                      icon: User,
                      label: "Profile",
                      count: null,
                    },
                    {
                      id: "history",
                      icon: Search,
                      label: "Search History",
                      count: getTotalSearches(),
                    },
                    {
                      id: "stats",
                      icon: TrendingUp,
                      label: "Statistics",
                      count: null,
                    },
                  ].map(({ id, icon: Icon, label, count }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                        activeTab === id
                          ? "bg-[var(--accent-primary)] text-white shadow-md"
                          : "text-[var(--text-secondary)] hover:bg-[var(--accent-primary)]/10 hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} />
                        <span className="font-medium">{label}</span>
                      </div>
                      {count !== null && (
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            activeTab === id
                              ? "bg-white/20 text-white"
                              : "bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Profile Tab */}
            {activeTab === "profile" && userDetails && (
              <div className="space-y-6 animate-fade-in">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-[var(--bg-secondary)] to-white/50 dark:bg-[var(--bg-elevated)] rounded-2xl p-8 border border-[var(--border-color)] shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-dark)] rounded-xl flex items-center justify-center">
                        <User size={24} className="text-white" />
                      </div>
                      <div>
                        <h2 className="font-serif text-2xl text-[var(--text-primary)]">
                          Personal Information
                        </h2>
                        <p className="text-[var(--text-secondary)]">
                          Update and manage your profile details
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Personal Details */}
                    <div className="space-y-6">
                      <div className="bg-white/80 dark:bg-[var(--bg-tertiary)] rounded-xl p-6 border border-[var(--border-color)]">
                        <div className="flex items-center gap-3 mb-6">
                          <Users className="w-5 h-5 text-[var(--accent-primary)]" />
                          <h3 className="font-serif text-lg text-[var(--text-primary)]">
                            Personal Details
                          </h3>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-[var(--text-tertiary)] text-sm mb-1 block">
                              Full Name
                            </label>
                            <p className="text-[var(--text-primary)] text-lg font-medium">
                              {userDetails.name || "Not provided"}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[var(--text-tertiary)] text-sm mb-1 block">
                                Age
                              </label>
                              <p className="text-[var(--text-primary)] text-lg font-medium">
                                {userDetails.age || "—"}
                              </p>
                            </div>
                            <div>
                              <label className="text-[var(--text-tertiary)] text-sm mb-1 block">
                                Gender
                              </label>
                              <p className="text-[var(--text-primary)] text-lg font-medium capitalize">
                                {userDetails.gender || "—"}
                              </p>
                            </div>
                          </div>
                          <div>
                            <label className="text-[var(--text-tertiary)] text-sm mb-1 block">
                              Member Since
                            </label>
                            <p className="text-[var(--text-primary)] text-lg font-medium">
                              {userDetails.created_at
                                ? formatDate(userDetails.created_at)
                                : "—"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="bg-white/80 dark:bg-[var(--bg-tertiary)] rounded-xl p-6 border border-[var(--border-color)]">
                        <div className="flex items-center gap-3 mb-6">
                          <Mail className="w-5 h-5 text-[var(--accent-primary)]" />
                          <h3 className="font-serif text-lg text-[var(--text-primary)]">
                            Contact Information
                          </h3>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-[var(--text-tertiary)] text-sm mb-1 block">
                              Email Address
                            </label>
                            <p className="text-[var(--text-primary)] text-lg font-medium">
                              {userDetails.email}
                            </p>
                          </div>
                          <div>
                            <label className="text-[var(--text-tertiary)] text-sm mb-1 block">
                              Phone Number
                            </label>
                            <p className="text-[var(--text-primary)] text-lg font-medium">
                              {userDetails.phone || "Not provided"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Address & Account */}
                    <div className="space-y-6">
                      {/* Shipping Address */}
                      <div className="bg-white/80 dark:bg-[var(--bg-tertiary)] rounded-xl p-6 border border-[var(--border-color)]">
                        <div className="flex items-center gap-3 mb-6">
                          <MapPin className="w-5 h-5 text-[var(--accent-primary)]" />
                          <h3 className="font-serif text-lg text-[var(--text-primary)]">
                            Shipping Address
                          </h3>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-[var(--text-tertiary)] text-sm mb-1 block">
                              Address
                            </label>
                            <p className="text-[var(--text-primary)] text-lg font-medium leading-relaxed">
                              {userDetails.address || "Not provided"}
                            </p>
                          </div>
                          <div>
                            <label className="text-[var(--text-tertiary)] text-sm mb-1 block">
                              PIN Code
                            </label>
                            <p className="text-[var(--text-primary)] text-lg font-medium">
                              {userDetails.pin || "—"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Account Status */}
                      <div className="bg-gradient-to-br from-[var(--accent-primary)]/5 to-[var(--accent-primary)]/10 dark:from-[var(--accent-primary)]/20 dark:to-[var(--accent-dark)]/10 rounded-xl p-6 border border-[var(--accent-primary)]/20 dark:border-[var(--accent-primary)]/30">
                        <div className="flex items-center gap-3 mb-6">
                          <Award className="w-5 h-5 text-[var(--accent-primary)]" />
                          <h3 className="font-serif text-lg text-[var(--text-primary)]">
                            Account Status
                          </h3>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-[var(--text-tertiary)] text-sm mb-1 block">
                              Status
                            </label>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-[var(--success)] rounded-full"></div>
                              <span className="text-[var(--success)] font-semibold">
                                Active
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <label className="text-[var(--text-tertiary)] text-sm mb-1 block">
                              User ID
                            </label>
                            <p className="text-[var(--text-primary)] font-mono font-medium">
                              #{userDetails.id}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div className="space-y-6 animate-fade-in">
                {/* History Header */}
                <div className="bg-gradient-to-r from-[var(--bg-secondary)] to-white/50 dark:bg-[var(--bg-elevated)] rounded-2xl p-8 border border-[var(--border-color)] shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-dark)] rounded-xl flex items-center justify-center">
                        <Search size={24} className="text-white" />
                      </div>
                      <div>
                        <h2 className="font-serif text-2xl text-[var(--text-primary)]">
                          Search History
                        </h2>
                        <p className="text-[var(--text-secondary)]">
                          All your product searches and price comparisons
                        </p>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition-colors border border-[var(--accent-primary)]/30 dark:bg-[var(--bg-tertiary)] dark:text-[var(--text-primary)] dark:hover:bg-[var(--bg-tertiary)]/80 dark:border-[var(--border-color)]">
                      <Filter size={16} />
                      Filter
                    </button>
                  </div>

                  {/* Search List */}
                  {getAllSearches().length > 0 ? (
                    <div className="space-y-4">
                      {getAllSearches().map((search, index) => {
                        const isManual = search.type === "manual";
                        const productName = isManual
                          ? search.query
                          : search.predicted_product;
                        const savingsPercentage = getSavingsPercentage(search);
                        const bestPrice = getBestPrice(search);

                        return (
                          <div
                            key={`${search.type}-${search.id}`}
                            className="bg-white/80 dark:bg-[var(--bg-tertiary)] rounded-xl p-6 border border-[var(--border-color)] hover:border-[var(--accent-primary)]/50 transition-colors group"
                          >
                            <div className="flex gap-4">
                              {/* Left: Icon/Image */}
                              <div className="flex-shrink-0">
                                {!isManual && search.image_data ? (
                                  <img
                                    src={`data:image/jpeg;base64,${search.image_data}`}
                                    alt={productName}
                                    className="w-20 h-20 object-cover rounded-lg border border-[var(--border-color)] group-hover:border-[var(--accent-primary)]/30 transition-colors"
                                  />
                                ) : (
                                  <div
                                    className={`w-20 h-20 rounded-lg border border-[var(--border-color)] flex items-center justify-center ${
                                      isManual
                                        ? "bg-gradient-to-br from-[var(--accent-primary)]/10 to-[var(--accent-primary)]/5 dark:from-[var(--accent-primary)]/20 dark:to-[var(--accent-primary)]/10"
                                        : "bg-gradient-to-br from-[var(--bg-tertiary)] to-white dark:bg-[var(--bg-elevated)]"
                                    } group-hover:border-[var(--accent-primary)]/30 transition-colors`}
                                  >
                                    {isManual ? (
                                      <Search
                                        size={28}
                                        className="text-[var(--accent-primary)]"
                                      />
                                    ) : (
                                      <ImageIcon
                                        size={28}
                                        className="text-[var(--text-tertiary)]"
                                      />
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Middle: Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h3 className="font-serif text-lg text-[var(--text-primary)] truncate">
                                        {productName}
                                      </h3>
                                      <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                                          isManual
                                            ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 dark:bg-gradient-to-r dark:from-[var(--accent-primary)]/20 dark:to-[var(--accent-primary)]/10 dark:border-[var(--accent-primary)]/30"
                                            : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)] dark:bg-[var(--bg-elevated)]"
                                        }`}
                                      >
                                        {isManual
                                          ? "Manual Search"
                                          : "AI Image Scan"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-[var(--text-tertiary)]">
                                      <span className="flex items-center gap-1">
                                        <Clock size={14} />
                                        {formatDate(search.created_at)}
                                      </span>
                                      {savingsPercentage > 0 && (
                                        <span className="text-[var(--success)] font-medium">
                                          Save {savingsPercentage}%
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Best Price */}
                                  {bestPrice && (
                                    <div className="bg-gradient-to-r from-[var(--success)]/10 to-[var(--success)]/5 dark:from-[var(--success)]/20 dark:to-[var(--success)]/10 px-4 py-3 rounded-lg border border-[var(--success)]/20 dark:border-[var(--success)]/30">
                                      <p className="text-[var(--success)] text-xs font-medium mb-1">
                                        Best Price
                                      </p>
                                      <p className="text-xl font-bold text-[var(--text-primary)]">
                                        {formatPrice(bestPrice)}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Price Comparison */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {[
                                    {
                                      platform: "Amazon",
                                      price: search.amazon_price,
                                      color: "amber",
                                    },
                                    {
                                      platform: "Flipkart",
                                      price: search.flipkart_price,
                                      color: "blue",
                                    },
                                    {
                                      platform: "Snapdeal",
                                      price: search.snapdeal_price,
                                      color: "red",
                                    },
                                  ].map(({ platform, price, color }) =>
                                    price ? (
                                      <div
                                        key={platform}
                                        className="bg-white dark:bg-[var(--bg-elevated)] p-4 rounded-lg border border-[var(--border-color)] hover:border-[var(--accent-primary)]/30 transition-colors"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <p className="font-medium text-[var(--text-secondary)] text-sm">
                                            {platform}
                                          </p>
                                          {bestPrice === price && (
                                            <span className="px-2 py-1 text-xs bg-[var(--success)] text-white rounded-full">
                                              Best Deal
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-lg font-bold text-[var(--text-primary)]">
                                          {formatPrice(price)}
                                        </p>
                                        {bestPrice && price !== bestPrice && (
                                          <p className="text-[var(--text-tertiary)] text-sm mt-1">
                                            {formatPrice(price - bestPrice)}{" "}
                                            more
                                          </p>
                                        )}
                                      </div>
                                    ) : null
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Search
                        size={48}
                        className="text-[var(--text-tertiary)]/30 mx-auto mb-4"
                      />
                      <h3 className="text-xl font-serif text-[var(--text-secondary)] mb-2">
                        No Search History
                      </h3>
                      <p className="text-[var(--text-tertiary)]">
                        Start comparing prices to build your search history
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === "stats" && (
              <div className="space-y-6 animate-fade-in">
                {/* Stats Header */}
                <div className="bg-gradient-to-r from-[var(--bg-secondary)] to-white/50 dark:bg-[var(--bg-elevated)] rounded-2xl p-8 border border-[var(--border-color)] shadow-sm">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-dark)] rounded-xl flex items-center justify-center">
                      <TrendingUp size={24} className="text-white" />
                    </div>
                    <div>
                      <h2 className="font-serif text-2xl text-[var(--text-primary)]">
                        Your Statistics
                      </h2>
                      <p className="text-[var(--text-secondary)]">
                        Insights from your price comparison journey
                      </p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-dark)] text-white p-6 rounded-xl shadow-lg border border-[var(--accent-primary)]/30">
                      <ShoppingBag size={28} className="mb-4" />
                      <h3 className="font-serif text-lg mb-2">
                        Total Searches
                      </h3>
                      <p className="text-3xl font-bold mb-1">
                        {getTotalSearches()}
                      </p>
                      <p className="text-white/80 text-sm">Products compared</p>
                    </div>

                    <div className="bg-gradient-to-br from-[var(--success)] to-emerald-700 text-white p-6 rounded-xl shadow-lg border border-[var(--success)]/30">
                      <Target size={28} className="mb-4" />
                      <h3 className="font-serif text-lg mb-2">Total Savings</h3>
                      <p className="text-3xl font-bold mb-1">
                        {formatPrice(getMoneySaved())}
                      </p>
                      <p className="text-white/80 text-sm">Money saved</p>
                    </div>

                    <div className="bg-gradient-to-br from-[var(--accent-light)] to-[var(--accent-primary)] text-white p-6 rounded-xl shadow-lg border border-[var(--accent-primary)]/30">
                      <Sparkles size={28} className="mb-4" />
                      <h3 className="font-serif text-lg mb-2">AI Scans</h3>
                      <p className="text-3xl font-bold mb-1">
                        {searchHistory.length}
                      </p>
                      <p className="text-white/80 text-sm">
                        Image recognitions
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-[var(--warning)] to-amber-700 text-white p-6 rounded-xl shadow-lg border border-[var(--warning)]/30">
                      <Search size={28} className="mb-4" />
                      <h3 className="font-serif text-lg mb-2">
                        Manual Searches
                      </h3>
                      <p className="text-3xl font-bold mb-1">
                        {manualSearches.length}
                      </p>
                      <p className="text-white/80 text-sm">Text searches</p>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white/80 dark:bg-[var(--bg-tertiary)] rounded-xl p-6 border border-[var(--border-color)]">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-serif text-lg text-[var(--text-primary)]">
                        Recent Activity
                      </h3>
                      <button className="text-[var(--accent-primary)] text-sm font-medium hover:text-[var(--accent-hover)]">
                        View All
                      </button>
                    </div>
                    <div className="space-y-3">
                      {getRecentSearches().map((search, index) => {
                        const isManual = "query" in search;
                        const productName = isManual
                          ? search.query
                          : search.predicted_product;
                        const bestPrice = getBestPrice(search);

                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 hover:bg-[var(--bg-tertiary)]/50 dark:hover:bg-[var(--bg-elevated)] rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  isManual
                                    ? "bg-gradient-to-br from-[var(--accent-primary)]/10 to-[var(--accent-primary)]/5 dark:from-[var(--accent-primary)]/20 dark:to-[var(--accent-primary)]/10"
                                    : "bg-gradient-to-br from-[var(--bg-tertiary)] to-white dark:bg-[var(--bg-elevated)]"
                                }`}
                              >
                                {isManual ? (
                                  <Search
                                    size={16}
                                    className="text-[var(--accent-primary)]"
                                  />
                                ) : (
                                  <ImageIcon
                                    size={16}
                                    className="text-[var(--text-tertiary)]"
                                  />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-[var(--text-primary)] text-sm">
                                  {productName}
                                </p>
                                <p className="text-[var(--text-tertiary)] text-xs">
                                  {formatDate(search.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {bestPrice && (
                                <span className="text-[var(--success)] font-medium text-sm">
                                  {formatPrice(bestPrice)}
                                </span>
                              )}
                              <ChevronRight
                                size={16}
                                className="text-[var(--text-tertiary)]"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
