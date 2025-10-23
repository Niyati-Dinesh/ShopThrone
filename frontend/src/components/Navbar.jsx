import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LogIn, LogOut, User, Image, Info, Home, Heart, Crown } from 'lucide-react'

export default function Navbar() {
  const { token, user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-amber-900 border-b border-amber-700 top-0 sticky z-50">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="flex justify-between items-center h-20">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-3">
            <Crown size={28} className="text-amber-300" />
            <img 
              src="/compario.jpg" 
              alt="Compario" 
              className="h-10 w-auto" 
              onError={(e) => {
                // Fallback if image doesn't load
                e.target.style.display = 'none'
              }}
            />
            {/* Fallback text if image fails */}
            <span className="font-serif text-3xl text-amber-100 tracking-tight">Compario</span>
          </Link>

          {/* Navigation Links - Organized properly */}
          <div className="flex items-center space-x-6">
            {/* Always visible links */}
            <Link to="/" className="flex items-center space-x-2 text-amber-200 hover:text-amber-50 transition-colors font-light group">
              <Home size={18} className="group-hover:scale-110 transition-transform" />
              <span>Home</span>
            </Link>
            
            

            {/* Conditional links based on auth status */}
            {token ? (
              <>
                {/* Protected routes */}
                <Link to="/dashboard" className="flex items-center space-x-2 text-amber-200 hover:text-amber-50 transition-colors font-light group">
                  <Image size={18} className="group-hover:scale-110 transition-transform" />
                  <span>Dashboard</span>
                </Link>
                
                <Link to="/profile" className="flex items-center space-x-2 text-amber-200 hover:text-amber-50 transition-colors font-light group">
                  <User size={18} className="group-hover:scale-110 transition-transform" />
                  <span>Profile</span>
                </Link>
                <Link to="/about" className="flex items-center space-x-2 text-amber-200 hover:text-amber-50 transition-colors font-light group">
                  <Info size={18} className="group-hover:scale-110 transition-transform" />
                  <span>About</span>
                </Link>
                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-amber-200 hover:text-rose-300 transition-colors font-light group ml-4"
                >
                  <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
                
              <Link
                to="/login"
                className="px-6 py-2 bg-amber-100 text-amber-900 hover:bg-white transition-all duration-300 font-light tracking-wide flex items-center gap-2 group shadow-lg hover:shadow-xl"
              >
                <LogIn size={18} className="group-hover:scale-110 transition-transform" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}