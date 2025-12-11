import {
  ArrowRight,
  Zap,
  Globe,
  Shield,
  Camera,
  TrendingDown,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  const heroImages = [
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=90",
    "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&q=90",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=90",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=90",
  ];

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Real-time price comparison in seconds",
    },
    {
      icon: Globe,
      title: "All Platforms",
      description: "Amazon, Flipkart, Snapdeal and more",
    },
    {
      icon: Shield,
      title: "Verified Prices",
      description: "100% accurate and trusted data",
    },
    {
      icon: Camera,
      title: "Visual Search",
      description: "Upload image or search by name",
    },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-20 flex flex-col">
      <div className="flex-1">
        <section className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-12 animate-fade-in">
              <div className="space-y-8">
                <div>
                  <p className="text-sm font-light text-[var(--accent-primary)] uppercase tracking-widest mb-2">
                    Smart Shopping
                  </p>
                  <h1 className="font-serif text-6xl lg:text-7xl xl:text-8xl text-[var(--text-primary)] leading-[0.95] font-light">
                    Discover
                    <br />
                    The Best
                    <br />
                    <span className="text-[var(--accent-primary)]">Prices</span>
                  </h1>
                </div>

                <p className="text-lg text-[var(--text-secondary)] max-w-md leading-relaxed font-light">
                  Intelligent price comparison that searches across every major
                  retailer instantly. Upload a product photo or search by name
                  to find the lowest prices.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/dashboard" className="group">
                  <button className="w-full sm:w-auto px-8 py-4 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-dark)] transition-all font-light flex items-center justify-center gap-2 text-sm hover:shadow-lg hover:scale-105">
                    Start Shopping
                    <ArrowRight
                      size={18}
                      strokeWidth={1.5}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                </Link>
                <Link to="/about">
                  <button className="w-full sm:w-auto px-8 py-4 border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] rounded-lg hover:bg-[var(--accent-primary)]/5 transition-all font-light text-sm">
                    Learn More
                  </button>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-8 pt-12 border-t border-[var(--border-color)]">
                <div>
                  <div className="font-serif text-4xl lg:text-5xl text-[var(--text-primary)] font-light mb-2">
                    100K+
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)] font-light uppercase tracking-wider">
                    Products Compared
                  </div>
                </div>
                <div>
                  <div className="font-serif text-4xl lg:text-5xl text-[var(--text-primary)] font-light mb-2">
                    99.8%
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)] font-light uppercase tracking-wider">
                    Accuracy
                  </div>
                </div>
                <div>
                  <div className="font-serif text-4xl lg:text-5xl text-[var(--text-primary)] font-light mb-2">
                    ₹5Cr+
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)] font-light uppercase tracking-wider">
                    Saved by Users
                  </div>
                </div>
              </div>
            </div>

            <div className="relative h-[400px] sm:h-[500px] lg:h-[600px] bg-neutral-100 dark:bg-neutral-900 rounded-sm overflow-hidden">
              {heroImages.map((img, idx) => (
                <div
                  key={idx}
                  className="absolute inset-0 transition-opacity duration-1000"
                  style={{
                    opacity: idx === currentSlide ? 1 : 0,
                  }}
                >
                  <img
                    src={img}
                    alt="Product showcase"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}

              {/* Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-12 bg-gradient-to-t from-black/60 to-transparent">
                <div className="text-white">
                  <div className="text-xs sm:text-sm tracking-wider uppercase mb-2 opacity-80">
                    Popular Search
                  </div>
                  <div className="text-xl sm:text-2xl font-serif">
                    Premium Products
                  </div>
                </div>
              </div>

              {/* Slide Indicators */}
              <div className="absolute top-4 right-4 flex gap-1.5">
                {heroImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1 rounded-full transition-all ${
                      idx === currentSlide ? "bg-white w-8" : "bg-white/40 w-1"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[var(--bg-secondary)] py-24 border-t border-[var(--border-color)]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="space-y-16">
              <div className="text-center space-y-4">
                <p className="text-sm font-light text-[var(--accent-primary)] uppercase tracking-widest">
                  Why ShopThrone
                </p>
                <h2 className="font-serif text-5xl lg:text-6xl font-light text-[var(--text-primary)]">
                  Everything You Need
                </h2>
                <p className="text-[var(--text-secondary)] font-light text-lg max-w-2xl mx-auto">
                  Designed for smart shoppers who want the best prices without
                  the hassle
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="group bg-[var(--bg-primary)] p-8 rounded-xl border border-[var(--border-color)] hover:border-[var(--accent-primary)]/50 hover:shadow-xl transition-all cursor-pointer"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-dark)] text-white flex items-center justify-center rounded-lg mb-6 group-hover:shadow-lg group-hover:scale-110 transition-all">
                      <feature.icon size={24} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-light text-[var(--text-primary)] mb-3 font-serif">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-20">
            <p className="text-sm font-light text-[var(--accent-primary)] uppercase tracking-widest mb-4">
              Our Process
            </p>
            <h2 className="font-serif text-5xl lg:text-6xl font-light text-[var(--text-primary)] mb-4">
              How It Works
            </h2>
            <p className="text-[var(--text-secondary)] font-light text-lg">
              Three simple steps to finding the best prices
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent -z-10" />

            {[
              {
                number: "01",
                icon: Camera,
                title: "Upload or Search",
                desc: "Take a photo or enter product name",
              },
              {
                number: "02",
                icon: Globe,
                title: "Compare Prices",
                desc: "View prices across all retailers",
              },
              {
                number: "03",
                icon: TrendingDown,
                title: "Save & Buy",
                desc: "Get the best deal instantly",
              },
            ].map(({ number, icon: Icon, title, desc }) => (
              <div key={number} className="text-center group">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-[var(--accent-primary)]/10 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-dark)] text-white flex items-center justify-center rounded-full mx-auto font-serif text-2xl font-light group-hover:scale-110 transition-transform shadow-lg">
                    {number}
                  </div>
                </div>
                <h3 className="font-serif text-2xl font-light text-[var(--text-primary)] mb-3">
                  {title}
                </h3>
                <p className="text-[var(--text-secondary)] font-light leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-br from-[var(--accent-primary)] via-[var(--accent-light)] to-[var(--accent-dark)] py-24 my-12 rounded-2xl">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
            <h2 className="font-serif text-5xl lg:text-6xl font-light text-white">
              Start Saving Today
            </h2>
            <p className="text-lg font-light text-white/90 max-w-2xl mx-auto">
              Join thousands of smart shoppers who are finding the best deals on
              every purchase. Compare prices instantly.
            </p>
            <Link to="/dashboard">
              <button className="inline-flex items-center gap-3 px-12 py-5 bg-white text-[var(--accent-primary)] rounded-lg hover:shadow-2xl transition-all font-light hover:scale-105 group">
                Compare Now
                <ArrowRight
                  size={20}
                  strokeWidth={1.5}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
