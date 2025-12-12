import { useAuth } from "../hooks/useAuth";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Search,
  ShoppingBag,
  Loader2,
  Image,
  Clock,
  TrendingUp,
  Target,
  X,
  SortAsc,
  SortDesc,
  ArrowRight,
  Package,
  Zap,
  Cake,
  UserCircle,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import api from "../services/api";

export default function Profile() {
  const { user, token } = useAuth();
  const [userDetails, setUserDetails] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [manualSearches, setManualSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

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

      const historyResponse = await api.get("/users/my-searches");
      const sortedImageSearches = historyResponse.data.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });

      const manualResponse = await api.get("/users/my-manual-searches");
      const filteredManualSearches = manualResponse.data.filter(search => 
        search.amazon_price || search.flipkart_price || search.snapdeal_price ||
        search.croma_price || search.reliance_price || search.ajio_price
      );
      
      const sortedManualSearches = filteredManualSearches.sort((a, b) => {
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

  const getAllSearches = useMemo(() => {
    const allSearches = [...searchHistory, ...manualSearches];
    
    const uniqueSearches = allSearches.filter((search, index, self) => {
      const productName = search.query || search.predicted_product;
      const timestamp = search.created_at;
      
      const duplicateIndex = self.findIndex(s => {
        const sName = s.query || s.predicted_product;
        const sTime = s.created_at;
        const timeDiff = Math.abs(new Date(timestamp) - new Date(sTime));
        
        return sName === productName && 
               timeDiff < 60000 && 
               self.indexOf(s) < index;
      });
      
      return duplicateIndex === -1;
    });
    
    return uniqueSearches.map((search) => ({
      ...search,
      type: search.query ? "manual" : "image",
      product_name: search.query || search.predicted_product,
    }));
  }, [searchHistory, manualSearches]);

  const filteredSearches = useMemo(() => {
    let result = getAllSearches;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(search => 
        search.product_name.toLowerCase().includes(query) ||
        (search.query && search.query.toLowerCase().includes(query)) ||
        (search.predicted_product && search.predicted_product.toLowerCase().includes(query))
      );
    }
    
    if (typeFilter !== "all") {
      result = result.filter(search => search.type === typeFilter);
    }
    
    if (platformFilter !== "all") {
      result = result.filter(search => {
        const platform = platformFilter.toLowerCase();
        return (
          (platform === "amazon" && search.amazon_price) ||
          (platform === "flipkart" && search.flipkart_price) ||
          (platform === "snapdeal" && search.snapdeal_price) ||
          (platform === "croma" && search.croma_price) ||
          (platform === "reliance" && search.reliance_price) ||
          (platform === "ajio" && search.ajio_price)
        );
      });
    }
    
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "date":
          comparison = new Date(b.created_at) - new Date(a.created_at);
          break;
          
        case "savings":
          const savingsA = getSavingsPercentage(a);
          const savingsB = getSavingsPercentage(b);
          comparison = savingsB - savingsA;
          break;
          
        case "price":
          const priceA = getBestPrice(a);
          const priceB = getBestPrice(b);
          if (!priceA && !priceB) comparison = 0;
          else if (!priceA) comparison = 1;
          else if (!priceB) comparison = -1;
          else comparison = priceA - priceB;
          break;
          
        case "name":
          comparison = a.product_name.localeCompare(b.product_name);
          break;
      }
      
      return sortOrder === "desc" ? comparison : -comparison;
    });
    
    return result;
  }, [getAllSearches, searchQuery, sortBy, sortOrder, platformFilter, typeFilter]);

  const getBestPrice = (search) => {
    const prices = [
      search.amazon_price,
      search.flipkart_price,
      search.snapdeal_price,
      search.croma_price,
      search.reliance_price,
      search.ajio_price,
    ].filter(Boolean);
    return prices.length > 0 ? Math.min(...prices) : null;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getMoneySaved = () => {
    return getAllSearches.reduce((total, search) => {
      const prices = [
        search.amazon_price,
        search.flipkart_price,
        search.snapdeal_price,
        search.croma_price,
        search.reliance_price,
        search.ajio_price,
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
    return getAllSearches.slice(0, 3);
  };

  const getTotalSearches = () => {
    return getAllSearches.length;
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
      search.croma_price,
      search.reliance_price,
      search.ajio_price,
    ].filter(Boolean);

    if (prices.length < 2) return 0;

    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    return Math.round(((maxPrice - minPrice) / maxPrice) * 100);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSortBy("date");
    setSortOrder("desc");
    setPlatformFilter("all");
    setTypeFilter("all");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <Loader2
            size={40}
            className="animate-spin text-[var(--accent-primary)] mx-auto mb-4"
          />
          <p className="text-[var(--text-secondary)]">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">
          Please log in to view your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <h1 className="font-serif text-4xl sm:text-5xl text-[var(--text-primary)] mb-3">
            Welcome back, {userDetails?.name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-[var(--text-secondary)] text-base sm:text-lg">
            Your intelligent shopping companion
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-12 border-b border-[var(--border-color)] overflow-x-auto">
          {[
            { id: "overview", label: "Overview" },
            { id: "history", label: "Search History" },
            { id: "profile", label: "Account Details" },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-6 py-3 text-sm font-medium transition-all relative whitespace-nowrap ${
                activeTab === id
                  ? "text-[var(--accent-primary)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {label}
              {activeTab === id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]" />
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fade-in">
            {/* Stats Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-8">
                <ShoppingBag size={32} className="text-[var(--accent-primary)] mb-4" />
                <p className="text-[var(--text-tertiary)] text-sm mb-2">Total Searches</p>
                <p className="font-serif text-4xl text-[var(--text-primary)]">
                  {getTotalSearches()}
                </p>
              </div>

              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-8">
                <Target size={32} className="text-[var(--success)] mb-4" />
                <p className="text-[var(--text-tertiary)] text-sm mb-2">Total Savings</p>
                <p className="font-serif text-4xl text-[var(--success)]">
                  {formatPrice(getMoneySaved())}
                </p>
              </div>

              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-8">
                <Zap size={32} className="text-[var(--warning)] mb-4" />
                <p className="text-[var(--text-tertiary)] text-sm mb-2">AI Scans</p>
                <p className="font-serif text-4xl text-[var(--text-primary)]">
                  {searchHistory.length}
                </p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6 sm:p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-serif text-xl sm:text-2xl text-[var(--text-primary)]">
                  Recent Activity
                </h2>
                <button 
                  onClick={() => setActiveTab("history")}
                  className="flex items-center gap-2 text-[var(--accent-primary)] text-sm hover:text-[var(--accent-hover)]"
                >
                  View All
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="space-y-4">
                {getRecentSearches().map((search, index) => {
                  const isManual = search.type === "manual";
                  const productName = search.product_name;
                  const bestPrice = getBestPrice(search);

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between py-4 border-b border-[var(--border-color)] last:border-0"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center flex-shrink-0">
                          {isManual ? (
                            <Search size={20} className="text-[var(--accent-primary)]" />
                          ) : (
                            <Image size={20} className="text-[var(--text-tertiary)]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[var(--text-primary)] font-medium truncate text-sm sm:text-base">
                            {productName}
                          </p>
                          <p className="text-[var(--text-tertiary)] text-xs sm:text-sm">
                            {formatDate(search.created_at)}
                          </p>
                        </div>
                      </div>
                      {bestPrice && (
                        <p className="text-[var(--success)] font-medium text-sm sm:text-base ml-4 flex-shrink-0">
                          {formatPrice(bestPrice)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="space-y-6 sm:space-y-8 animate-fade-in">
            {/* Filters */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative sm:col-span-2 lg:col-span-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--text-tertiary)] w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--accent-primary)] text-[var(--text-primary)]"
                  />
                </div>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--accent-primary)] text-[var(--text-primary)]"
                >
                  <option value="all">All Types</option>
                  <option value="image">AI Image Scans</option>
                  <option value="manual">Manual Searches</option>
                </select>

                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--accent-primary)] text-[var(--text-primary)]"
                >
                  <option value="all">All Platforms</option>
                  <option value="amazon">Amazon</option>
                  <option value="flipkart">Flipkart</option>
                  <option value="snapdeal">Snapdeal</option>
                  <option value="croma">Croma</option>
                  <option value="reliance">Reliance</option>
                  <option value="ajio">Ajio</option>
                </select>

                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--accent-primary)] text-[var(--text-primary)]"
                  >
                    <option value="date">Date</option>
                    <option value="name">Name</option>
                    <option value="price">Price</option>
                    <option value="savings">Savings</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                    className="px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg hover:border-[var(--accent-primary)] text-[var(--text-primary)]"
                  >
                    {sortOrder === "desc" ? <SortDesc size={20} /> : <SortAsc size={20} />}
                  </button>
                </div>
              </div>

              {(searchQuery || platformFilter !== "all" || typeFilter !== "all") && (
                <button
                  onClick={clearFilters}
                  className="mt-4 flex items-center gap-2 text-[var(--accent-primary)] text-sm hover:text-[var(--accent-hover)]"
                >
                  <X size={14} />
                  Clear filters
                </button>
              )}
            </div>

            {/* Search Results */}
            {filteredSearches.length > 0 ? (
              <div className="space-y-6">
                {filteredSearches.map((search, index) => {
                  const isManual = search.type === "manual";
                  const productName = search.product_name;
                  const savingsPercentage = getSavingsPercentage(search);
                  const bestPrice = getBestPrice(search);

                  return (
                    <div
                      key={`${search.type}-${search.id}`}
                      className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4 sm:p-6 hover:border-[var(--accent-primary)] transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {!isManual && search.image_data ? (
                          <img
                            src={`data:image/jpeg;base64,${search.image_data}`}
                            alt={productName}
                            className="w-full sm:w-24 h-48 sm:h-24 object-cover rounded-lg border border-[var(--border-color)]"
                          />
                        ) : (
                          <div className="w-full sm:w-24 h-48 sm:h-24 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)] flex items-center justify-center">
                            {isManual ? (
                              <Search size={32} className="text-[var(--accent-primary)]" />
                            ) : (
                              <Image size={32} className="text-[var(--text-tertiary)]" />
                            )}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-serif text-lg sm:text-xl text-[var(--text-primary)] mb-2 break-words">
                                {productName}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-tertiary)]">
                                <span className="flex items-center gap-1">
                                  <Clock size={14} />
                                  {formatDate(search.created_at)}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs ${
                                  isManual 
                                    ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                                    : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                                }`}>
                                  {isManual ? "Manual" : "AI Scan"}
                                </span>
                                {savingsPercentage > 0 && (
                                  <span className="text-[var(--success)] font-medium">
                                    Save {savingsPercentage}%
                                  </span>
                                )}
                              </div>
                            </div>
                            {bestPrice && (
                              <div className="text-left sm:text-right">
                                <p className="text-[var(--text-tertiary)] text-xs mb-1">Best Price</p>
                                <p className="font-serif text-xl sm:text-2xl text-[var(--success)]">
                                  {formatPrice(bestPrice)}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {[
                              { platform: "Amazon", price: search.amazon_price },
                              { platform: "Flipkart", price: search.flipkart_price },
                              { platform: "Snapdeal", price: search.snapdeal_price },
                              { platform: "Croma", price: search.croma_price },
                              { platform: "Reliance", price: search.reliance_price },
                              { platform: "Ajio", price: search.ajio_price },
                            ].map(({ platform, price }) =>
                              price ? (
                                <div
                                  key={platform}
                                  className="bg-[var(--bg-primary)] border border-[var(--border-color)] p-3 rounded-lg"
                                >
                                  <p className="text-[var(--text-tertiary)] text-xs mb-1 truncate">
                                    {platform}
                                  </p>
                                  <p className="text-[var(--text-primary)] font-medium text-sm">
                                    {formatPrice(price)}
                                  </p>
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
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-16 text-center">
                <Package size={48} className="text-[var(--text-tertiary)] mx-auto mb-4 opacity-50" />
                <h3 className="font-serif text-xl text-[var(--text-secondary)] mb-2">
                  No Searches Found
                </h3>
                <p className="text-[var(--text-tertiary)]">
                  {searchQuery ? "Try adjusting your filters" : "Start comparing prices to build your history"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && userDetails && (
          <div className="animate-fade-in">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-dark)] rounded-full flex items-center justify-center text-white text-3xl font-serif flex-shrink-0">
                  {userDetails?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1">
                  <h2 className="font-serif text-2xl text-[var(--text-primary)] mb-1">
                    {userDetails?.name || "User"}
                  </h2>
                  <p className="text-[var(--text-tertiary)] mb-4">
                    Member since {formatDate(userDetails?.created_at || new Date())}
                  </p>
                  
                  {/* Quick Info Icons */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {userDetails?.age && (
                      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <Cake size={16} className="text-[var(--accent-primary)]" />
                        <span>{userDetails.age} years</span>
                      </div>
                    )}
                    {userDetails?.gender && (
                      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <UserCircle size={16} className="text-[var(--accent-primary)]" />
                        <span>{userDetails.gender}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-4 p-4 bg-[var(--bg-primary)] rounded-lg">
                  <Mail size={20} className="text-[var(--accent-primary)] mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[var(--text-tertiary)] text-sm mb-1">Email</p>
                    <p className="text-[var(--text-primary)] break-words">{userDetails?.email}</p>
                  </div>
                </div>

                {userDetails?.phone && (
                  <div className="flex items-start gap-4 p-4 bg-[var(--bg-primary)] rounded-lg">
                    <Phone size={20} className="text-[var(--accent-primary)] mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[var(--text-tertiary)] text-sm mb-1">Phone</p>
                      <p className="text-[var(--text-primary)]">{userDetails.phone}</p>
                    </div>
                  </div>
                )}

                {userDetails?.address && (
                  <div className="flex items-start gap-4 p-4 bg-[var(--bg-primary)] rounded-lg sm:col-span-2">
                    <MapPin size={20} className="text-[var(--accent-primary)] mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[var(--text-tertiary)] text-sm mb-1">Address</p>
                      <p className="text-[var(--text-primary)]">{userDetails.address}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4 p-4 bg-[var(--bg-primary)] rounded-lg">
                  <Calendar size={20} className="text-[var(--accent-primary)] mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[var(--text-tertiary)] text-sm mb-1">Joined</p>
                    <p className="text-[var(--text-primary)]">
                      {formatDate(userDetails?.created_at || new Date())}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}