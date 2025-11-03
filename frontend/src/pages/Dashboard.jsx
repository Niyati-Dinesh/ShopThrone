import { useState, useEffect } from "react";
import { uploadImage, getDeals, getCurrentUser } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import {
  Upload,
  Search,
  Wand2,
  Loader2,
  Camera,
  Edit2,
  Check,
  Crown,
  ExternalLink,
  TrendingDown,
  Package,
  Star,
  Truck,
  ShoppingBag,
  IndianRupee,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [step1Data, setStep1Data] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editedProduct, setEditedProduct] = useState("");
  const [pincode, setPincode] = useState(null);

  // Progress tracking state
  const [scrapingProgress, setScrapingProgress] = useState({
    amazon: "pending",
    flipkart: "pending",
    snapdeal: "pending",
  });

  // Logo configuration with fallbacks
  const logoConfig = {
    Amazon: {
      src: "/amazon_logo.jpeg",
      fallbackBg: "bg-yellow-100",
      fallbackText: "AMZ"
    },
    Flipkart: {
      src: "/flipkart_logo.jpeg",
      fallbackBg: "bg-blue-100",
      fallbackText: "FLP"
    },
    Snapdeal: {
      src: "/snapdeal_logo.png",
      fallbackBg: "bg-red-100",
      fallbackText: "SND"
    }
  };

  useEffect(() => {
    const fetchUserPincode = async () => {
      try {
        const response = await getCurrentUser();
        if (response.data && response.data.pin) {
          setPincode(response.data.pin);
        }
      } catch (error) {
        console.error("Failed to fetch user pincode:", error);
      }
    };

    if (user) {
      fetchUserPincode();
    }
  }, [user]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setStep1Data(null);
      setComparisonData(null);
      setIsEditingProduct(false);
      setScrapingProgress({
        amazon: "pending",
        flipkart: "pending",
        snapdeal: "pending",
      });
    }
  };

  const handleImageUpload = async () => {
    if (!file) {
      toast.error("Please select an image first!");
      return;
    }

    setLoadingStep(1);
    setComparisonData(null);

    try {
      const data = await uploadImage(file);
      setStep1Data(data);
      setEditedProduct(data.predicted_item);
      toast.success(`Product identified: ${data.predicted_item}`);
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail ||
        "Image analysis failed. Please try another image.";
      toast.error(errorMsg);
    }
    setLoadingStep(0);
  };

  const handleGetDeals = async () => {
    if (!step1Data) {
      toast.error("Please upload and analyze an image first.");
      return;
    }

    const productToSearch = isEditingProduct
      ? editedProduct
      : step1Data.predicted_item;

    if (!productToSearch.trim()) {
      toast.error("Product name cannot be empty!");
      return;
    }

    setLoadingStep(2);
    setScrapingProgress({
      amazon: "loading",
      flipkart: "loading",
      snapdeal: "loading",
    });

    try {
      const data = await getDeals(
        productToSearch,
        step1Data.search_id,
        pincode
      );

      // Update progress based on results
      setScrapingProgress({
        amazon: data.amazon ? "success" : "failed",
        flipkart: data.flipkart ? "success" : "failed",
        snapdeal: data.snapdeal ? "success" : "failed",
      });

      setComparisonData(data);
      setIsEditingProduct(false);
      toast.success("Comparison ready!");
    } catch (error) {
      toast.error("Failed to fetch prices.");
      setScrapingProgress({
        amazon: "failed",
        flipkart: "failed",
        snapdeal: "failed",
      });
    }
    setLoadingStep(0);
  };

  const getSortedProducts = () => {
    if (!comparisonData) return [];

    const products = [];

    if (comparisonData.amazon) {
      products.push({
        site: "Amazon",
        data: comparisonData.amazon,
        logo: logoConfig.Amazon
      });
    }
    if (comparisonData.flipkart) {
      products.push({
        site: "Flipkart",
        data: comparisonData.flipkart,
        logo: logoConfig.Flipkart
      });
    }
    if (comparisonData.snapdeal) {
      products.push({
        site: "Snapdeal",
        data: comparisonData.snapdeal,
        logo: logoConfig.Snapdeal
      });
    }

    return products.sort(
      (a, b) => (a.data.price || Infinity) - (b.data.price || Infinity)
    );
  };

  const getLowestPrice = () => {
    const products = getSortedProducts();
    return products.length > 0 ? products[0].data.price : null;
  };

  const getHighestPrice = () => {
    const products = getSortedProducts();
    if (products.length === 0) return null;
    return products[products.length - 1].data.price;
  };

  const getSavings = () => {
    const lowest = getLowestPrice();
    const highest = getHighestPrice();
    if (!lowest || !highest || lowest === highest) return 0;
    return highest - lowest;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50/30 to-amber-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-full mb-4 border border-amber-200">
            <Sparkles size={18} className="text-amber-600" />
            <span className="text-amber-900 font-light tracking-wide text-sm">
              AI-POWERED PRICE COMPARISON
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-amber-900 mb-3">
            Find Your Best Deal
          </h1>
          <p className="text-amber-700 font-light text-lg">
            Upload, identify, and compare prices in seconds
          </p>
        </div>

        {/* Main Upload & Identification Section */}
        <div className="bg-white/80 backdrop-blur-sm border border-amber-200/60 rounded-3xl p-6 shadow-lg">
          <div className="grid md:grid-cols-2 gap-6 items-start">
            {/* Left Column - Image Upload */}
            <div className="space-y-4">
              <label className="relative aspect-video border-2 border-dashed border-amber-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition group overflow-hidden">
                {preview ? (
                  <>
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-contain p-4"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <div className="text-white text-center">
                        <Camera size={32} className="mx-auto mb-2" />
                        <span className="text-sm font-light">Change Image</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-500/20 to-rose-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera size={32} className="text-amber-700" />
                    </div>
                    <span className="text-amber-900 font-medium block mb-1">
                      Upload Product Image
                    </span>
                    <span className="text-sm text-amber-600 font-light">
                      PNG, JPG, WEBP up to 10MB
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*"
                />
              </label>

              {/* File Info */}
              {file && (
                <div className="bg-white border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Camera size={20} className="text-amber-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-amber-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-amber-600">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={handleImageUpload}
                disabled={!file || loadingStep === 1}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-light py-4 px-6 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl text-lg"
              >
                {loadingStep === 1 ? (
                  <>
                    <Loader2 size={22} className="animate-spin mr-2" />
                    Analyzing Image...
                  </>
                ) : (
                  <>
                    <Wand2 size={22} className="mr-2" />
                    Identify Product
                  </>
                )}
              </button>
            </div>

            {/* Right Column - Product Identification & Search */}
            <div className="space-y-4 ">
              {/* Quick Tips */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 ">
                <div className="flex items-start gap-3">
                  <Package
                    className="text-amber-600 mt-1 flex-shrink-0"
                    size={24}
                  />
                  <div>
                    <h3 className="font-medium text-amber-900 mb-1 text-lg">
                      Quick Tips
                    </h3>
                    <p className="text-sm text-amber-700 font-light">
                      Ensure good lighting and the product is clearly visible in
                      the frame
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 ">
                <div className="flex items-start gap-3">
                  <Camera
                    className="text-amber-600 mt-1 flex-shrink-0"
                    size={24}
                  />
                  <div>
                    <h3 className="font-medium text-amber-900 mb-1 text-lg">
                      Photography Tips
                    </h3>
                    <p className="text-sm text-amber-700 font-light">
                      Take photos against a plain, contrasting background to
                      make your product stand out
                    </p>
                  </div>
                </div>
              </div>
              {/* Product Identification Section */}
              {step1Data && (
                <div className="space-y-4 mt-5">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 mt-12">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Check size={24} className="text-amber-700" />
                      </div>
                      <div className="flex-1">
                        {isEditingProduct ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editedProduct}
                              onChange={(e) => setEditedProduct(e.target.value)}
                              className="w-full px-4 py-3 border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-lg"
                              placeholder="Enter product name"
                              autoFocus
                            />
                            <button
                              onClick={() => setIsEditingProduct(false)}
                              className="w-full px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition flex items-center justify-center gap-2 shadow-md"
                            >
                              <Check size={18} />
                              Done Editing
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-amber-700 font-medium uppercase tracking-wide">
                              PRODUCT IDENTIFIED
                            </p>
                            <p className="text-xl md:text-2xl font-serif text-amber-900">
                              {editedProduct}
                            </p>
                            <button
                              onClick={() => setIsEditingProduct(true)}
                              className="px-4 py-2 bg-white border border-amber-300 hover:border-amber-400 text-amber-700 rounded-xl transition flex items-center gap-2 shadow-sm"
                            >
                              <Edit2 size={16} />
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleGetDeals}
                    disabled={loadingStep === 2}
                    className="w-full bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-light py-4 px-6 rounded-xl flex items-center justify-center disabled:opacity-50 transition shadow-lg hover:shadow-xl text-lg"
                  >
                    {loadingStep === 2 ? (
                      <>
                        <Loader2 size={22} className="animate-spin mr-2" />
                        Searching Platforms...
                      </>
                    ) : (
                      <>
                        <Search size={22} className="mr-2" />
                        Compare Prices Now
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Section - Only appears below */}
        {comparisonData && getSortedProducts().length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm border border-amber-200/60 rounded-3xl p-6 md:p-8 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <h2 className="font-serif text-3xl text-amber-900 flex items-center gap-3">
                <Crown size={28} className="text-amber-600" />
                Best Deals Found
              </h2>

              {getSavings() > 0 && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 px-5 py-3 rounded-full shadow-md">
                  <TrendingDown size={20} className="text-green-600" />
                  <span className="text-green-700 font-semibold text-lg">
                    Save up to ₹{getSavings().toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>

            {/* Product Cards */}
            <div className="space-y-4">
              {getSortedProducts().map((product, index) => {
                const { site, data, logo } = product;
                const isLowest = index === 0;

                return (
                  <div
                    key={site}
                    className={`border-2 rounded-2xl p-5 transition-all hover:shadow-lg ${
                      isLowest
                        ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 shadow-md"
                        : "bg-white border-stone-200 hover:border-amber-200"
                    }`}
                  >
                    <div className="grid md:grid-cols-12 gap-5 items-center">
                      {/* Platform Logo & Badge */}
                      <div className="md:col-span-2 flex flex-col items-center gap-2">
                        <div className="w-20 h-20 rounded-xl bg-white p-2 shadow-sm border border-stone-200 flex items-center justify-center relative">
                          <img
                            src={logo.src}
                            alt={site}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallback = e.target.nextSibling;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          {/* Fallback logo */}
                          <div 
                            className={`w-full h-full rounded-lg ${logo.fallbackBg} hidden items-center justify-center`}
                            style={{display: 'none'}}
                          >
                            <span className="text-sm font-bold text-gray-700">
                              {logo.fallbackText}
                            </span>
                          </div>
                        </div>
                        {isLowest && (
                          <div className="flex items-center gap-1 bg-amber-500 text-white px-3 py-1 rounded-full shadow-md">
                            <Crown size={14} />
                            <span className="text-xs font-semibold">
                              Best Price
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Product Image & Details */}
                      <div className="md:col-span-5 flex gap-4">
                        {data.image && (
                          <img
                            src={data.image}
                            alt={data.title}
                            className="w-24 h-24 object-cover rounded-xl border-2 border-stone-200 shadow-sm flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-stone-900 text-base line-clamp-2 mb-2">
                            {data.title || "Product Title"}
                          </h3>

                          {data.brand && (
                            <p className="text-sm text-stone-600 mb-2">
                              <span className="font-semibold">Brand:</span>{" "}
                              {data.brand}
                            </p>
                          )}

                          {(data.rating || data.stars) && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-lg">
                                <Star
                                  size={14}
                                  className="fill-amber-500 text-amber-500"
                                />
                                <span className="text-sm font-semibold text-amber-900">
                                  {data.rating || data.stars}
                                </span>
                              </div>
                              {(data.review_count || data.reviews) && (
                                <span className="text-xs text-stone-500">
                                  (
                                  {data.review_count?.toLocaleString("en-IN") ||
                                    data.reviews}{" "}
                                  reviews)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Price & Discount */}
                      <div className="md:col-span-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-3xl font-bold text-stone-900 flex items-start">
                            <IndianRupee size={20} className="mt-1" />
                            {data.price?.toLocaleString("en-IN")}
                          </div>

                          {data.original_price &&
                            data.original_price > data.price && (
                              <div className="text-sm text-stone-400 line-through">
                                ₹{data.original_price.toLocaleString("en-IN")}
                              </div>
                            )}

                          {data.discount && (
                            <div className="text-sm font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                              {data.discount}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Delivery Info */}
                      <div className="md:col-span-2 text-center">
                        {data.delivery_date ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-center gap-2 text-stone-700">
                              <Truck size={16} className="text-stone-500" />
                              <span className="text-sm font-medium">
                                {data.delivery_date}
                              </span>
                            </div>
                            {data.in_stock !== undefined && (
                              <div
                                className={`text-xs px-3 py-1 rounded-full inline-block ${
                                  data.in_stock
                                    ? "bg-green-100 text-green-700 font-semibold"
                                    : "bg-red-100 text-red-700 font-semibold"
                                }`}
                              >
                                {data.in_stock ? "In Stock" : "Out of Stock"}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-stone-400 text-sm">
                            Check on site
                          </span>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="md:col-span-1">
                        <a
                          href={data.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl transition text-sm font-medium shadow-md hover:shadow-lg ${
                            isLowest
                              ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-amber-700 text-white"
                              : "bg-stone-800 hover:bg-stone-900 text-white"
                          }`}
                        >
                          <ShoppingBag size={16} />
                          View
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Stats */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 shadow-md">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                    <Crown size={20} className="text-white" />
                  </div>
                  <span className="text-sm font-semibold text-amber-900">
                    Lowest Price
                  </span>
                </div>
                <div className="text-3xl font-bold text-amber-700">
                  ₹{getLowestPrice()?.toLocaleString("en-IN")}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl p-5 shadow-md">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <ShoppingBag size={20} className="text-white" />
                  </div>
                  <span className="text-sm font-semibold text-blue-900">
                    Platforms
                  </span>
                </div>
                <div className="text-3xl font-bold text-blue-700">
                  {getSortedProducts().length}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-5 shadow-md">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                    <TrendingDown size={20} className="text-white" />
                  </div>
                  <span className="text-sm font-semibold text-green-900">
                    Savings
                  </span>
                </div>
                <div className="text-3xl font-bold text-green-700">
                  ₹{getSavings().toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Results Message */}
        {comparisonData && getSortedProducts().length === 0 && (
          <div className="bg-white/80 backdrop-blur-sm border border-amber-200/60 rounded-3xl p-12 text-center shadow-lg">
            <div className="text-6xl mb-4">😕</div>
            <p className="text-2xl text-amber-900 font-serif mb-2">
              No products found
            </p>
            <p className="text-amber-700 font-light mb-6">
              Try editing the product name or upload a different image
            </p>
            <button
              onClick={() => setIsEditingProduct(true)}
              className="px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl transition inline-flex items-center gap-2 shadow-lg"
            >
              <Edit2 size={18} />
              Edit Product Name
            </button>
          </div>
        )}
      </div>
      <footer className="border-t border-amber-200 bg-amber-100 mt-40">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <p className="text-amber-700 font-light">
            © 2025 Compario. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}