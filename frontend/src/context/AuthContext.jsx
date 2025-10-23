import { createContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import toast from 'react-hot-toast'
import api from '../services/api'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token)
        setUser({ email: decodedToken.sub })
        
        // Set authorization header for all future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } catch (error) {
        console.error('Token decode error:', error)
        logout()
      }
    }
    setLoading(false)
  }, [token])

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email)
      
      // Use FormData for OAuth2 token endpoint
      const formData = new FormData()
      formData.append('username', email)
      formData.append('password', password)

      // Make request directly to the token endpoint without using the api client
      // (since api client has JSON headers by default)
      const response = await fetch('http://localhost:8000/api/token', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed')
      }

      const { access_token } = data
      
      localStorage.setItem('token', access_token)
      setToken(access_token)
      
      // Set authorization header for all future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

      console.log('✅ Login successful')
      toast.success('Welcome back!')
      return true
    } catch (error) {
      console.error('💥 Login error:', error)
      toast.error(error.message || 'Login failed')
      return false
    }
  }

  const signup = async (userData) => {
    try {
      console.log('👤 Attempting signup for:', userData.email)
      
      const response = await api.post('/users/signup', userData)
      console.log('✅ Signup successful')
      
      // Auto-login after successful signup
      const loginSuccess = await login(userData.email, userData.password)
      
      if (loginSuccess) {
        toast.success('Account created successfully!')
      } else {
        toast.success('Account created! Please log in.')
      }
      
      return loginSuccess
    } catch (error) {
      console.error('💥 Signup error:', error)
      
      let errorMessage = 'Signup failed'
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.response?.data) {
        errorMessage = typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data)
      }
      
      toast.error(errorMessage)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    delete api.defaults.headers.common['Authorization']
    toast.success('Logged out successfully!')
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, signup, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}