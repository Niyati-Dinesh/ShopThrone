import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { Sparkles, UserPlus, Eye, EyeOff, Check, X, Info } from 'lucide-react'

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: '',
    pin: '',
    age: '',
    gender: 'other',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const auth = useAuth()
  const navigate = useNavigate()

  // Password requirements
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  })

  // Validate password in real-time
  useEffect(() => {
    const requirements = {
      length: formData.password.length >= 8,
      uppercase: /[A-Z]/.test(formData.password),
      lowercase: /[a-z]/.test(formData.password),
      number: /[0-9]/.test(formData.password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    }
    setPasswordRequirements(requirements)
  }, [formData.password])

  const validateField = (name, value) => {
    const newErrors = { ...errors }
    
    switch (name) {
      case 'email':
        if (!value) {
          newErrors.email = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Please enter a valid email address'
        } else {
          delete newErrors.email
        }
        break
        
      case 'password':
        if (!value) {
          newErrors.password = 'Password is required'
        } else if (!passwordRequirements.length || !passwordRequirements.uppercase || 
                   !passwordRequirements.lowercase || !passwordRequirements.number || 
                   !passwordRequirements.special) {
          newErrors.password = 'Password does not meet requirements'
        } else {
          delete newErrors.password
        }
        break
        
      case 'name':
        if (!value) {
          newErrors.name = 'Full name is required'
        } else if (value.length < 2) {
          newErrors.name = 'Name must be at least 2 characters'
        } else {
          delete newErrors.name
        }
        break
        
      case 'phone':
        if (!value) {
          newErrors.phone = 'Phone number is required'
        } else if (!/^[0-9]{10}$/.test(value.replace(/\D/g, ''))) {
          newErrors.phone = 'Please enter a valid 10-digit phone number'
        } else {
          delete newErrors.phone
        }
        break
        
      case 'pin':
        if (!value) {
          newErrors.pin = 'PIN code is required'
        } else if (!/^[0-9]{6}$/.test(value)) {
          newErrors.pin = 'Please enter a valid 6-digit PIN code'
        } else {
          delete newErrors.pin
        }
        break
        
      case 'age':
        if (!value) {
          newErrors.age = 'Age is required'
        } else if (parseInt(value) < 13) {
          newErrors.age = 'You must be at least 13 years old'
        } else if (parseInt(value) > 120) {
          newErrors.age = 'Please enter a valid age'
        } else {
          delete newErrors.age
        }
        break
        
      default:
        break
    }
    
    setErrors(newErrors)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    let processedValue = value

    // Format phone number
    if (name === 'phone') {
      processedValue = value.replace(/\D/g, '').slice(0, 10)
    }
    
    // Format PIN code
    if (name === 'pin') {
      processedValue = value.replace(/\D/g, '').slice(0, 6)
    }
    
    // Format age
    if (name === 'age') {
      processedValue = value.replace(/\D/g, '').slice(0, 3)
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }))
    
    // Validate field if it's been touched
    if (touched[name]) {
      validateField(name, processedValue)
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    validateField(name, value)
  }

  const validateForm = () => {
    const newTouched = {}
    Object.keys(formData).forEach(key => {
      if (key !== 'gender') { // gender has a default value
        newTouched[key] = true
      }
    })
    setTouched(newTouched)

    Object.keys(formData).forEach(key => {
      if (key !== 'gender') {
        validateField(key, formData[key])
      }
    })

    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setLoading(true)
    const success = await auth.signup({
      ...formData,
      age: parseInt(formData.age)
    })
    if (success) {
      navigate('/login')
    }
    setLoading(false)
  }

  const isFormValid = Object.keys(errors).length === 0 && 
    Object.values(formData).every(value => value !== '') &&
    formData.password && Object.values(passwordRequirements).every(req => req)

  // Password strength indicator
  const getPasswordStrength = () => {
    const metRequirements = Object.values(passwordRequirements).filter(Boolean).length
    if (metRequirements <= 2) return { strength: 'Weak', color: 'text-red-500', bg: 'bg-red-500' }
    if (metRequirements <= 4) return { strength: 'Medium', color: 'text-amber-500', bg: 'bg-amber-500' }
    return { strength: 'Strong', color: 'text-green-500', bg: 'bg-green-500' }
  }

  const passwordStrength = getPasswordStrength()

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="font-serif text-4xl text-stone-800 mb-4">Compario</h1>
            <p className="text-stone-600 font-light">Create your account</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white border border-stone-200 rounded-2xl px-8 py-10 shadow-sm"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-stone-800 text-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserPlus size={28} />
              </div>
              <h2 className="font-serif text-3xl text-stone-800">Join Compario</h2>
              <p className="text-stone-500 font-light mt-2">Start your smart shopping journey</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField 
                label="Full Name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.name}
                touched={touched.name}
                icon="👤"
                required
              />
              
              <InputField 
                label="Email Address" 
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.email}
                touched={touched.email}
                icon="✉️"
                required
              />
              
              {/* Password Field with Requirements */}
              <div className="md:col-span-2">
                <label className="block text-stone-700 text-sm font-light mb-3" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    className={`w-full py-3 px-4 pr-12 border ${
                      errors.password && touched.password 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-stone-200 bg-stone-50'
                    } text-stone-800 rounded-xl focus:outline-none focus:border-stone-400 focus:bg-white transition-all duration-300`}
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
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
                
                {touched.password && (
                  <>
                    {/* Password Strength Indicator */}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-stone-600">Password strength:</span>
                      <span className={`text-sm font-medium ${passwordStrength.color}`}>
                        {passwordStrength.strength}
                      </span>
                    </div>
                    <div className="w-full bg-stone-200 rounded-full h-2 mt-1">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.bg}`}
                        style={{ 
                          width: `${(Object.values(passwordRequirements).filter(Boolean).length / 5) * 100}%` 
                        }}
                      />
                    </div>

                    {/* Password Requirements */}
                    <div className="mt-4 p-4 bg-stone-50 border border-stone-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Info size={16} className="text-stone-500" />
                        <span className="text-sm font-medium text-stone-700">Password must contain:</span>
                      </div>
                      <div className="space-y-2">
                        <RequirementItem 
                          met={passwordRequirements.length}
                          text="At least 8 characters"
                        />
                        <RequirementItem 
                          met={passwordRequirements.uppercase}
                          text="One uppercase letter (A-Z)"
                        />
                        <RequirementItem 
                          met={passwordRequirements.lowercase}
                          text="One lowercase letter (a-z)"
                        />
                        <RequirementItem 
                          met={passwordRequirements.number}
                          text="One number (0-9)"
                        />
                        <RequirementItem 
                          met={passwordRequirements.special}
                          text="One special character (!@#$%^&*)"
                        />
                      </div>
                    </div>
                  </>
                )}
                
                {errors.password && touched.password && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                    <X size={14} />
                    {errors.password}
                  </p>
                )}
              </div>

              <InputField 
                label="Phone Number" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.phone}
                touched={touched.phone}
                icon="📱"
                required
              />
              
              <InputField 
                label="Address" 
                name="address" 
                value={formData.address} 
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.address}
                touched={touched.address}
                icon="🏠"
                required
              />
              
              <InputField 
                label="PIN Code" 
                name="pin" 
                value={formData.pin} 
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.pin}
                touched={touched.pin}
                icon="📮"
                required
              />
              
              <InputField 
                label="Age" 
                name="age" 
                type="number" 
                value={formData.age} 
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.age}
                touched={touched.age}
                icon="🎂"
                required
              />
              
              <div>
                <label className="block text-stone-700 text-sm font-light mb-3" htmlFor="gender">
                  Gender
                </label>
                <select
                  name="gender"
                  id="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full py-3 px-4 border border-stone-200 bg-stone-50 text-stone-800 rounded-xl focus:outline-none focus:border-stone-400 focus:bg-white transition-all duration-300"
                >
                  <option value="other">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            <button
              className={`w-full mt-8 ${
                isFormValid 
                  ? 'bg-stone-800 hover:bg-stone-900 cursor-pointer' 
                  : 'bg-stone-400 cursor-not-allowed'
              } text-white font-light py-4 px-4 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group`}
              type="submit"
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <UserPlus size={20} className="group-hover:scale-110 transition-transform" />
              )}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <p className="text-center text-stone-500 text-sm mt-8 font-light">
              Already have an account?{' '}
              <Link to="/login" className="text-stone-800 hover:text-stone-900 font-normal transition-colors">
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Right Side - Image */}
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
            <span className="text-stone-200 font-light tracking-wider text-sm">JOIN OUR COMMUNITY</span>
          </div>
          
          <h1 className="font-serif text-5xl md:text-6xl text-stone-100 mb-6 leading-tight">
            Compario
          </h1>
          <p className="text-stone-300 text-xl max-w-md mx-auto font-light leading-relaxed">
            Join thousands of smart shoppers saving money with AI-powered price comparison
          </p>
        </div>
      </div>
    </div>
  )
}

const InputField = ({ label, name, type = 'text', value, onChange, onBlur, error, touched, icon, required }) => (
  <div>
    <label className="block text-stone-700 text-sm font-light mb-3" htmlFor={name}>
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      className={`w-full py-3 px-4 border ${
        error && touched 
          ? 'border-red-300 bg-red-50' 
          : 'border-stone-200 bg-stone-50'
      } text-stone-800 rounded-xl focus:outline-none focus:border-stone-400 focus:bg-white transition-all duration-300`}
      id={name}
      name={name}
      type={type}
      placeholder={label}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      required={required}
    />
    {error && touched && (
      <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
        <X size={14} />
        {error}
      </p>
    )}
  </div>
)

const RequirementItem = ({ met, text }) => (
  <div className="flex items-center gap-3">
    {met ? (
      <Check size={16} className="text-green-500" />
    ) : (
      <X size={16} className="text-red-400" />
    )}
    <span className={`text-sm ${met ? 'text-green-600' : 'text-stone-500'}`}>
      {text}
    </span>
  </div>
)