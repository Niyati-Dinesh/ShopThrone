import { Camera, Search, DollarSign, Zap, Target, Crown, ArrowRight, Sparkles } from "lucide-react"
import { useState, useEffect } from "react"
import {Link} from "react-router-dom"

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0)
  
  const carouselImages = [
    "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=600&q=80",
    "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&q=80",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&q=80",
  ]

  const features = [
    { icon: Zap, title: "AI Visual Search", description: "Instant product identification" },
    { icon: Target, title: "Real-time Prices", description: "Live comparisons across platforms" },
    { icon: Crown, title: "Verified Sellers", description: "Only authentic products" },
    { icon: Sparkles, title: "Effortless", description: "Simple and intuitive" }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 overflow-x-hidden">
      
      {/* Hero Section - Reduced top space */}
      <section className="relative py-12 flex items-center justify-center bg-gradient-to-br from-amber-100 to-rose-50">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-96 h-96 bg-amber-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-rose-400 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100/50 rounded-full border border-amber-200">
                <Sparkles size={16} className="text-amber-700" />
                <span className="text-amber-900 text-xs font-medium tracking-wide">AI-POWERED</span>
              </div>
              
              <div className="space-y-4">
                <h1 className="font-serif text-5xl lg:text-6xl text-amber-900 tracking-tight">
                  Compario
                </h1>
                <p className="text-xl text-amber-700 font-extrabold">
                  Snap. Compare. Save.
                </p>
                <p className="text-amber-600 max-w-md leading-relaxed">
                  AI-powered visual search that finds the best prices instantly across all major retailers.
                </p>
              </div>

              <div className="flex gap-4">
                <Link to="/dashboard">
                  <button className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white hover:bg-amber-700 transition-all duration-300 rounded-full group">
                    <Camera size={18} />
                    <span className="font-medium">Start Comparing</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <Link to="/about">
                  <button className="inline-flex items-center gap-2 px-6 py-3 bg-white text-amber-700 hover:bg-amber-50 transition-all duration-300 rounded-full border border-amber-200">
                    <span className="font-medium">Learn More</span>
                  </button>
                </Link>
              </div>
            </div>

            {/* Right - Carousel */}
            <div className="relative h-[400px] flex items-center justify-center">
              <div className="relative w-full max-w-md h-64">
                {carouselImages.map((img, idx) => {
                  const offset = (idx - currentSlide + carouselImages.length) % carouselImages.length
                  const isActive = offset === 0
                  
                  return (
                    <div
                      key={idx}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
                      style={{
                        transform: `
                          translate(-50%, -50%)
                          translateX(${(offset - 1) * 100}%)
                          scale(${isActive ? 1 : 0.8})
                        `,
                        zIndex: carouselImages.length - offset,
                        opacity: offset <= 2 ? 1 - (offset * 0.4) : 0,
                      }}
                    >
                      <div className="w-56 h-56 bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-white">
                        <img src={img} alt="Product" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-1.5">
                {carouselImages.map((_, idx) => (
                  <button
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentSlide ? 'bg-amber-600 w-8' : 'bg-amber-300 w-1.5'
                    }`}
                    onClick={() => setCurrentSlide(idx)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Reduced spacing */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl text-amber-900 mb-3">Why Compario</h2>
            <p className="text-amber-600">Intelligent shopping, simplified</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-12 h-12 bg-amber-600 text-white flex items-center justify-center rounded-xl mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <feature.icon size={20} />
                </div>
                <h3 className="font-serif text-amber-900 mb-2">{feature.title}</h3>
                <p className="text-amber-700 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Reduced spacing */}
      <section id="how" className="py-16 bg-amber-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl text-amber-900 mb-3">How It Works</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Camera, number: "01", title: "Snap", desc: "Upload product image" },
              { icon: Search, number: "02", title: "Identify", desc: "AI finds the product" },
              { icon: DollarSign, number: "03", title: "Save", desc: "Compare and buy" }
            ].map(({ icon: Icon, number, title, desc }) => (
              <div key={number} className="text-center">
                <div className="text-amber-200 text-5xl font-serif mb-3">{number}</div>
                <div className="w-14 h-14 bg-amber-600 text-white flex items-center justify-center rounded-xl mx-auto mb-3">
                  <Icon size={24} />
                </div>
                <h3 className="font-serif text-xl text-amber-900 mb-2">{title}</h3>
                <p className="text-amber-700 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats - Reduced spacing */}
      <section className="py-16 bg-gradient-to-r from-amber-900 to-rose-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            {[
              { number: "50K+", label: "Products" },
              { number: "₹2Cr+", label: "Saved" },
              { number: "99%", label: "Accuracy" },
              { number: "24/7", label: "Active" }
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-serif text-amber-100 mb-2">{stat.number}</div>
                <div className="text-amber-200 text-sm tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Reduced spacing */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-4xl text-amber-900 mb-4">Ready to Save?</h2>
          <p className="text-amber-600 mb-6 max-w-2xl mx-auto">
            Join thousands of smart shoppers finding the best deals with Compario.
          </p>
          <Link to="/dashboard">
            <button className="inline-flex items-center gap-2 px-8 py-4 bg-amber-600 text-white hover:bg-amber-700 transition-all duration-300 rounded-full">
              <DollarSign size={20} />
              <span className="font-medium">Start Saving Now</span>
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-amber-200 bg-amber-100 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-amber-700 text-sm">© 2025 Compario. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}