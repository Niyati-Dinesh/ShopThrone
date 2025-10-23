import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { Sparkles, LogIn, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const auth = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const success = await auth.login(email, password)
      if (success) {
        
        navigate('/dashboard')
      } else {
        toast.error('Login failed. Please try again.')
      }
    } catch (error) {
      console.error('💥 Login component error:', error)
      
      // Handle different error types properly
      let errorMessage = 'Login failed'
      if (error.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-stone-800 to-stone-900 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`
          }}
        />
        <div className="relative z-10 flex flex-col justify-center items-center text-center px-12 w-full">
          <div className="bg-stone-700/30 backdrop-blur-sm px-6 py-3 rounded-full inline-flex items-center gap-3 mb-8 border border-stone-600/30">
            <Sparkles size={20} className="text-stone-300" />
            <span className="text-stone-200 font-light tracking-wider text-sm">WELCOME BACK</span>
          </div>
          
          <h1 className="font-serif text-5xl md:text-6xl text-stone-100 mb-6 leading-tight">
            Compario
          </h1>
          <p className="text-stone-300 text-xl max-w-md mx-auto font-light leading-relaxed">
            Continue your smart shopping journey with AI-powered price comparison
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="font-serif text-4xl text-stone-800 mb-4">Compario</h1>
            <p className="text-stone-600 font-light">Sign in to your account</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white border border-stone-200 rounded-2xl px-8 py-10 shadow-sm"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-stone-800 text-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LogIn size={28} />
              </div>
              <h2 className="font-serif text-3xl text-stone-800">Welcome Back</h2>
              <p className="text-stone-500 font-light mt-2">Sign in to continue shopping smart</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-stone-700 text-sm font-light mb-3" htmlFor="email">
                  Email Address
                </label>
                <input
                  className="w-full py-3 px-4 border border-stone-200 bg-stone-50 text-stone-800 rounded-xl focus:outline-none focus:border-stone-400 focus:bg-white transition-all duration-300"
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-stone-700 text-sm font-light mb-3" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    className="w-full py-3 px-4 pr-12 border border-stone-200 bg-stone-50 text-stone-800 rounded-xl focus:outline-none focus:border-stone-400 focus:bg-white transition-all duration-300"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              className="w-full mt-8 bg-stone-800 hover:bg-stone-900 text-white font-light py-4 px-4 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn size={20} className="group-hover:scale-110 transition-transform" />
              )}
              {loading ? 'Signing In...' : 'Sign In to Account'}
            </button>

            <p className="text-center text-stone-500 text-sm mt-8 font-light">
              Don't have an account?{' '}
              <Link to="/signup" className="text-stone-800 hover:text-stone-900 font-normal transition-colors">
                Create Account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}