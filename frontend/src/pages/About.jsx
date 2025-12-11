import { Zap, Globe, Search, ArrowRight, Sparkles, Lock } from "lucide-react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-20">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-[var(--accent-primary)] rounded-full"></div>
                <span className="text-sm tracking-widest uppercase font-light text-[var(--accent-primary)]">
                  About ShopThrone
                </span>
              </div>
              <h1 className="text-6xl lg:text-7xl font-light leading-tight text-[var(--text-primary)]">
                Smart Shopping
                <br />
                <span className="text-[var(--accent-primary)]">Reimagined</span>
              </h1>
            </div>
            <p className="text-xl font-light text-[var(--text-secondary)] leading-relaxed max-w-lg">
              We believe finding the perfect product at the best price should be
              effortless. ShopThrone empowers millions of shoppers with
              intelligent, real-time price comparisons.
            </p>
            <Link to="/dashboard">
              <button className="inline-flex items-center gap-3 px-8 py-4 bg-[var(--accent-primary)] text-white rounded-sm hover:shadow-lg transition-all font-light">
                <Search size={20} strokeWidth={1.5} />
                Start Comparing
                <ArrowRight size={18} strokeWidth={1.5} />
              </button>
            </Link>
          </div>

          {/* Hero Image */}
          <div className="relative aspect-square rounded-sm overflow-hidden shadow-2xl">
            <img
              src="/about 1 (2).jpg"
              alt="Shopping made easy"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="bg-[var(--bg-secondary)] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              <div>
                <h2 className="text-5xl font-light mb-6 text-[var(--text-primary)]">
                  Our Mission
                </h2>
                <p className="text-lg font-light text-[var(--text-secondary)] leading-relaxed">
                  At ShopThrone, we empower shoppers with intelligence. Our
                  mission is to eliminate the friction from price comparison by
                  leveraging cutting-edge technology to deliver real-time,
                  accurate pricing across India's leading e-commerce platforms.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { icon: Sparkles, text: "Real-time price intelligence" },
                  { icon: Globe, text: "Multi-platform comparison" },
                  { icon: Lock, text: "Verified seller data" },
                  { icon: Zap, text: "Lightning-fast results" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-[var(--accent-primary)]/10 rounded-full flex items-center justify-center group-hover:bg-[var(--accent-primary)]/20 transition-all">
                      <item.icon
                        size={20}
                        className="text-[var(--accent-primary)]"
                        strokeWidth={1.5}
                      />
                    </div>
                    <span className="text-lg font-light text-[var(--text-primary)]">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mission Image */}
            <div className="relative aspect-square rounded-sm overflow-hidden shadow-xl">
              <img
                src="/about2.jpg"
                alt="Our team"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-light mb-6 text-[var(--text-primary)]">
              Why ShopThrone
            </h2>
            <p className="text-xl font-light text-[var(--text-secondary)] max-w-2xl mx-auto">
              Experience the future of smart shopping with our intelligent
              platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: "01",
                title: "Instant Comparison",
                desc: "Compare prices from Amazon, Flipkart, Snapdeal in just 2 seconds",
              },
              {
                number: "02",
                title: "Verified Pricing",
                desc: "Real-time, verified data directly from retailer websites",
              },
              {
                number: "03",
                title: "Smart Sorting",
                desc: "Sort by price, rating, delivery time, and more",
              },
            ].map((feature, i) => (
              <div key={i} className="group">
                <div className="bg-[var(--bg-secondary)] rounded-sm p-8 border border-[var(--border-color)] hover:border-[var(--accent-primary)] h-full transition-all duration-300 space-y-6">
                  <div className="text-6xl font-light text-[var(--accent-primary)]/30 group-hover:text-[var(--accent-primary)]/50 transition-all">
                    {feature.number}
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-light text-[var(--text-primary)]">
                      {feature.title}
                    </h3>
                    <p className="font-light text-[var(--text-secondary)] leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-dark)] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: "100K+", label: "Products Compared" },
              { number: "50K+", label: "Active Users" },
              { number: "₹50Cr+", label: "Saved by Users" },
              { number: "99.8%", label: "Data Accuracy" },
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <div className="text-4xl font-light text-white">
                  {stat.number}
                </div>
                <p className="text-white/80 font-light">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-2xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-5xl font-light text-[var(--text-primary)]">
            Ready to Save More?
          </h2>
          <p className="text-xl font-light text-[var(--text-secondary)]">
            Join thousands of smart shoppers who use ShopThrone to find the best
            deals
          </p>
          <Link to="/dashboard">
            <button className="inline-flex items-center gap-3 px-10 py-4 bg-[var(--accent-primary)] text-white rounded-sm hover:shadow-lg transition-all font-light">
              Start Shopping Smart
              <ArrowRight size={20} strokeWidth={1.5} />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
