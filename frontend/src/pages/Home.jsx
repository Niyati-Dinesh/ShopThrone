import { Link } from "react-router-dom"
import { Sparkles, Camera, Search, DollarSign, Heart, Crown, Star } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-amber-50">
      {/* Hero Section with Background Image */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-900/40 to-rose-900/30 mix-blend-multiply"></div>
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <div className="bg-amber-100/90 backdrop-blur-sm px-6 py-3 rounded-full inline-flex items-center gap-3 mb-8 border border-amber-200/50">
            <Sparkles size={20} className="text-amber-600" />
            <span className="text-amber-900 font-light tracking-wider text-sm">SMART FINDS. BEST PRICES.</span>
          </div>

          <h1 className="font-serif text-6xl md:text-8xl text-white mb-8 leading-tight tracking-tight">
            Snap &
            <span className="block text-amber-200 mt-2">Compare</span>
          </h1>
          
          <p className="text-white text-xl md:text-2xl max-w-2xl mx-auto mb-12 font-bold leading-relaxed">
            Find the best prices instantly with AI-powered visual search
          </p>

          <div className="flex flex-col items-center gap-6">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-4 px-12 py-5 bg-amber-600 text-white hover:bg-amber-700 transition-all duration-300 text-lg font-light tracking-wider group shadow-lg hover:shadow-xl"
            >
              <Camera size={22} className="group-hover:scale-110 transition-transform" />
              START COMPARING
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <h2 className="font-serif text-5xl md:text-6xl text-amber-900 mb-6">
            How It Works
          </h2>
          <p className="text-amber-700 text-xl max-w-2xl mx-auto font-light">
            Discover products through your camera and find the best deals instantly
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Snap It Card */}
          <div className="bg-gradient-to-br from-amber-50/80 to-rose-50/80 border border-amber-200/60 p-12 relative group hover:shadow-2xl transition-all duration-500 backdrop-blur-sm">
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-amber-500/90 to-amber-600/90 rounded-full flex items-center justify-center shadow-lg">
              <Star size={16} className="text-amber-100" />
            </div>
            <div className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-300/30 flex items-center justify-center mb-8 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <Camera size={32} className="text-amber-700 drop-shadow-sm" />
            </div>
            <h3 className="font-serif text-3xl text-amber-900 mb-6">Snap It</h3>
            <p className="text-amber-700 font-light leading-relaxed text-lg">
              Upload an image of any product you want to find. Our AI does the magic.
            </p>
          </div>

          {/* Find It Card */}
          <div className="bg-gradient-to-br from-rose-50/80 to-amber-50/80 border border-rose-200/60 p-12 relative group hover:shadow-2xl transition-all duration-500 backdrop-blur-sm">
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-rose-500/90 to-rose-600/90 rounded-full flex items-center justify-center shadow-lg">
              <Star size={16} className="text-rose-100" />
            </div>
            <div className="w-20 h-20 bg-gradient-to-br from-rose-500/20 to-rose-600/20 border border-rose-300/30 flex items-center justify-center mb-8 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <Search size={32} className="text-rose-700 drop-shadow-sm" />
            </div>
            <h3 className="font-serif text-3xl text-rose-900 mb-6">Find It</h3>
            <p className="text-rose-700 font-light leading-relaxed text-lg">
              Our advanced AI identifies the product from your image in seconds.
            </p>
          </div>

          {/* Save It Card */}
          <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 border border-amber-200/60 p-12 relative group hover:shadow-2xl transition-all duration-500 backdrop-blur-sm">
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-orange-500/90 to-orange-600/90 rounded-full flex items-center justify-center shadow-lg">
              <Star size={16} className="text-orange-100" />
            </div>
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-300/30 flex items-center justify-center mb-8 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <DollarSign size={32} className="text-orange-700 drop-shadow-sm" />
            </div>
            <h3 className="font-serif text-3xl text-orange-900 mb-6">Save It</h3>
            <p className="text-orange-700 font-light leading-relaxed text-lg">
              Compare the best prices from top retailers and save money instantly.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-amber-900 to-rose-900 py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-5xl md:text-6xl text-amber-100 mb-8">
            Ready to Discover?
          </h2>
          <p className="text-amber-200 text-xl mb-12 font-light max-w-2xl mx-auto">
            Join thousands of smart shoppers who find the best deals with Compario.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-4 px-14 py-5 bg-amber-100 text-amber-900 hover:bg-white transition-all duration-300 text-lg font-medium tracking-wider group shadow-2xl"
          >
            <Camera size={22} className="group-hover:rotate-12 transition-transform duration-500" />
            START SHOPPING SMART
          </Link>
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