import { Sparkles, Zap, Shield, Users, CheckCircle, Crown, Camera, Search, DollarSign } from "lucide-react"

export default function About() {
  const values = [
    {
      icon: Zap,
      title: "Innovation",
      description: "Cutting-edge AI technology for instant product recognition",
      image: "/innovation.jpg"
    },
    {
      icon: Shield,
      title: "Trust",
      description: "Verified retailers and authentic product data only",
      image: "/trust1.jpg"
    },
    {
      icon: Users,
      title: "Community",
      description: "Built for smart shoppers who value their money",
      image: "/community.jpg"
    }
  ]

  const process = [
    { step: "01", icon: Camera, title: "Upload", description: "Snap or upload product image" },
    { step: "02", icon: Search, title: "Identify", description: "AI recognizes the product" },
    { step: "03", icon: DollarSign, title: "Compare", description: "See prices across retailers" },
    { step: "04", icon: Crown, title: "Save", description: "Choose the best deal" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50">
      

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-amber-100 to-rose-50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100/50 rounded-full border border-amber-200 mb-6">
            <Sparkles size={16} className="text-amber-700" />
            <span className="text-amber-900 text-xs font-medium tracking-wide">ABOUT COMPARIO</span>
          </div>
          
          <h1 className="font-serif text-5xl md:text-6xl text-amber-900 mb-6">
            Revolutionizing Smart Shopping
          </h1>
          <p className="text-amber-700 text-xl max-w-3xl mx-auto leading-relaxed">
            Making price comparison effortless through AI and computer vision
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-serif text-4xl text-amber-900 mb-6">Our Mission</h2>
              <p className="text-amber-700 text-lg leading-relaxed mb-8">
                At Compario, we believe finding the best price should be as simple as taking a picture. 
                We're democratizing smart shopping through AI-powered visual search.
              </p>
              <div className="space-y-4">
                {[
                  'AI-Powered Visual Search',
                  'Real-time Price Comparison',
                  'Trusted Retailer Network',
                  'User-First Design'
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                    <span className="text-amber-800">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img 
                src="/about1 (2).jpg"
                alt="Technology"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 bg-amber-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl text-amber-900 mb-4">How It Works</h2>
            <p className="text-amber-600">Simple steps to smart savings</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {process.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 text-center hover:shadow-lg transition-all border border-amber-200">
                <div className="text-amber-200 text-5xl font-serif mb-4">{item.step}</div>
                <div className="w-14 h-14 bg-amber-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon size={24} />
                </div>
                <h3 className="font-serif text-lg text-amber-900 mb-2">{item.title}</h3>
                <p className="text-amber-700 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl text-amber-900 mb-4">Our Values</h2>
            <p className="text-amber-600">What drives us forward</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all group border border-amber-200">
                <div className="h-48 overflow-hidden">
                  <img 
                    src={value.image}
                    alt={value.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <div className="w-12 h-12 bg-amber-600 text-white rounded-xl flex items-center justify-center mb-4">
                    <value.icon size={22} />
                  </div>
                  <h3 className="font-serif text-xl text-amber-900 mb-3">{value.title}</h3>
                  <p className="text-amber-700 text-sm leading-relaxed">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-gradient-to-r from-amber-900 to-rose-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-5xl font-serif text-amber-100 mb-2">50K+</div>
              <div className="text-amber-200">Happy Shoppers</div>
            </div>
            <div>
              <div className="text-5xl font-serif text-amber-100 mb-2">₹2Cr+</div>
              <div className="text-amber-200">Total Savings</div>
            </div>
            <div>
              <div className="text-5xl font-serif text-amber-100 mb-2">99%</div>
              <div className="text-amber-200">Accuracy Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-5xl text-amber-900 mb-6">Ready to Join?</h2>
          <p className="text-amber-600 text-lg mb-8 max-w-2xl mx-auto">
            Experience the future of price comparison today
          </p>
          <button className="inline-flex items-center gap-2 px-10 py-5 bg-amber-600 text-white hover:bg-amber-700 transition-all duration-300 rounded-full">
            <DollarSign size={20} />
            <span className="font-medium">Start Saving Now</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-amber-200 bg-amber-100 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-amber-700 text-sm">© 2025 Compario. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}