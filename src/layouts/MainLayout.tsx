import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface MenuItem {
  icon: string
  label: string
  path: string
  roles?: ('admin' | 'teacher' | 'student' | 'finance')[]
}

const menuItems: MenuItem[] = [
  { icon: '📊', label: 'Dashboard', path: '/dashboard' },
  { icon: '📚', label: 'Grade Levels', path: '/grade-levels', roles: ['admin'] },
  { icon: '👤', label: 'Students', path: '/students', roles: ['admin', 'teacher'] },
  { icon: '📋', label: 'Records', path: '/records', roles: ['admin'] },
  { icon: '🅿️', label: 'Teachers', path: '/teachers', roles: ['admin'] },
  { icon: '📖', label: 'Classes', path: '/classes', roles: ['admin', 'teacher'] },
  { icon: '✅', label: 'Attendance', path: '/attendance', roles: ['admin', 'teacher'] },
  { icon: '📅', label: 'Calendar', path: '/calendar', roles: ['admin', 'teacher', 'student'] },
  { icon: '💬', label: 'Chat', path: '/chat', roles: ['admin', 'teacher', 'finance'] },
  { icon: '💳', label: 'Finance', path: '/finance', roles: ['admin', 'finance'] },
  { icon: '📊', label: 'Reports', path: '/reports', roles: ['admin', 'finance'] },
  { icon: '⚙️', label: 'Settings', path: '/settings' },
]

export function MainLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const currentUser = profile

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true
    if (!currentUser?.role) return false
    return item.roles.includes(currentUser.role as any)
  })

  const getDashboardTitle = () => {
    switch (currentUser?.role) {
      case 'admin': return 'School Admin'
      case 'teacher': return 'Teacher Dashboard'
      case 'student': return 'Student Portal'
      case 'finance': return 'Finance & HR'
      default: return 'School Admin'
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Global Countryside Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <svg viewBox="0 0 1200 700" className="w-full h-full" preserveAspectRatio="xMidYMax slice">
          <defs>
            <linearGradient id="globalSky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E8F5E9" />
              <stop offset="100%" stopColor="#C8E6C9" />
            </linearGradient>
          </defs>
          <rect fill="url(#globalSky)" width="1200" height="700" />
          
          {/* Hills - back */}
          <ellipse cx="200" cy="650" rx="400" ry="200" fill="#81C784" />
          <ellipse cx="600" cy="680" rx="500" ry="180" fill="#66BB6A" />
          <ellipse cx="1000" cy="650" rx="400" ry="200" fill="#81C784" />
          
          {/* Hills - front */}
          <ellipse cx="100" cy="720" rx="350" ry="150" fill="#4CAF50" />
          <ellipse cx="500" cy="750" rx="400" ry="130" fill="#43A047" />
          <ellipse cx="900" cy="720" rx="450" ry="160" fill="#4CAF50" />
          
          {/* House */}
          <g transform="translate(60, 420)">
            <rect x="0" y="40" width="100" height="80" fill="#9C27B0" />
            <polygon points="0,40 50,-20 100,40" fill="#7B1FA2" />
            <rect x="35" y="70" width="30" height="50" fill="#4A148C" />
            <rect x="10" y="55" width="20" height="25" fill="#E1BEE7" />
            <rect x="70" y="55" width="20" height="25" fill="#E1BEE7" />
            <rect x="85" y="0" width="8" height="50" fill="#5D4037" />
            <polygon points="93,0 93,20 115,10" fill="#FF5722" />
          </g>
          
          {/* Large pencil left */}
          <g transform="translate(170, 380) rotate(15)">
            <rect x="0" y="0" width="25" height="150" fill="#FFC107" />
            <polygon points="0,150 12.5,180 25,150" fill="#FFE082" />
            <rect x="0" y="0" width="25" height="20" fill="#F48FB1" />
          </g>
          
          {/* Small pencil */}
          <g transform="translate(220, 450) rotate(-10)">
            <rect x="0" y="0" width="15" height="80" fill="#4CAF50" />
            <polygon points="0,80 7.5,100 15,80" fill="#A5D6A7" />
            <rect x="0" y="0" width="15" height="12" fill="#EF5350" />
          </g>
          
          {/* Trees right side */}
          <g transform="translate(950, 400)">
            <rect x="20" y="50" width="20" height="60" fill="#5D4037" />
            <circle cx="30" cy="30" r="50" fill="#2E7D32" />
          </g>
          
          {/* Bushes */}
          <circle cx="50" cy="580" r="30" fill="#388E3C" />
          <circle cx="80" cy="590" r="25" fill="#43A047" />
          <circle cx="1100" cy="570" r="35" fill="#388E3C" />
          <circle cx="1140" cy="580" r="28" fill="#43A047" />
          
          {/* Flowers */}
          <circle cx="100" cy="560" r="5" fill="#FFEB3B" />
          <circle cx="130" cy="570" r="4" fill="#FFFFFF" />
          <circle cx="160" cy="555" r="5" fill="#FFEB3B" />
          <circle cx="1050" cy="560" r="4" fill="#FFFFFF" />
          <circle cx="1080" cy="550" r="5" fill="#FFEB3B" />
        </svg>
      </div>

      {/* Fox Character */}
      <div className="fixed bottom-8 right-24 text-7xl z-50 animate-bounce pointer-events-none" style={{ animationDuration: '3s' }}>
        🦊
      </div>

      {/* Left Sidebar - Matching Design */}
      <aside className="w-48 bg-white/95 backdrop-blur-sm flex flex-col shadow-lg relative z-10" style={{ minHeight: '100vh' }}>
        {/* Logo Header */}
        <div className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-lg" style={{ backgroundColor: '#5B8C51' }}>
              😊
            </div>
            <span className="font-bold text-gray-800 text-sm">{getDashboardTitle()}</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-2 py-2">
          {filteredMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all rounded-lg mb-0.5 ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
              style={({ isActive }) => isActive ? { backgroundColor: '#5B8C51' } : {}}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
              <img 
                src={currentUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.full_name || 'user'}`} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{currentUser?.full_name || 'User'}</p>
              <p className="text-xs text-gray-500 capitalize">{currentUser?.role || 'Guest'}</p>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 text-gray-500 text-xs px-2 py-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto relative z-10">
        <Outlet />
      </div>
    </div>
  )
}
