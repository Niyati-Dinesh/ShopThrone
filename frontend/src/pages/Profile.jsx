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
      const userResponse = await api.get("/users/me");
      setUserDetails(userResponse.data);

      const historyResponse = await api.get("/users/my-searches");
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

  const getRecentSearches = () => {
    return searchHistory.slice(0, 5);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-stone-600 mx-auto mb-4" />
          <p className="text-stone-600 font-light">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-stone-600 font-light">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-stone-700/10 backdrop-blur-sm px-6 py-3 rounded-full inline-flex items-center gap-3 mb-4 border border-stone-300/30">
            <Sparkles size={18} className="text-stone-600" />
            <span className="text-stone-700 font-light tracking-wider text-sm">MY ACCOUNT</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-stone-800 mb-2">Your Profile</h1>
          <p className="text-stone-600">Manage your account and track your savings</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm sticky top-6">
              <div className="text-center mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-stone-600 to-stone-800 text-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <User size={24} />
                </div>
                <h2 className="font-serif text-stone-800 mb-1 truncate text-sm">{userDetails?.name || "User"}</h2>
                <p className="text-stone-500 text-xs truncate">{userDetails?.email}</p>
              </div>

              <nav className="space-y-1 mb-4">
                {[
                  { id: "profile", icon: User, label: "Profile" },
                  { id: "history", icon: Search, label: "History" },
                  { id: "stats", icon: Crown, label: "Statistics" }
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-300 text-sm flex items-center gap-2 ${
                      activeTab === id
                        ? "bg-stone-800 text-stone-100 shadow-md"
                        : "text-stone-600 hover:bg-stone-50 hover:text-stone-800"
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </nav>

              {/* Quick Stats */}
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <div className="text-center mb-2">
                  <p className="text-lg font-serif text-stone-800">{searchHistory.length}</p>
                  <p className="text-stone-500 text-xs">Total Searches</p>
                </div>
                {getRecentSearches().length > 0 && (
                  <div className="border-t border-stone-200 pt-2">
                    <p className="text-stone-600 text-xs font-medium mb-1">Recent:</p>
                    <div className="space-y-1">
                      {getRecentSearches().map((search, index) => (
                        <div key={index} className="text-xs text-stone-500 truncate" title={search.predicted_product}>
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
            {/* Profile Tab - Improved Vertical Layout */}
            {activeTab === "profile" && userDetails && (
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-stone-100 flex items-center justify-center rounded-xl">
                      <User size={20} className="text-stone-600" />
                    </div>
                    <div>
                      <h2 className="font-serif text-xl text-stone-800">Personal Information</h2>
                      <p className="text-stone-500 text-sm">Your account details</p>
                    </div>
                  </div>
                  <button className="flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:text-stone-800 hover:bg-stone-50 rounded-lg transition-colors">
                    <Edit size={14} />
                    Edit
                  </button>
                </div>

                {/* Vertical Personal Details Layout */}
                <div className="space-y-4">
                  {/* Personal Info Card */}
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                    <h3 className="font-serif text-stone-800 mb-3 flex items-center gap-2">
                      <Users size={16} />
                      Personal Details
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-stone-500 text-xs">Full Name</label>
                        <p className="text-stone-800 font-medium">{userDetails.name || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="text-stone-500 text-xs">Age</label>
                        <p className="text-stone-800 font-medium">{userDetails.age || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="text-stone-500 text-xs">Gender</label>
                        <p className="text-stone-800 font-medium capitalize">{userDetails.gender || "Not specified"}</p>
                      </div>
                      <div>
                        <label className="text-stone-500 text-xs">Member Since</label>
                        <p className="text-stone-800 font-medium">
                          {userDetails.created_at ? formatDate(userDetails.created_at) : "Recent"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info Card */}
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                    <h3 className="font-serif text-stone-800 mb-3 flex items-center gap-2">
                      <Mail size={16} />
                      Contact Information
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-stone-500 text-xs">Email Address</label>
                        <p className="text-stone-800 font-medium">{userDetails.email}</p>
                      </div>
                      <div>
                        <label className="text-stone-500 text-xs">Phone Number</label>
                        <p className="text-stone-800 font-medium">{userDetails.phone || "Not provided"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Address Card */}
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                    <h3 className="font-serif text-stone-800 mb-3 flex items-center gap-2">
                      <MapPin size={16} />
                      Shipping Address
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <label className="text-stone-500 text-xs">Address</label>
                        <p className="text-stone-800 font-medium">{userDetails.address || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="text-stone-500 text-xs">PIN Code</label>
                        <p className="text-stone-800 font-medium">{userDetails.pin || "Not provided"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Account Status Card */}
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                    <h3 className="font-serif text-stone-800 mb-3 flex items-center gap-2">
                      <Calendar size={16} />
                      Account Status
                    </h3>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <label className="text-stone-500 text-xs">Status</label>
                        <p className="text-green-600 font-medium">Active</p>
                      </div>
                      <div>
                        <label className="text-stone-500 text-xs">User ID</label>
                        <p className="text-stone-800 font-medium">{userDetails.id}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search History Tab */}
            {activeTab === "history" && (
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-stone-100 flex items-center justify-center rounded-xl">
                    <Search size={20} className="text-stone-600" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl text-stone-800">Search History</h2>
                    <p className="text-stone-500 text-sm">Your recent product searches</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {searchHistory.map((search) => (
                    <div key={search.id} className="border border-stone-200 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          {search.image_data ? (
                            <img 
                              src={`data:image/jpeg;base64,${search.image_data}`}
                              alt={search.predicted_product}
                              className="w-16 h-16 object-cover rounded-lg border border-stone-200"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-stone-100 rounded-lg border border-stone-200 flex items-center justify-center">
                              <ImageIcon size={20} className="text-stone-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-grow">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-serif text-stone-800 mb-1">{search.predicted_product}</h3>
                              <p className="text-stone-500 text-xs">{formatDate(search.created_at)}</p>
                            </div>
                            {getBestPrice(search) && (
                              <div className="bg-green-50 border border-green-200 px-2 py-1 rounded-full">
                                <p className="text-green-700 text-xs font-medium">
                                  Best: ₹{getBestPrice(search).toLocaleString("en-IN")}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {[
                              { platform: "Amazon", price: search.amazon_price, color: "amber" },
                              { platform: "Flipkart", price: search.flipkart_price, color: "blue" },
                              { platform: "Snapdeal", price: search.snapdeal_price, color: "red" }
                            ].map(({ platform, price, color }) => price && (
                              <div key={platform} className={`bg-${color}-50 p-2 rounded-lg border border-${color}-200`}>
                                <p className={`text-${color}-800 font-medium text-xs mb-1`}>{platform}</p>
                                <p className={`text-${color}-900 text-sm`}>₹{price.toLocaleString("en-IN")}</p>
                              </div>
                            ))}
                          </div>

                          {!search.amazon_price && !search.flipkart_price && !search.snapdeal_price && (
                            <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 text-center">
                              <p className="text-stone-500 text-sm">No prices found for this search</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {searchHistory.length === 0 && (
                    <div className="text-center py-8">
                      <Search size={32} className="text-stone-300 mx-auto mb-3" />
                      <p className="text-stone-500">No search history yet</p>
                      <p className="text-stone-400 text-sm mt-1">Start comparing prices to see your history here</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === "stats" && (
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-stone-100 flex items-center justify-center rounded-xl">
                    <Crown size={20} className="text-stone-600" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl text-stone-800">Your Statistics</h2>
                    <p className="text-stone-500 text-sm">Based on your search data</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-stone-800 to-stone-900 text-stone-100 p-6 rounded-xl">
                    <ShoppingBag size={24} className="mb-3" />
                    <h3 className="font-serif text-lg mb-1">Total Searches</h3>
                    <p className="text-2xl font-light mb-2">{searchHistory.length}</p>
                    <p className="text-stone-300 text-xs">Products compared using AI</p>
                  </div>

                  <div className="bg-gradient-to-br from-amber-600 to-amber-700 text-amber-50 p-6 rounded-xl">
                    <Sparkles size={24} className="mb-3" />
                    <h3 className="font-serif text-lg mb-1">Estimated Savings</h3>
                    <p className="text-2xl font-light mb-2">₹{getMoneySaved().toLocaleString("en-IN")}</p>
                    <p className="text-amber-200 text-xs">Money saved through comparisons</p>
                  </div>
                </div>

                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                  <h3 className="font-serif text-stone-800 mb-3">Recent Activity</h3>
                  <div className="space-y-2">
                    {getRecentSearches().map((search, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-stone-200 last:border-b-0">
                        <div className="flex items-center gap-3">
                          {search.image_data ? (
                            <img 
                              src={`data:image/jpeg;base64,${search.image_data}`}
                              alt={search.predicted_product}
                              className="w-8 h-8 object-cover rounded border border-stone-200"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-stone-200 rounded border border-stone-300 flex items-center justify-center">
                              <ImageIcon size={12} className="text-stone-500" />
                            </div>
                          )}
                          <div>
                            <p className="text-stone-800 text-sm font-medium max-w-[150px] truncate">{search.predicted_product}</p>
                            <p className="text-stone-500 text-xs">{formatDate(search.created_at)}</p>
                          </div>
                        </div>
                        {getBestPrice(search) && (
                          <span className="text-green-600 text-sm font-medium">₹{getBestPrice(search).toLocaleString("en-IN")}</span>
                        )}
                      </div>
                    ))}
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