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
} from "lucide-react";
import { useState, useEffect } from "react";
import api from "../services/api";

export default function Profile() {
  const { user, token } = useAuth();
  const [userDetails, setUserDetails] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
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

      // Fetch user details from your backend
      const userResponse = await api.get("/users/me");
      setUserDetails(userResponse.data);

      // Fetch user's search history
      const historyResponse = await api.get("/users/my-searches");
      
      // Sort searches by date - most recent first
      const sortedHistory = historyResponse.data.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      setSearchHistory(sortedHistory);
    } catch (error) {
      console.error("Error fetching profile data:", error);
      setUserDetails(null);
      setSearchHistory([]);
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
    return searchHistory.reduce((total, search) => {
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

  // Get recent searches (first 5 for quick stats)
  const getRecentSearches = () => {
    return searchHistory.slice(0, 5);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2
            size={32}
            className="animate-spin text-stone-600 mx-auto mb-4"
          />
          <p className="text-stone-600 font-light">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-stone-600 font-light">
          Please log in to view your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="bg-stone-700/10 backdrop-blur-sm px-6 py-3 rounded-full inline-flex items-center gap-3 mb-8 border border-stone-300/30">
            <Sparkles size={20} className="text-stone-600" />
            <span className="text-stone-700 font-light tracking-wider text-sm">
              MY ACCOUNT
            </span>
          </div>

          <h1 className="font-serif text-5xl md:text-6xl text-stone-800 mb-6">
            Your Profile
          </h1>
          <p className="text-stone-600 text-xl font-light max-w-2xl mx-auto">
            Manage your account details and view your search history
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm sticky top-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-stone-600 to-stone-800 text-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <User size={32} />
                </div>
                <h2 className="font-serif text-xl text-stone-800 mb-1">
                  {userDetails?.name || "User"}
                </h2>
                <p className="text-stone-500 text-sm font-light">
                  {userDetails?.email}
                </p>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === "profile"
                      ? "bg-stone-800 text-stone-100 shadow-lg"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-800"
                  }`}
                >
                  <User size={18} className="inline mr-3" />
                  Profile Details
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === "history"
                      ? "bg-stone-800 text-stone-100 shadow-lg"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-800"
                  }`}
                >
                  <Search size={18} className="inline mr-3" />
                  Search History
                </button>
                <button
                  onClick={() => setActiveTab("stats")}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === "stats"
                      ? "bg-stone-800 text-stone-100 shadow-lg"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-800"
                  }`}
                >
                  <Crown size={18} className="inline mr-3" />
                  Statistics
                </button>
              </nav>

              {/* Quick Stats */}
              <div className="mt-8 p-4 bg-stone-50 rounded-xl border border-stone-200">
                <div className="text-center mb-4">
                  <p className="text-2xl font-serif text-stone-800 mb-1">
                    {searchHistory.length}
                  </p>
                  <p className="text-stone-500 text-sm font-light">
                    Total Searches
                  </p>
                </div>
                
                {/* Recent Searches Preview */}
                {getRecentSearches().length > 0 && (
                  <div className="border-t border-stone-200 pt-4">
                    <p className="text-stone-600 text-sm font-medium mb-2">
                      Recent Searches:
                    </p>
                    <div className="space-y-2">
                      {getRecentSearches().map((search, index) => (
                        <div key={index} className="text-xs text-stone-500 truncate">
                          {search.predicted_product}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Details Tab */}
            {activeTab === "profile" && userDetails && (
              <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-stone-100 flex items-center justify-center rounded-2xl mr-4">
                    <User size={24} className="text-stone-600" />
                  </div>
                  <div>
                    <h2 className="font-serif text-3xl text-stone-800">
                      Personal Information
                    </h2>
                    <p className="text-stone-500 font-light">
                      Your account details from database
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
                      <Mail size={20} className="text-stone-500 mb-3" />
                      <h3 className="font-serif text-lg text-stone-800 mb-2">
                        Email Address
                      </h3>
                      <p className="text-stone-600">{userDetails.email}</p>
                    </div>

                    <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
                      <Users size={20} className="text-stone-500 mb-3" />
                      <h3 className="font-serif text-lg text-stone-800 mb-2">
                        Personal Details
                      </h3>
                      <div className="space-y-2 text-stone-600">
                        <p>
                          <strong>Name:</strong>{" "}
                          {userDetails.name || "Not provided"}
                        </p>
                        <p>
                          <strong>Age:</strong>{" "}
                          {userDetails.age || "Not provided"}
                        </p>
                        <p>
                          <strong>Gender:</strong>{" "}
                          {userDetails.gender || "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
                      <Phone size={20} className="text-stone-500 mb-3" />
                      <h3 className="font-serif text-lg text-stone-800 mb-2">
                        Contact Information
                      </h3>
                      <p className="text-stone-600">
                        {userDetails.phone || "Not provided"}
                      </p>
                    </div>

                    <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
                      <MapPin size={20} className="text-stone-500 mb-3" />
                      <h3 className="font-serif text-lg text-stone-800 mb-2">
                        Shipping Address
                      </h3>
                      <div className="space-y-2 text-stone-600">
                        <p>{userDetails.address || "Not provided"}</p>
                        <p>
                          <strong>PIN Code:</strong>{" "}
                          {userDetails.pin || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
                      <Calendar size={20} className="text-stone-500 mb-3" />
                      <h3 className="font-serif text-lg text-stone-800 mb-2">
                        Account Information
                      </h3>
                      <div className="space-y-2 text-stone-600">
                        <p>
                          <strong>Member since:</strong>{" "}
                          {userDetails.created_at
                            ? formatDate(userDetails.created_at)
                            : "Recent"}
                        </p>
                        <p>
                          <strong>User ID:</strong> {userDetails.id}
                        </p>
                        <p>
                          <strong>Status:</strong>{" "}
                          <span className="text-green-600">Active</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search History Tab */}
            {activeTab === "history" && (
              <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-stone-100 flex items-center justify-center rounded-2xl mr-4">
                    <Search size={24} className="text-stone-600" />
                  </div>
                  <div>
                    <h2 className="font-serif text-3xl text-stone-800">
                      Search History
                    </h2>
                    <p className="text-stone-500 font-light">
                      Your recent product searches (newest first)
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {searchHistory.map((search) => (
                    <div
                      key={search.id}
                      className="border border-stone-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-serif text-xl text-stone-800 mb-2">
                            {search.predicted_product}
                          </h3>
                          <p className="text-stone-500 text-sm">
                            Search ID: {search.id} •{" "}
                            {formatDate(search.created_at)}
                          </p>
                        </div>
                        {getBestPrice(search) && (
                          <div className="bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                            <p className="text-green-700 text-sm font-medium">
                              Best Price: ₹
                              {getBestPrice(search).toLocaleString("en-IN")}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        {search.amazon_price && (
                          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                            <p className="text-amber-800 font-medium mb-1">
                              Amazon
                            </p>
                            <p className="text-amber-900 text-lg">
                              ₹{search.amazon_price.toLocaleString("en-IN")}
                            </p>
                          </div>
                        )}
                        {search.flipkart_price && (
                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                            <p className="text-blue-800 font-medium mb-1">
                              Flipkart
                            </p>
                            <p className="text-blue-900 text-lg">
                              ₹{search.flipkart_price.toLocaleString("en-IN")}
                            </p>
                          </div>
                        )}
                        {search.snapdeal_price && (
                          <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                            <p className="text-red-800 font-medium mb-1">
                              Snapdeal
                            </p>
                            <p className="text-red-900 text-lg">
                              ₹{search.snapdeal_price.toLocaleString("en-IN")}
                            </p>
                          </div>
                        )}
                      </div>

                      {!search.amazon_price &&
                        !search.flipkart_price &&
                        !search.snapdeal_price && (
                          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-center">
                            <p className="text-stone-500">
                              No prices found for this search
                            </p>
                          </div>
                        )}
                    </div>
                  ))}

                  {searchHistory.length === 0 && (
                    <div className="text-center py-12">
                      <Search
                        size={48}
                        className="text-stone-300 mx-auto mb-4"
                      />
                      <p className="text-stone-500 text-lg">
                        No search history yet
                      </p>
                      <p className="text-stone-400 text-sm mt-2">
                        Start comparing prices to see your history here
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === "stats" && (
              <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-stone-100 flex items-center justify-center rounded-2xl mr-4">
                    <Crown size={24} className="text-stone-600" />
                  </div>
                  <div>
                    <h2 className="font-serif text-3xl text-stone-800">
                      Your Statistics
                    </h2>
                    <p className="text-stone-500 font-light">
                      Based on your actual search data
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-stone-800 to-stone-900 text-stone-100 p-8 rounded-2xl">
                    <ShoppingBag size={32} className="mb-4" />
                    <h3 className="font-serif text-2xl mb-2">Total Searches</h3>
                    <p className="text-4xl font-light mb-4">
                      {searchHistory.length}
                    </p>
                    <p className="text-stone-300 font-light">
                      Products compared using AI
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-amber-600 to-amber-700 text-amber-50 p-8 rounded-2xl">
                    <Sparkles size={32} className="mb-4" />
                    <h3 className="font-serif text-2xl mb-2">
                      Estimated Savings
                    </h3>
                    <p className="text-4xl font-light mb-4">
                      ₹{getMoneySaved().toLocaleString("en-IN")}
                    </p>
                    <p className="text-amber-200 font-light">
                      Money saved through smart comparisons
                    </p>
                  </div>
                </div>

                {/* Recent Activity Section */}
                <div className="mt-8 bg-stone-50 p-6 rounded-xl border border-stone-200">
                  <h3 className="font-serif text-xl text-stone-800 mb-4">
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {getRecentSearches().map((search, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-stone-200 last:border-b-0">
                        <div>
                          <p className="text-stone-800 font-medium">
                            {search.predicted_product}
                          </p>
                          <p className="text-stone-500 text-sm">
                            {formatDate(search.created_at)}
                          </p>
                        </div>
                        {getBestPrice(search) && (
                          <span className="text-green-600 font-medium">
                            ₹{getBestPrice(search).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 bg-stone-50 p-6 rounded-xl border border-stone-200">
                  <div className="flex justify-between items-center py-3">
                    <span className="text-stone-600">Account Created</span>
                    <span className="text-stone-800 font-medium">
                      {userDetails?.created_at
                        ? formatDate(userDetails.created_at)
                        : "Unknown"}
                    </span>
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