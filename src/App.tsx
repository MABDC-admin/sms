import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SchoolYearProvider } from './contexts/SchoolYearContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { MainLayout } from './layouts/MainLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { GradeLevelsPage } from './pages/GradeLevelsPage'
import { GradeDetailPage } from './pages/GradeDetailPage'
import { ClassroomPage } from './pages/ClassroomPage'
import { StudentRecordsPage } from './pages/StudentRecordsPage'
import { StudentsListPage } from './pages/students/StudentsListPage'
import { StudentFormPage } from './pages/students/StudentFormPage'
import { TeachersListPage } from './pages/teachers/TeachersListPage'
import { ClassesListPage } from './pages/classes/ClassesListPage'
import { CalendarPage } from './pages/CalendarPage'
import { ChatPage } from './pages/ChatPage'

// Placeholder pages for routes not yet implemented
function AttendancePage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Attendance</h1>
      <p className="text-gray-500">Coming soon...</p>
    </div>
  )
}

function FinanceListPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Finance</h1>
      <p className="text-gray-500">Manage payments, invoices, and expenses</p>
    </div>
  )
}

function ReportsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Reports</h1>
      <p className="text-gray-500">View and generate reports</p>
    </div>
  )
}

function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Settings</h1>
      <p className="text-gray-500">Manage your account settings</p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SchoolYearProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes with MainLayout */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard - Role-based */}
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Grade Levels */}
            <Route path="/grade-levels" element={<GradeLevelsPage />} />
            <Route path="/grade-levels/:gradeId" element={<GradeDetailPage />} />
            <Route path="/classroom/:subjectId" element={<ClassroomPage />} />

            {/* Student Records */}
            <Route path="/records" element={<StudentRecordsPage />} />

            {/* Students */}
            <Route path="/students" element={<StudentsListPage />} />
            <Route path="/students/new" element={<StudentFormPage />} />
            <Route path="/students/:id/edit" element={<StudentFormPage />} />

            {/* Teachers */}
            <Route path="/teachers" element={<TeachersListPage />} />
            <Route path="/teachers/new" element={<StudentFormPage />} />
            <Route path="/teachers/:id/edit" element={<StudentFormPage />} />

            {/* Classes */}
            <Route path="/classes" element={<ClassesListPage />} />
            <Route path="/classes/new" element={<ClassesListPage />} />
            <Route path="/classes/:id/edit" element={<ClassesListPage />} />

            {/* Other Pages */}
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/finance" element={<FinanceListPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </SchoolYearProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
