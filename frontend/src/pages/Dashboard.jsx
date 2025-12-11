import { useState, useEffect, useRef } from "react";
import {
  uploadImage,
  getDeals,
  getCurrentUser,
  getMySearches,
  saveManualSearch,
  submitFeedback,
} from "../services/api";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import {
  Search,
  Camera,
  Loader2,
  Edit2,
  Check,
  Crown,
  ExternalLink,
  Star,
  Truck,
  ShoppingBag,
  IndianRupee,
  Package,
  X,
  CheckCircle2,
  SlidersHorizontal,
  TrendingDown,
  Percent,
  Clock,
  Upload,
  ChevronDown,
  Zap,
  Sparkles,
  Gift,
  Award,
  Target,
  BarChart3,
  History,
  Heart,
  Shield,
  MessageSquare,
  Send,
  Mail,
  ThumbsUp,
  TrendingUp,
  ShieldCheck,
  Zap as ZapIcon,
  RefreshCw,
  ArrowRight,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

export default function LuxuryDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [comparisonData, setComparisonData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [pincode, setPincode] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    totalProducts: "137+",
    totalSaved: "₹93,740",
    accuracy: "99%",
    availability: "24/7",
    trendingSearches: ["Headphones", "Smartphones", "Laptops", "Watches"],
  });

  // Camera/Image states
  const [cameraStream, setCameraStream] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [identifiedProduct, setIdentifiedProduct] = useState("");
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [searchId, setSearchId] = useState(0);
  const [showProductCard, setShowProductCard] = useState(false);

  // Filter state
  const [sortBy, setSortBy] = useState("price");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Feedback form state
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedback, setFeedback] = useState({
    name: "",
    email: "",
    rating: 0,
    message: "",
    type: "suggestion",
  });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const PLACEHOLDER_IMAGE = "/placeholder-product.jpg";

  // Loading messages
  const loadingMessages = [
    { icon: Search, text: "Scouring the web for best deals..." },
    { icon: TrendingDown, text: "Good things take time, be patient..." },
    { icon: Package, text: "Comparing prices across platforms..." },
    { icon: Clock, text: "Just a moment longer..." },
    { icon: ZapIcon, text: "Finding hidden discounts for you..." },
    { icon: Sparkles, text: "Great deals coming your way..." },
  ];

  // Website logos configuration - Keys matched to normalized backend response keys
  const websiteLogos = {
    amazon: {
      src: "/amazon_logo.jpeg",
      fallbackColor: "from-amber-500 to-orange-600",
      gradient: "bg-gradient-to-r from-amber-500 to-orange-600",
      text: "AMZ",
    },
    flipkart: {
      src: "/flipkart_logo.jpeg",
      fallbackColor: "from-blue-500 to-indigo-600",
      gradient: "bg-gradient-to-r from-blue-500 to-indigo-600",
      text: "FLP",
    },
    snapdeal: {
      src: "/snapdeal_logo.png",
      fallbackColor: "from-red-500 to-pink-600",
      gradient: "bg-gradient-to-r from-red-500 to-pink-600",
      text: "SND",
    },
    ajio: {
      src: "/ajio_logo.jpg",
      gradient: "bg-gradient-to-r from-gray-500 to-black-500",
      text: "JIO",
    },
    croma: {
      src: "/croma_logo.jpg",
      gradient: "bg-gradient-to-r from-teal-500 to-emerald-600",
      text: "CRM",
    },
    reliance: {
      src: "/reliancedigital_logo.jpg",
      gradient: "bg-gradient-to-r from-red-600 to-blue-700",
      text: "RDT",
    },
    reliancedigital: {
      // Fallback key
      src: "/reliancedigital_logo.jpg",
      gradient: "bg-gradient-to-r from-red-600 to-blue-700",
      text: "RDT",
    },
  };

  useEffect(() => {
    if (user) {
      loadUserData();
      loadRecentStats();
    }
  }, [user]);

  // Loading messages rotation
  useEffect(() => {
    let interval;
    if (isLoading) {
      let index = 0;
      setLoadingMessage(loadingMessages[0]);
      interval = setInterval(() => {
        index = (index + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[index]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // API Functions
  const loadUserData = async () => {
    try {
      const response = await getCurrentUser();
      if (response.data?.pin) {
        setPincode(response.data.pin);
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  };

  const loadRecentStats = async () => {
    try {
      const response = await getMySearches();
      const searches = response.data || [];

      if (searches.length > 0) {
        let totalSaved = 0;
        let highestSaving = 0;

        searches.forEach((search) => {
          const prices = [
            search.amazon_price,
            search.flipkart_price,
            search.snapdeal_price,
          ].filter((p) => p && p > 0);

          if (prices.length >= 2) {
            const saving = Math.max(...prices) - Math.min(...prices);
            totalSaved += saving;
            highestSaving = Math.max(highestSaving, saving);
          }
        });

        const recentSearches = searches
          .slice(-4)
          .map((s) => s.query || s.product_name)
          .filter(Boolean);

        setStats((prev) => ({
          ...prev,
          totalProducts: `${searches.length}+`,
          totalSaved: `₹${Math.round(totalSaved).toLocaleString()}`,
          highestSingleSaving: `₹${Math.round(highestSaving).toLocaleString()}`,
          trendingSearches:
            recentSearches.length > 0 ? recentSearches : prev.trendingSearches,
        }));
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      toast.success("Camera ready! Point at a product");
    } catch (error) {
      console.error("Camera access denied:", error);
      toast.error("Unable to access camera");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);

      canvas.toBlob(
        (blob) => {
          const file = new File([blob], "camera-capture.jpg", {
            type: "image/jpeg",
          });
          setImageFile(file);
          stopCamera();
          handleIdentifyProduct(file);
        },
        "image/jpeg",
        0.95
      );
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      handleIdentifyProduct(file);
    }
  };

  const handleIdentifyProduct = async (file) => {
    setIsIdentifying(true);
    setShowProductCard(false);

    try {
      const data = await uploadImage(file);
      setIdentifiedProduct(data.predicted_item);
      setSearchId(data.search_id);
      setIsEditingProduct(false);
      setShowProductCard(true);
      toast.success("Product identified!");
    } catch (error) {
      console.error("Image identification failed:", error);
      toast.error("Failed to identify product");
    }
    setIsIdentifying(false);
  };

  const handleImageSearch = async () => {
    if (!identifiedProduct.trim()) return;

    setIsLoading(true);
    setShowProductCard(false);

    try {
      const deals = await getDeals(identifiedProduct, searchId, pincode);
      setComparisonData(deals);

      setImageFile(null);
      setIdentifiedProduct("");
      setSearchId(0);

      loadRecentStats();
      toast.success("Comparison ready! 🎉");
    } catch (error) {
      console.error("Failed to fetch deals:", error);
      toast.error("Failed to fetch prices");
    }
    setIsLoading(false);
  };

  const handleManualSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a product name");
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Save the intent
      await saveManualSearch(searchQuery);

      // Step 2: Fetch deals
      const deals = await getDeals(searchQuery, 0, pincode);
      setComparisonData(deals);
      loadRecentStats();
      toast.success("Comparison ready! 🎉");
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Failed to fetch prices");
    }
    setIsLoading(false);
  };

  // Helper functions
  const parsePrice = (price) => {
    if (!price) return 0;
    const priceStr = price.toString();
    const numeric = priceStr.replace(/[₹$,]/g, "").trim();
    return parseFloat(numeric) || 0;
  };

  const normalizeDeliveryDate = (deliveryText) => {
    if (!deliveryText) return "Check website";

    const text = String(deliveryText).toLowerCase();

    if (text.includes("today") || text.includes("same day")) return "Today";
    if (text.includes("tomorrow")) return "Tomorrow";
    if (
      text.includes("saturday") ||
      text.includes("sunday") ||
      text.includes("weekend")
    ) {
      return "This weekend";
    }
    if (text.match(/\d+\s*-\s*\d+\s*days/)) {
      const match = text.match(/(\d+)\s*-\s*(\d+)\s*days/);
      if (match) return `${match[1]}-${match[2]} days`;
    }
    if (text.includes("order within")) {
      return "Express delivery";
    }

    return String(deliveryText);
  };

  const extractBrand = (title) => {
    if (!title) return "";
    const titleStr = String(title);
    const brandPatterns = [
      /Brand:\s*([^,]+)/i,
      /by\s+([^,]+)/i,
      /^\s*([A-Z][A-Z\s]+)\s/,
    ];

    for (const pattern of brandPatterns) {
      const match = titleStr.match(pattern);
      if (match) return match[1].trim();
    }

    const words = titleStr.split(" ");
    if (words.length > 0 && words[0].toUpperCase() === words[0]) {
      return words[0];
    }

    return "";
  };

  const cleanTitle = (title) => {
    if (!title) return "Product";
    const titleStr = String(title);
    const brand = extractBrand(titleStr);
    if (brand && titleStr.startsWith(brand)) {
      return titleStr.substring(brand.length).trim();
    }
    return titleStr;
  };

  const checkAvailability = (stockText) => {
    if (!stockText) return true;
    const text = String(stockText).toLowerCase();
    return (
      text.includes("in stock") ||
      text.includes("available") ||
      (!text.includes("out of stock") && !text.includes("unavailable"))
    );
  };

  const getSortedProducts = () => {
    if (!comparisonData) return [];

    const products = [];

    // Dynamically iterate over all keys returned by the backend
    Object.keys(comparisonData).forEach((siteKey) => {
      const siteData = comparisonData[siteKey];

      // Skip if data is null/undefined or has no valid price
      // Also check for specific error flags if backend sends them
      if (
        !siteData ||
        siteData.error ||
        (!siteData.price && siteData.price !== 0)
      ) {
        return;
      }

      // Normalize key for logo lookup (lowercase)
      const normalizedKey = siteKey.toLowerCase();
      const logoConfig = websiteLogos[normalizedKey] || {
        src: null,
        gradient: "bg-gradient-to-r from-gray-500 to-gray-700",
        text: siteKey.substring(0, 3).toUpperCase(),
      };

      // Create display name (capitalize)
      let displayName = siteKey.charAt(0).toUpperCase() + siteKey.slice(1);
      if (normalizedKey === "reliance" || normalizedKey === "reliancedigital") {
        displayName = "Reliance Digital";
      }

      const normalizedData = {
        ...siteData,
        review_count: siteData.review_count || siteData.reviews || 0,
        rating: parseFloat(siteData.rating?.toString()?.split(" ")[0]) || 0,
        discount: siteData.discount || "",
        delivery_date: normalizeDeliveryDate(
          siteData.delivery_date || siteData.delivery_info || "Check website"
        ),
        original_price: parsePrice(siteData.original_price) || 0,
        price: parsePrice(siteData.price) || siteData.price || 0,
        features: Array.isArray(siteData.features)
          ? siteData.features
          : siteData.description
          ? [siteData.description]
          : siteData.features_string
          ? siteData.features_string.split(", ")
          : [],
        brand: extractBrand(siteData.brand || siteData.title || ""),
        seller: siteData.seller || "",
        in_stock: checkAvailability(
          siteData.in_stock || siteData.availability || ""
        ),
        image: siteData.image || siteData.image_url || PLACEHOLDER_IMAGE,
        title: cleanTitle(siteData.title || "Product"),
        delivery_info: siteData.delivery_date || siteData.delivery_info || "",
        stock_info: siteData.in_stock || siteData.availability || "",
        url: siteData.url || "#",
      };

      products.push({
        site: displayName,
        data: normalizedData,
        logo: logoConfig,
      });
    });

    switch (sortBy) {
      case "price":
        return products.sort((a, b) => a.data.price - b.data.price);
      case "discount":
        return products.sort((a, b) => {
          const aDiscount =
            a.data.original_price && a.data.original_price > a.data.price
              ? Math.round(
                  ((a.data.original_price - a.data.price) /
                    a.data.original_price) *
                    100
                )
              : 0;
          const bDiscount =
            b.data.original_price && b.data.original_price > b.data.price
              ? Math.round(
                  ((b.data.original_price - b.data.price) /
                    b.data.original_price) *
                    100
                )
              : 0;
          return bDiscount - aDiscount;
        });
      case "rating":
        return products.sort(
          (a, b) => (b.data.rating || 0) - (a.data.rating || 0)
        );
      case "delivery":
        return products.sort((a, b) => {
          const getPriority = (delivery) => {
            if (!delivery) return 5;
            const d = delivery.toLowerCase();
            if (d.includes("today")) return 0;
            if (d.includes("tomorrow")) return 1;
            if (d.includes("express")) return 2;
            if (d.includes("weekend")) return 3;
            if (d.match(/\d+\s*-\s*\d+\s*days/)) return 4;
            return 5;
          };
          return (
            getPriority(a.data.delivery_date) -
            getPriority(b.data.delivery_date)
          );
        });
      default:
        return products.sort((a, b) => a.data.price - b.data.price);
    }
  };

  const getSavings = () => {
    const products = getSortedProducts();
    if (products.length < 2) return 0;
    const prices = products.map((p) => p.data.price);
    return Math.max(...prices) - Math.min(...prices);
  };

  const getLowestPrice = () => {
    const products = getSortedProducts();
    if (products.length === 0) return 0;
    const prices = products.map((p) => p.data.price).filter((p) => p > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  // Filter options
  const filterOptions = [
    { value: "price", label: "Lowest Price", icon: IndianRupee },
    { value: "rating", label: "Best Rating", icon: Star },
    { value: "delivery", label: "Fastest Delivery", icon: Truck },
  ];

  // Feedback functionality - Implemented with Mailto
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingFeedback(true);

    try {
      // Validate required message
      if (!feedback.message.trim()) {
        toast.error("Please enter a message");
        setIsSubmittingFeedback(false);
        return;
      }

      // Prepare feedback data
      const feedbackData = {
        name: feedback.name.trim() || null,
        email: feedback.email.trim() || null,
        rating: feedback.rating,
        message: feedback.message.trim(),
        type: feedback.type,
      };

      // Submit to backend
      const result = await submitFeedback(feedbackData);

      if (result.success) {
        toast.success("Thank you for your feedback! Email sent successfully.");

        // Reset form
        setFeedback({
          name: "",
          email: "",
          rating: 0,
          message: "",
          type: "suggestion",
        });

        // Close form after delay
        setTimeout(() => {
          setShowFeedbackForm(false);
        }, 1500);
      } else {
        toast.error("Failed to send feedback. Please try again.");
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast.error(
        error.message || "Failed to submit feedback. Please try again."
      );
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[var(--bg-secondary)] via-[var(--bg-primary)] to-[var(--bg-tertiary)]">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--accent-primary)] rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[var(--accent-light)] rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center space-y-6 mb-12">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light text-[var(--text-primary)] tracking-tight">
              Discover The Best
              <span className="block text-[var(--accent-primary)] mt-2">
                Prices
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-[var(--text-secondary)] font-light max-w-2xl mx-auto leading-relaxed">
              Intelligent price comparison that searches across every major
              retailer instantly
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative group">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] group-hover:text-[var(--accent-primary)] transition-colors"
                  size={20}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleManualSearch()}
                  placeholder="Search for any product..."
                  className="w-full pl-12 pr-4 py-4 sm:py-5 rounded-2xl border-2 border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:outline-none transition-all text-base sm:text-lg font-light"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={startCamera}
                  className="flex-1 sm:flex-none px-5 sm:px-6 py-4 sm:py-5 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded-2xl transition-all flex items-center justify-center gap-2 font-light shadow-lg hover:shadow-xl"
                  title="Scan Product"
                >
                  <Camera size={22} />
                  <span className="sm:inline">Scan</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 sm:flex-none px-5 sm:px-6 py-4 sm:py-5 bg-[var(--text-primary)] hover:bg-[var(--text-secondary)] text-[var(--bg-primary)] rounded-2xl transition-all flex items-center justify-center gap-2 font-light shadow-lg hover:shadow-xl"
                  title="Upload Image"
                >
                  <Upload size={22} />
                  <span className="sm:inline">Upload</span>
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              onClick={handleManualSearch}
              disabled={!searchQuery.trim() || isLoading}
              className="w-full py-4 sm:py-5 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl transition-all font-light text-base sm:text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl group"
            >
              {isLoading ? (
                <>
                  <Loader2 size={22} className="animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  Compare Prices
                  <Sparkles
                    size={20}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </>
              )}
            </button>
          </div>

          {/* Trending Searches */}
          <div className="max-w-3xl mx-auto mt-8 text-center">
            <p className="text-sm text-[var(--text-tertiary)] font-light mb-3">
              Trending Searches
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {stats.trendingSearches.map((item) => (
                <button
                  key={item}
                  onClick={() => setSearchQuery(item)}
                  className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-full text-sm font-light border border-[var(--border-color)] transition-all"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Product Identification Card */}
      {showProductCard && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="bg-[var(--bg-secondary)] rounded-2xl border-2 border-green-400 p-6 animate-in slide-in-from-bottom-4">
            <div className="max-w-2xl mx-auto">
              {isIdentifying ? (
                <div className="text-center py-6">
                  <Loader2
                    size={40}
                    className="animate-spin text-green-600 mx-auto mb-3"
                  />
                  <p className="text-lg font-medium text-green-900">
                    Identifying product...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white">
                      <Sparkles size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-green-700 font-medium uppercase tracking-wide mb-1">
                        Product Identified
                      </p>

                      {isEditingProduct ? (
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={identifiedProduct}
                            onChange={(e) =>
                              setIdentifiedProduct(e.target.value)
                            }
                            className="flex-1 px-4 py-2 border-2 border-green-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
                            autoFocus
                          />
                          <button
                            onClick={() => setIsEditingProduct(false)}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition flex items-center gap-2 font-medium"
                          >
                            <Check size={18} />
                            Done
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                            {identifiedProduct}
                          </p>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setIsEditingProduct(true)}
                              className="text-green-700 hover:text-green-800 flex items-center gap-1 text-sm"
                            >
                              <Edit2 size={14} />
                              Edit
                            </button>
                            <span className="text-[var(--text-tertiary)]">
                              •
                            </span>
                            <button
                              onClick={() => {
                                setShowProductCard(false);
                                setIdentifiedProduct("");
                              }}
                              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex items-center gap-1 text-sm"
                            >
                              <X size={14} />
                              Cancel
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleImageSearch}
                      disabled={isLoading}
                      className="flex-1 py-3 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-dark)] hover:from-[var(--accent-hover)] hover:to-[var(--accent-primary)] text-white rounded-xl transition flex items-center justify-center gap-2 font-semibold shadow-md disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search size={20} />
                          Compare Prices
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Camera View */}
      {cameraStream && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="bg-[var(--bg-elevated)] rounded-2xl shadow-lg border border-[var(--border-color)] p-6 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Camera size={24} className="text-[var(--accent-primary)]" />
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                  Capture Product
                </h3>
              </div>
              <button
                onClick={stopCamera}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden max-w-2xl mx-auto shadow-xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-4 border-white/20 rounded-xl pointer-events-none"></div>
              <button
                onClick={captureImage}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center group"
              >
                <div className="w-14 h-14 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-dark)] rounded-full group-hover:from-[var(--accent-hover)] group-hover:to-[var(--accent-primary)] transition-all"></div>
              </button>
            </div>
            <p className="text-center text-[var(--text-secondary)] mt-4 text-sm">
              Point camera at product and tap to capture
            </p>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !showProductCard && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="bg-[var(--bg-secondary)] rounded-3xl p-12 sm:p-16 text-center border border-[var(--border-color)] relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-1/4 w-64 h-64 bg-[var(--accent-primary)] rounded-full blur-3xl animate-ping"></div>
              <div
                className="absolute bottom-0 right-1/4 w-64 h-64 bg-[var(--accent-light)] rounded-full blur-3xl animate-ping"
                style={{ animationDelay: "1s" }}
              ></div>
            </div>

            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-light)] rounded-full animate-spin opacity-20"></div>
              <div className="absolute inset-2 bg-[var(--bg-primary)] rounded-full flex items-center justify-center">
                {loadingMessage?.icon && (
                  <loadingMessage.icon
                    size={32}
                    className="animate-pulse text-[var(--accent-primary)]"
                  />
                )}
              </div>
            </div>
            <p className="text-xl font-light text-[var(--text-primary)] mb-2 animate-pulse">
              {loadingMessage?.text || "Finding the best prices"}
            </p>
            <p className="text-[var(--text-secondary)] font-light">
              This will only take a moment...
            </p>

            <div className="flex justify-center mt-8 space-x-2">
              {[1, 2, 3].map((dot) => (
                <div
                  key={dot}
                  className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce"
                  style={{ animationDelay: `${dot * 0.2}s` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {!isLoading && comparisonData && getSortedProducts().length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-8">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-[var(--border-color)]">
            <div>
              <h2 className="text-3xl sm:text-4xl font-light text-[var(--text-primary)] mb-2">
                Comparison Results
              </h2>
              <p className="text-[var(--text-secondary)] font-light">
                Found{" "}
                <span className="text-[var(--accent-primary)] font-normal">
                  {getSortedProducts().length}
                </span>{" "}
                retailers
              </p>
            </div>

            {getSavings() > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-6 py-4 rounded-2xl border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-700 font-light mb-1">
                  Potential Savings
                </p>
                <p className="text-2xl font-normal text-green-800 dark:text-green-700 flex items-baseline">
                  <IndianRupee size={18} className="mr-1" />
                  {getSavings().toLocaleString("en-IN")}
                </p>
              </div>
            )}
          </div>

          {/* Sort Filter */}
          <div className="flex justify-end">
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="flex items-center gap-2 px-5 py-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl transition-all font-light"
              >
                <SlidersHorizontal size={18} />
                Sort By
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    showFilterMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showFilterMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowFilterMenu(false)}
                  ></div>
                  <div className="absolute right-0 top-full mt-2 bg-[var(--bg-elevated)] rounded-xl shadow-2xl border border-[var(--border-color)] py-2 w-56 z-50">
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowFilterMenu(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-[var(--bg-secondary)] transition flex items-center gap-3 font-light ${
                          sortBy === option.value
                            ? "bg-[var(--bg-secondary)] text-[var(--accent-primary)]"
                            : "text-[var(--text-primary)]"
                        }`}
                      >
                        <option.icon size={16} />
                        {option.label}
                        {sortBy === option.value && (
                          <Check size={14} className="ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Product Table */}
          <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-lg">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] text-sm font-semibold text-[var(--text-primary)]">
              <div className="col-span-2 flex items-center gap-2">
                <ShoppingBag size={16} />
                Platform
              </div>
              <div className="col-span-4">Product Details</div>
              <div className="col-span-1 text-center">Rating</div>
              <div className="col-span-2 text-center">Price</div>
              <div className="col-span-2 text-center">Delivery</div>
              <div className="col-span-1 text-center">Actions</div>
            </div>

            <div className="divide-y divide-[var(--border-color)]">
              {getSortedProducts().map((product, index) => {
                const { site, data, logo } = product;
                const isLowest = sortBy === "price" && index === 0;
                const discountPercent =
                  data.original_price && data.original_price > data.price
                    ? Math.round(
                        ((data.original_price - data.price) /
                          data.original_price) *
                          100
                      )
                    : 0;

                return (
                  <div
                    key={site}
                    className={`grid grid-cols-12 gap-4 px-6 py-5 items-center transition-all hover:bg-[var(--bg-secondary)] ${
                      isLowest
                        ? "bg-gradient-to-r from-[var(--accent-primary)]/5 to-[var(--accent-light)]/5"
                        : ""
                    }`}
                  >
                    <div className="col-span-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-lg shadow-sm border border-[var(--border-color)] bg-white p-2 flex items-center justify-center ${
                            isLowest
                              ? "ring-2 ring-[var(--accent-primary)]"
                              : ""
                          }`}
                        >
                          {logo?.src ? (
                            <img
                              src={logo.src}
                              alt={site}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.style.display = "none";
                                const fallback = e.target.nextElementSibling;
                                if (fallback) fallback.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full ${
                              logo?.gradient ||
                              "bg-gradient-to-r from-gray-500 to-gray-700"
                            } rounded-lg hidden items-center justify-center`}
                            style={{ display: logo?.src ? "none" : "flex" }}
                          >
                            <span className="text-sm font-bold text-white">
                              {logo?.text || site.substring(0, 2)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--text-primary)]">
                            {site}
                          </div>
                          {isLowest && (
                            <div className="flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-1 rounded-full mt-1">
                              <Crown size={10} />
                              Best Price
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-4">
                      <div className="flex gap-3">
                        {data.image && data.image !== PLACEHOLDER_IMAGE && (
                          <img
                            src={data.image}
                            alt={data.title}
                            className="w-16 h-16 object-cover rounded-lg border border-[var(--border-color)] flex-shrink-0"
                            onError={(e) => {
                              e.target.src = PLACEHOLDER_IMAGE;
                            }}
                          />
                        )}
                        <div className="min-w-0">
                          <h4 className="font-medium text-[var(--text-primary)] text-sm line-clamp-2 mb-1">
                            {data.title || "Product Title"}
                          </h4>
                          {data.brand && (
                            <p className="text-xs text-[var(--text-tertiary)] mb-2">
                              Brand:{" "}
                              <span className="font-medium">{data.brand}</span>
                            </p>
                          )}
                          {data.features && data.features.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {data.features.slice(0, 2).map((feature, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-[var(--bg-secondary)] text-[var(--text-tertiary)] px-2 py-1 rounded"
                                >
                                  {feature}
                                </span>
                              ))}
                              {data.features.length > 2 && (
                                <span className="text-xs text-[var(--text-tertiary)] px-2 py-1">
                                  +{data.features.length - 2} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1">
                      <div className="flex flex-col items-center">
                        {data.rating ? (
                          <>
                            <div className="flex items-center gap-1">
                              <Star
                                size={14}
                                className="fill-amber-400 text-amber-400"
                              />
                              <span className="font-semibold text-[var(--text-primary)]">
                                {data.rating}
                              </span>
                            </div>
                            {data.review_count && (
                              <span className="text-xs text-[var(--text-tertiary)] mt-1">
                                (
                                {data.review_count > 1000
                                  ? `${(data.review_count / 1000).toFixed(1)}k`
                                  : data.review_count}
                                )
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-[var(--text-tertiary)]">
                            -
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1">
                          <IndianRupee
                            size={16}
                            className="text-[var(--text-primary)]"
                          />
                          <span className="text-xl font-bold text-[var(--text-primary)]">
                            {data.price?.toLocaleString("en-IN") || "-"}
                          </span>
                        </div>

                        {discountPercent > 0 && (
                          <>
                            <div className="text-sm text-[var(--text-tertiary)] line-through mt-1">
                              ₹{data.original_price.toLocaleString("en-IN")}
                            </div>
                            <div className="text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full mt-1">
                              {discountPercent}% OFF
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <div className="flex flex-col items-center gap-2">
                        {data.delivery_date ? (
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 text-sm mb-2">
                              <Truck
                                size={14}
                                className={
                                  data.delivery_date === "Today"
                                    ? "text-green-600"
                                    : data.delivery_date === "Tomorrow"
                                    ? "text-blue-600"
                                    : data.delivery_date.includes("Express")
                                    ? "text-purple-600"
                                    : "text-[var(--text-tertiary)]"
                                }
                              />
                              <span
                                className={`font-medium ${
                                  data.delivery_date === "Today"
                                    ? "text-green-700"
                                    : data.delivery_date === "Tomorrow"
                                    ? "text-blue-700"
                                    : data.delivery_date.includes("Express")
                                    ? "text-purple-700"
                                    : "text-[var(--text-primary)]"
                                }`}
                              >
                                {data.delivery_date}
                              </span>
                            </div>

                            <div
                              className={`text-xs px-3 py-1 rounded-full ${
                                data.in_stock
                                  ? data.delivery_date === "Today"
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                                    : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                                  : "bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-900 border border-red-200 dark:border-red-800"
                              }`}
                            >
                              {data.stock_info ||
                                (data.in_stock ? "In Stock" : "Out of Stock")}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 text-sm mb-2">
                              <Truck
                                size={14}
                                className="text-[var(--text-tertiary)]"
                              />
                              <span className="text-[var(--text-tertiary)]">
                                Check website
                              </span>
                            </div>
                            <div className="text-xs bg-[var(--bg-secondary)] text-[var(--text-tertiary)] px-3 py-1 rounded-full">
                              Stock info not available
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-span-1">
                      <div className="flex flex-col gap-2">
                        <a
                          href={data.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-4 py-2 rounded-lg transition text-sm font-medium flex items-center justify-center gap-1 shadow-sm hover:shadow ${
                            isLowest
                              ? "bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-light)] hover:from-[var(--accent-hover)] hover:to-[var(--accent-primary)] text-white"
                              : "bg-[var(--text-primary)] hover:bg-[var(--text-secondary)] text-[var(--bg-primary)]"
                          }`}
                        >
                          <ShoppingBag size={14} />
                          Buy
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-2xl border border-amber-200 dark:border-amber-800">
              <IndianRupee
                size={24}
                className="text-amber-600 dark:text-amber-400 mb-3"
              />
              <p className="text-sm text-amber-900 dark:text-amber-700 font-light mb-1">
                Lowest Price
              </p>
              <p className="text-3xl font-light text-amber-700 dark:text-amber-700">
                ₹{getLowestPrice().toLocaleString("en-IN")}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800">
              <BarChart3
                size={24}
                className="text-blue-600 dark:text-blue-400 mb-3"
              />
              <p className="text-sm text-blue-700 dark:text-blue-700 font-light mb-1">
                Platforms
              </p>
              <p className="text-3xl font-light text-blue-700 dark:text-blue-700">
                {getSortedProducts().length}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-800">
              <TrendingDown
                size={24}
                className="text-green-600 dark:text-green-400 mb-3"
              />
              <p className="text-sm text-green-700 dark:text-green-700 font-light mb-1">
                Savings
              </p>
              <p className="text-3xl font-light text-green-700 dark:text-green-700">
                ₹{getSavings().toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Feedback CTA */}
          {!showFeedbackForm && (
            <div
              onClick={() => setShowFeedbackForm(true)}
              className="bg-gradient-to-r from-[var(--bg-secondary)] to-[var(--bg-tertiary)] rounded-3xl p-8 sm:p-12 cursor-pointer hover:shadow-lg transition-all border border-[var(--border-color)] group"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-light)] rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Heart size={28} className="text-white" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-light text-[var(--text-primary)]">
                  Share Your Experience
                </h3>
                <p className="text-[var(--text-secondary)] font-light max-w-xl mx-auto">
                  Your feedback helps us improve
                </p>
              </div>
            </div>
          )}

          {/* Feedback Form */}
          {showFeedbackForm && (
            <div className="bg-[var(--bg-elevated)] rounded-3xl shadow-xl border border-[var(--border-color)] overflow-hidden animate-in slide-in-from-bottom-4">
              <div className="relative bg-gradient-to-r from-[var(--accent-primary)]/10 to-[var(--accent-light)]/10 px-8 py-10 border-b border-[var(--border-color)]">
                <button
                  onClick={() => {
                    setShowFeedbackForm(false);
                    setFeedback({
                      name: "",
                      email: "",
                      rating: 0,
                      message: "",
                      type: "suggestion",
                    });
                  }}
                  className="absolute top-6 right-6 p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-full transition-colors"
                >
                  <X size={20} className="text-[var(--text-tertiary)]" />
                </button>

                <div className="max-w-2xl mx-auto text-center space-y-2">
                  <h3 className="text-3xl font-light text-[var(--text-primary)]">
                    We Value Your Feedback
                  </h3>
                  <p className="text-[var(--text-secondary)] font-light">
                    Help us improve Compario
                  </p>
                </div>
              </div>

              <div className="px-8 py-10">
                <form
                  onSubmit={handleFeedbackSubmit}
                  className="max-w-2xl mx-auto space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm text-[var(--text-tertiary)] font-light">
                        Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={feedback.name}
                        onChange={(e) =>
                          setFeedback({ ...feedback, name: e.target.value })
                        }
                        className="w-full px-0 py-3 border-0 border-b-2 border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:outline-none transition-colors bg-transparent text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                        placeholder="Your name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-[var(--text-tertiary)] font-light">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={feedback.email}
                        onChange={(e) =>
                          setFeedback({ ...feedback, email: e.target.value })
                        }
                        className="w-full px-0 py-3 border-0 border-b-2 border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:outline-none transition-colors bg-transparent text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm text-[var(--text-tertiary)] font-light">
                      How was your experience?
                    </label>
                    <div className="flex justify-center gap-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            setFeedback({ ...feedback, rating: star })
                          }
                          className="group p-2 transition-all hover:scale-110"
                        >
                          <Star
                            size={32}
                            className={`transition-all ${
                              star <= feedback.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-[var(--border-color)] group-hover:text-amber-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm text-[var(--text-tertiary)] font-light">
                      Type of feedback
                    </label>
                    <div className="flex flex-wrap justify-center gap-3">
                      {[
                        {
                          value: "suggestion",
                          label: "Suggestion",
                          icon: Sparkles,
                        },
                        { value: "bug", label: "Bug Report", icon: Shield },
                        {
                          value: "compliment",
                          label: "Compliment",
                          icon: Heart,
                        },
                        {
                          value: "feature",
                          label: "Feature Request",
                          icon: Target,
                        },
                      ].map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() =>
                            setFeedback({ ...feedback, type: type.value })
                          }
                          className={`px-5 py-2.5 rounded-full transition-all font-light text-sm flex items-center gap-2 ${
                            feedback.type === type.value
                              ? "bg-[var(--accent-primary)] text-white shadow-lg scale-105"
                              : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                          }`}
                        >
                          <type.icon size={16} />
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm text-[var(--text-tertiary)] font-light">
                      Your message *
                    </label>
                    <textarea
                      value={feedback.message}
                      onChange={(e) =>
                        setFeedback({ ...feedback, message: e.target.value })
                      }
                      className="w-full px-6 py-4 border-2 border-[var(--border-color)] rounded-2xl focus:outline-none focus:border-[var(--accent-primary)] transition-colors min-h-[140px] resize-none text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                      placeholder="Share your thoughts with us..."
                      required
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={
                        !feedback.message.trim() || isSubmittingFeedback
                      }
                      className="w-full py-4 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-dark)] hover:from-[var(--accent-hover)] hover:to-[var(--accent-primary)] text-white rounded-2xl transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      {isSubmittingFeedback ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={20} />
                          Send Feedback
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Results Message */}
      {!isLoading && comparisonData && getSortedProducts().length === 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="bg-[var(--bg-secondary)] rounded-3xl p-12 sm:p-16 text-center border border-[var(--border-color)]">
            <Package
              size={64}
              className="text-[var(--text-tertiary)] mx-auto mb-6"
            />
            <h3 className="text-2xl font-light text-[var(--text-primary)] mb-2">
              No Results Found
            </h3>
            <p className="text-[var(--text-secondary)] font-light mb-6 max-w-md mx-auto">
              We couldn't find prices for this product. Try a different search
              term.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setComparisonData(null);
              }}
              className="px-6 py-3 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-dark)] hover:from-[var(--accent-hover)] hover:to-[var(--accent-primary)] text-white rounded-xl transition-all font-light flex items-center gap-2 mx-auto"
            >
              <Search size={18} />
              Search Again
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInFromBottom4 {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-in {
          animation-duration: 0.3s;
          animation-fill-mode: both;
        }
        .slide-in-from-bottom-4 {
          animation-name: slideInFromBottom4;
        }
      `}</style>
    </div>
  );
}
