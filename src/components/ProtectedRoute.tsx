import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('admin' | 'teacher' | 'student' | 'finance')[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()

  // Check for demo user in localStorage
  const demoUserStr = localStorage.getItem('demo_user')
  const demoUser = demoUserStr ? JSON.parse(demoUserStr) : null

  if (loading && !demoUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8FAF7' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-2xl mx-auto mb-4" style={{ backgroundColor: '#5B8C51' }}>
            🎓
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Allow access if demo user exists
  if (demoUser) {
    return <>{children}</>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role as any)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
