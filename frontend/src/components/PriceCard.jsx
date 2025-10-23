import { ShoppingCart, Crown, ExternalLink } from 'lucide-react'

export default function PriceCard({ site, price, isBestPrice }) {
  const siteConfig = {
    amazon: {
      name: 'Amazon',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
      color: 'from-amber-500 to-amber-600',
      text: 'text-amber-50',
      border: 'border-amber-300/30'
    },
    flipkart: {
      name: 'Flipkart',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Flipkart_logo.svg',
      color: 'from-blue-500 to-blue-600',
      text: 'text-blue-50',
      border: 'border-blue-300/30'
    },
    snapdeal: {
      name: 'Flipkart',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Snapdeal_logo.svg',
      color: 'from-red-500 to-red-600',
      text: 'text-red-50',
      border: 'border-red-300/30'
    }
  }
  
  const config = siteConfig[site.toLowerCase()] || {
    name: site,
    logo: null,
    color: 'from-stone-500 to-stone-600',
    text: 'text-stone-50',
    border: 'border-stone-300/30'
  }

  return (
    <div className={`bg-white/80 backdrop-blur-sm border ${config.border} rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group ${
      isBestPrice ? 'ring-2 ring-amber-400 ring-opacity-50' : ''
    }`}>
      {/* Header with Logo */}
      <div className={`bg-gradient-to-r ${config.color} p-6 ${config.text} relative`}>
        {isBestPrice && (
          <div className="absolute -top-2 -right-2 bg-amber-500 text-amber-50 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
            <Crown size={12} />
            Best Price
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl">{config.name}</h3>
          {config.logo && (
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center p-2">
              <img 
                src={config.logo} 
                alt={`${config.name} logo`}
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Price Content */}
      <div className="p-6">
        {price ? (
          <div className="text-center">
            <div className="mb-4">
              <p className="text-4xl font-light text-amber-900 mb-1">
                ₹{price.toLocaleString('en-IN')}
              </p>
              <p className="text-amber-600 text-sm font-light">Inclusive of all taxes</p>
            </div>
            
            <button className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-amber-50 font-light py-3 px-4 flex items-center justify-center gap-2 transition-all duration-300 rounded-xl group/btn shadow-md hover:shadow-lg">
              <ShoppingCart size={18} className="group-hover/btn:scale-110 transition-transform" />
              <span>View on {config.name}</span>
              <ExternalLink size={16} className="ml-auto opacity-70" />
            </button>
            
            {isBestPrice && (
              <div className="mt-3 bg-amber-100 border border-amber-200 rounded-lg p-2">
                <p className="text-amber-700 text-xs font-medium">You save with this deal!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-xl text-amber-400 font-light mb-2">Not Available</p>
            <p className="text-amber-500 text-sm font-light">Product not found on {config.name}</p>
          </div>
        )}
      </div>
    </div>
  )
}