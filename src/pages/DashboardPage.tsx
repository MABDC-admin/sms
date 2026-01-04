import { useAuth } from '../contexts/AuthContext'
import { AdminDashboard } from './AdminDashboard'
import { TeacherDashboard } from './TeacherDashboard'
import { StudentDashboard } from './StudentDashboard'
import { FinanceDashboard } from './FinanceDashboard'

export function DashboardPage() {
  const { profile } = useAuth()

  // Render dashboard based on user role
  switch (profile?.role) {
    case 'admin':
      return <AdminDashboard />
    case 'teacher':
      return <TeacherDashboard />
    case 'student':
      return <StudentDashboard />
    case 'finance':
      return <FinanceDashboard />
    default:
      return <AdminDashboard />
  }
}
