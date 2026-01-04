import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'admin' | 'teacher' | 'student' | 'finance'>('student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isLogin) {
      const { error } = await signIn(email, password)
      if (error) {
        // Handle email not confirmed error
        if (error.message.includes('Email not confirmed')) {
          setError('Email not confirmed. Please check your email for a confirmation link, or disable email confirmation in Supabase Dashboard (Auth > Providers > Email > Confirm email = OFF)')
        } else {
          setError(error.message)
        }
      } else {
        navigate('/dashboard')
      }
    } else {
      const { error } = await signUp(email, password, fullName, role)
      if (error) {
        setError(error.message)
      } else {
        setError('')
        // Show success message for signup
        alert('Account created! Please check your email for confirmation link, or disable email confirmation in Supabase Dashboard for testing.')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8FAF7' }}>
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-2xl" style={{ backgroundColor: '#5B8C51' }}>
            🎓
          </div>
          <span className="text-2xl font-bold text-gray-800">School Admin</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          {isLogin ? 'Welcome Back!' : 'Create Account'}
        </h1>
        <p className="text-center text-gray-500 mb-6">
          {isLogin ? 'Sign in to access your dashboard' : 'Register for a new account'}
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition"
                placeholder="Enter your full name"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition"
              placeholder="Enter your password"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
                <option value="finance">Finance</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-medium transition disabled:opacity-50"
            style={{ backgroundColor: '#5B8C51' }}
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center text-gray-600 mt-6">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-medium hover:underline"
            style={{ color: '#5B8C51' }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  )
}
