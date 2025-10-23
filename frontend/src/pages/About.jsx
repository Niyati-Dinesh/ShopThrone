import { Sparkles, Crown, Heart, Target, Users, Star, Zap, Camera, Search, DollarSign } from "lucide-react"

export default function About() {
  return (
    <div className="min-h-screen bg-amber-50">
      {/* Hero Section - Light & Bright */}
      <section className="relative py-24 bg-gradient-to-br from-amber-100 to-rose-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full inline-flex items-center gap-3 mb-8 border border-amber-200/50">
            <Sparkles size={20} className="text-amber-600" />
            <span className="text-amber-800 font-light tracking-wider text-sm">AI-POWERED SMART SHOPPING ASSISTANT</span>
          </div>
          
          <h1 className="font-serif text-6xl md:text-7xl text-amber-900 mb-6 leading-tight">
            Compario
          </h1>
          <p className="text-amber-700 text-xl md:text-2xl max-w-2xl mx-auto font-light">
            Snap. Identify. Compare. Save.
          </p>
        </div>
      </section>

      {/* Mission Section with Light Background */}
      <section className="relative py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-amber-900 mb-8">
              Our Mission
            </h2>
            <p className="text-amber-700 text-lg leading-relaxed font-light max-w-3xl mx-auto">
              Upload any product image and let our AI find the best deals across the web. 
              We're revolutionizing how people shop by making price comparison effortless and intelligent.
            </p>
          </div>

          {/* How It Works Section */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 p-8 text-center group hover:shadow-xl transition-all duration-500 rounded-2xl">
              <div className="w-16 h-16 bg-amber-500 text-white flex items-center justify-center mb-6 rounded-2xl mx-auto group-hover:scale-110 transition-transform">
                <Camera size={28} />
              </div>
              <h3 className="font-serif text-2xl text-amber-900 mb-4">Snap It</h3>
              <p className="text-amber-700 font-light leading-relaxed">
                Upload a product image and let our AI work its magic to identify what you're looking for.
              </p>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 p-8 text-center group hover:shadow-xl transition-all duration-500 rounded-2xl">
              <div className="w-16 h-16 bg-rose-500 text-white flex items-center justify-center mb-6 rounded-2xl mx-auto group-hover:scale-110 transition-transform">
                <Search size={28} />
              </div>
              <h3 className="font-serif text-2xl text-rose-900 mb-4">Find It</h3>
              <p className="text-rose-700 font-light leading-relaxed">
                Our advanced AI scans multiple retailers to find the exact product you're looking for.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 p-8 text-center group hover:shadow-xl transition-all duration-500 rounded-2xl">
              <div className="w-16 h-16 bg-orange-500 text-white flex items-center justify-center mb-6 rounded-2xl mx-auto group-hover:scale-110 transition-transform">
                <DollarSign size={28} />
              </div>
              <h3 className="font-serif text-2xl text-orange-900 mb-4">Save It</h3>
              <p className="text-orange-700 font-light leading-relaxed">
                Compare prices instantly and save money with the best deals from trusted retailers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-amber-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-amber-900 mb-8">
              Why Choose Compario
            </h2>
            <p className="text-amber-600 text-xl font-light max-w-2xl mx-auto">
              Experience shopping like never before with our innovative AI-powered platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border border-amber-200 p-8 rounded-2xl text-center group hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-amber-100 flex items-center justify-center rounded-2xl mb-6 mx-auto group-hover:scale-110 transition-transform">
                <Zap size={28} className="text-amber-600" />
              </div>
              <h3 className="font-serif text-2xl text-amber-900 mb-4">Lightning Fast</h3>
              <p className="text-amber-700 font-light leading-relaxed">
                Get results in seconds with our optimized AI algorithms and real-time price comparison.
              </p>
            </div>

            <div className="bg-white border border-rose-200 p-8 rounded-2xl text-center group hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-rose-100 flex items-center justify-center rounded-2xl mb-6 mx-auto group-hover:scale-110 transition-transform">
                <Target size={28} className="text-rose-600" />
              </div>
              <h3 className="font-serif text-2xl text-rose-900 mb-4">Precision Matching</h3>
              <p className="text-rose-700 font-light leading-relaxed">
                Our advanced AI ensures accurate product identification and perfect matches every time.
              </p>
            </div>

            <div className="bg-white border border-orange-200 p-8 rounded-2xl text-center group hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-orange-100 flex items-center justify-center rounded-2xl mb-6 mx-auto group-hover:scale-110 transition-transform">
                <Crown size={28} className="text-orange-600" />
              </div>
              <h3 className="font-serif text-2xl text-orange-900 mb-4">Quality First</h3>
              <p className="text-orange-700 font-light leading-relaxed">
                We prioritize trusted retailers and verified products to ensure the best shopping experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-amber-900 mb-8">
              Our Values
            </h2>
          </div>

          <div className="grid gap-8">
            {/* Authenticity & Quality */}
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 p-8 rounded-2xl group hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-amber-500 text-white flex items-center justify-center rounded-xl flex-shrink-0">
                  <Star size={24} />
                </div>
                <div>
                  <h3 className="font-serif text-2xl text-amber-900 mb-4">Authenticity Meets Quality</h3>
                  <p className="text-amber-700 font-light leading-relaxed">
                    Every product recommendation is backed by verified data and trusted retailers. 
                    Our platform is carefully designed to bring only the best deals to you, ensuring 
                    you shop with confidence and peace of mind.
                  </p>
                </div>
              </div>
            </div>

            {/* Community Driven */}
            <div className="bg-gradient-to-r from-rose-50 to-rose-100 border border-rose-200 p-8 rounded-2xl group hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-rose-500 text-white flex items-center justify-center rounded-xl flex-shrink-0">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="font-serif text-2xl text-rose-900 mb-4">Community Driven</h3>
                  <p className="text-rose-700 font-light leading-relaxed">
                    Born from the need to help shoppers make better decisions. The desire to provide 
                    genuine value and save you money is what drives our platform forward. We're built 
                    for smart shoppers, by people who understand smart shopping.
                  </p>
                </div>
              </div>
            </div>

            {/* User Centric */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 p-8 rounded-2xl group hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-orange-500 text-white flex items-center justify-center rounded-xl flex-shrink-0">
                  <Heart size={24} />
                </div>
                <div>
                  <h3 className="font-serif text-2xl text-orange-900 mb-4">User Centric Design</h3>
                  <p className="text-orange-700 font-light leading-relaxed">
                    Built with love for smart shoppers who value both quality and savings. Every feature 
                    is designed with your convenience in mind, making price comparison effortless and 
                    enjoyable. Your satisfaction is our ultimate goal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Bright & Inviting */}
      <section className="bg-amber-900 border-b border-amber-700 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-6">
            Ready to Shop Smarter?
          </h2>
          <p className="text-amber-100 text-xl mb-8 font-light">
            Join thousands of savvy shoppers who save with every purchase
          </p>
          <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl border border-white/30 inline-block">
            <p className="text-white font-light text-lg">
              Experience the future of smart shopping with Compario today
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-amber-200 bg-amber-100">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <p className="text-amber-700 font-light">© 2025 Compario. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}