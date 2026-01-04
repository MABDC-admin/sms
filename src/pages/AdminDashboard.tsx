import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { AcademicYear } from '../types'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { useSchoolYear } from '../contexts/SchoolYearContext'
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription'

// Counting animation hook
function useCountAnimation(endValue: number, duration: number = 1500) {
  const [count, setCount] = useState(0)
  const countRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (endValue === 0) {
      setCount(0)
      return
    }
    countRef.current = 0
    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const progress = timestamp - startTimeRef.current
      const percentage = Math.min(progress / duration, 1)
      const easeOutQuart = 1 - Math.pow(1 - percentage, 4)
      const currentCount = Math.floor(easeOutQuart * endValue)
      setCount(currentCount)
      countRef.current = currentCount
      if (percentage < 1) {
        requestAnimationFrame(animate)
      } else {
        setCount(endValue)
      }
    }
    requestAnimationFrame(animate)
  }, [endValue, duration])

  return count
}

export function AdminDashboard() {
  const { profile } = useAuth()
  const { selectedYear, setSelectedYear, schoolYears } = useSchoolYear()
  const [showYearDropdown, setShowYearDropdown] = useState(false)
  const currentUser = profile
  
  const [years, setYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [studentCount, setStudentCount] = useState(0)
  const [maleCount, setMaleCount] = useState(0)
  const [femaleCount, setFemaleCount] = useState(0)
  const [classesCount, setClassesCount] = useState(0)
  const [teachersCount, setTeachersCount] = useState(0)
  const [roomsCount, setRoomsCount] = useState(0)

  const animatedStudentCount = useCountAnimation(studentCount)
  const animatedMalePercent = useCountAnimation(maleCount > 0 ? Math.round(maleCount / (maleCount + femaleCount) * 100) : 0)
  const animatedFemalePercent = useCountAnimation(femaleCount > 0 ? Math.round(femaleCount / (maleCount + femaleCount) * 100) : 0)
  const animatedClassesCount = useCountAnimation(classesCount)
  const animatedTeachersCount = useCountAnimation(teachersCount)
  const animatedRoomsCount = useCountAnimation(roomsCount)

  // Track if initial load is done
  const initialLoadDone = useRef(false)

  // Load data function (memoized for real-time updates)
  const loadData = useCallback(async (isRealtime = false) => {
    // Only show loading on initial load, not on real-time updates
    if (!isRealtime && !initialLoadDone.current) {
      setLoading(true)
    }

    try {
      // Run all queries in PARALLEL for faster loading
      const [yearsResult, studentsResult, genderResult, classesResult, teachersResult] = await Promise.all([
        supabase.from('academic_years').select('*').order('start_date', { ascending: false }),
        supabase.from('student_records').select('*', { count: 'exact', head: true }).eq('school_year', selectedYear),
        supabase.from('student_records').select('gender').eq('school_year', selectedYear),
        supabase.from('student_records').select('level').eq('school_year', selectedYear),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher')
      ])

      // Process results
      setYears(yearsResult.data || [])
      setStudentCount(studentsResult.count || 534)

      if (genderResult.data && genderResult.data.length > 0) {
        const males = genderResult.data.filter((s: any) => 
          s.gender?.toLowerCase() === 'male' || s.gender?.toLowerCase() === 'm'
        ).length
        const females = genderResult.data.filter((s: any) => 
          s.gender?.toLowerCase() === 'female' || s.gender?.toLowerCase() === 'f'
        ).length
        setMaleCount(males || 169)
        setFemaleCount(females || 162)
      } else {
        setMaleCount(169)
        setFemaleCount(162)
      }

      if (classesResult.data && classesResult.data.length > 0) {
        const uniqueLevels = new Set(classesResult.data.map((s: any) => s.level))
        setClassesCount(uniqueLevels.size || 14)
      } else {
        setClassesCount(14)
      }

      setTeachersCount(teachersResult.count || 13)
      setRoomsCount(15)
      void years
    } finally {
      setLoading(false)
      initialLoadDone.current = true
    }
  }, [selectedYear])

  // Initial load
  useEffect(() => {
    // Reset initial load flag when selectedYear changes
    initialLoadDone.current = false
    loadData()
  }, [loadData])

  // Real-time subscriptions for live updates (pass true to skip loading state)
  const realtimeCallback = useCallback(() => loadData(true), [loadData])
  
  useRealtimeSubscription(
    [
      { table: 'student_records' },
      { table: 'profiles' },
      { table: 'academic_years' }
    ],
    realtimeCallback,
    [selectedYear]
  )

  const totalGenderCount = maleCount + femaleCount || 331
  const yearName = selectedYear || '2025-2026'

  const performanceData = [
    { name: 'High Performers', value: 62, color: '#5B8C51' },
    { name: 'Average', value: 23, color: '#C4A642' },
    { name: 'At Risk', value: 10, color: '#D4763A' },
  ]

  return (
    <div className="flex-1 relative min-h-screen overflow-hidden">
      {/* Main Content */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-flyInDown" style={{ animationDelay: '0s' }}>
          <h1 className="text-3xl font-bold text-gray-800">Welcome {currentUser?.full_name || 'Dennis Sotto'}!</h1>
          <button className="flex items-center gap-2 text-sm font-medium hover:underline" style={{ color: '#5B8C51' }}>
            Load Report <span>→</span>
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Left Column - Stats Cards */}
          <div className="col-span-3 space-y-3">
            {/* Total Enrolled Students */}
            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 animate-flyInLeft" style={{ animationDelay: '0.1s' }}>
              <p className="text-gray-500 text-sm mb-1">Total Enrolled Students</p>
              <div className="flex items-center gap-2">
                <span className="text-4xl font-bold text-gray-800">{loading ? '...' : animatedStudentCount}</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: '#5B8C51' }}>
                  Rank Increase
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-1">New Admissions</p>
            </div>

            {/* Male/Female Ratio */}
            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 animate-flyInLeft" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 text-sm">Male/Female Ratio</p>
                <div className="flex items-center gap-1 text-gray-400 text-sm">
                  <span>{totalGenderCount}</span>
                  <span>👤👤</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-bold" style={{ color: '#4A90D9' }}>{loading ? '...' : `${animatedMalePercent}%`}</span>
                  <span className="text-xl">👨</span>
                  <span className="text-xs text-gray-500">Male</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-bold" style={{ color: '#E8A838' }}>{loading ? '...' : `${animatedFemalePercent}%`}</span>
                  <span className="text-xl">😊</span>
                  <span className="text-xs text-gray-500">Female</span>
                </div>
              </div>
            </div>

            {/* Active Classes */}
            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between animate-flyInLeft" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">📚</span>
                <span className="text-gray-600 text-sm font-medium">Active Classes</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-gray-800">{loading ? '...' : animatedClassesCount}</span>
                <span className="text-gray-400">›</span>
              </div>
            </div>

            {/* Active Teachers */}
            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between animate-flyInLeft" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">👨‍🏫</span>
                <span className="text-gray-600 text-sm font-medium">Active Teachers</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-gray-800">{loading ? '...' : animatedTeachersCount}</span>
                <span className="text-gray-400">›</span>
              </div>
            </div>

            {/* Available Rooms */}
            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between animate-flyInLeft" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚪</span>
                <span className="text-gray-600 text-sm font-medium">Available Rooms</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-gray-800">{loading ? '...' : animatedRoomsCount}</span>
                <span className="text-gray-400">›</span>
              </div>
            </div>
          </div>

          {/* Center Column - Performance Overview */}
          <div className="col-span-5">
            <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 h-full animate-scaleIn" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Student Performance</h2>
                  <p className="text-gray-500 text-sm">Overview</p>
                </div>
                {/* Academic Year Dropdown */}
                <div className="text-right relative">
                  <p className="text-xs text-gray-400">Academic Year</p>
                  <button
                    onClick={() => setShowYearDropdown(!showYearDropdown)}
                    className="text-xl font-bold flex items-center gap-1"
                    style={{ color: '#5B8C51' }}
                  >
                    {yearName} <span className="text-sm">🌿 ▼</span>
                  </button>
                  {showYearDropdown && (
                    <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border z-50 min-w-[130px]">
                      {schoolYears.map((year) => (
                        <button
                          key={year}
                          onClick={() => { setSelectedYear(year); setShowYearDropdown(false); }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                            selectedYear === year ? 'text-green-600 font-medium bg-green-50' : 'text-gray-700'
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Donut Chart */}
              <div className="relative h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={performanceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {performanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold" style={{ color: '#5B8C51' }}>62%</p>
                    <p className="text-xs text-gray-500">High Performers</p>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#C4A642' }}></div>
                  <span className="text-xs text-gray-600">23% Average</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#D4763A' }}></div>
                  <span className="text-xs text-gray-600">10% At Risk</span>
                </div>
              </div>

              {/* Bottom Cards Row */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {/* Tasks Today */}
                <div className="bg-gray-50 rounded-xl p-3">
                  <h3 className="font-bold text-gray-800 text-sm mb-2">Tasks Today</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📋</span>
                        <span className="text-xs text-gray-600">Check Behavior<br/>Incidents</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-xs font-bold">5</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📚</span>
                        <span className="text-xs text-gray-600">Review Late<br/>Homework</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-xs font-bold">18</span>
                    </div>
                  </div>
                </div>

                {/* Attendance */}
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-800 text-sm">Attendance</h3>
                    <span className="text-lg">📊</span>
                  </div>
                  <div className="flex gap-1 mb-2">
                    <span className="text-xl">😊</span>
                    <span className="text-xl">😄</span>
                    <span className="text-xl">😢</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-600">5 New</span>
                    <span className="text-gray-400">▼</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-4 space-y-3">
            {/* Completion Rate */}
            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-3 animate-flyInRight" style={{ animationDelay: '0.3s' }}>
              <span className="text-4xl">🦉</span>
              <div className="flex-1">
                <p className="text-gray-500 text-xs">Completion Rate</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full animate-progressBar" style={{ width: '72%', backgroundColor: '#5B8C51' }}></div>
                  </div>
                  <span className="text-lg font-bold" style={{ color: '#5B8C51' }}>72%</span>
                </div>
              </div>
            </div>

            {/* Course Progress */}
            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-3 animate-flyInRight" style={{ animationDelay: '0.4s' }}>
              <span className="text-4xl">🐧</span>
              <div className="flex-1">
                <p className="text-gray-500 text-xs">Course Progress</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full animate-progressBar" style={{ width: '72%', backgroundColor: '#5B8C51' }}></div>
                  </div>
                  <span className="text-lg font-bold" style={{ color: '#5B8C51' }}>72%</span>
                </div>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 animate-flyInRight" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 text-sm">Upcoming Events</h3>
                <div className="flex gap-0.5">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  <span className="w-2 h-2 rounded-full bg-green-300"></span>
                  <span className="w-2 h-2 rounded-full bg-green-200"></span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 hover:bg-gray-100 transition-colors">
                  <span className="text-xl">🔬</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Science Fair</p>
                    <p className="text-xs text-gray-500">April 18</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 hover:bg-gray-100 transition-colors">
                  <span className="text-xl">⚽</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Sports Day</p>
                    <p className="text-xs text-gray-500">April 25</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 animate-flyInRight" style={{ animationDelay: '0.6s' }}>
              <h3 className="font-bold text-gray-800 text-sm mb-3">Messages</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 hover:bg-gray-100 transition-colors">
                  <span className="text-lg">✉️</span>
                  <span className="text-sm text-gray-700">Meeting at 3 PM</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 hover:bg-gray-100 transition-colors">
                  <span className="text-lg">👨‍💼</span>
                  <span className="text-sm text-gray-700">Grades Updated</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - 3 New Widgets */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          {/* Birthday Widget */}
          <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 animate-flyInUp" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">🎂 Birthdays This Week</h3>
              <span className="text-xs text-gray-400 hover:text-green-500 cursor-pointer">View All</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 bg-orange-50 rounded-xl border-l-4 border-orange-400 hover:shadow-sm transition-shadow">
                <span className="text-3xl animate-bounce" style={{ animationDuration: '2s' }}>🎉</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Maria Santos</p>
                  <p className="text-xs text-gray-500">Student • Grade 3</p>
                </div>
                <span className="text-xs font-bold text-orange-500 animate-pulse">Today!</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded-xl border-l-4 border-yellow-400 hover:shadow-sm transition-shadow">
                <span className="text-3xl">🎈</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">John Cruz</p>
                  <p className="text-xs text-gray-500">Teacher • Math</p>
                </div>
                <span className="text-xs font-bold text-yellow-600">Tomorrow</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-xl border-l-4 border-blue-400 hover:shadow-sm transition-shadow">
                <span className="text-3xl">🎁</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Ana Reyes</p>
                  <p className="text-xs text-gray-500">Student • Kinder 2</p>
                </div>
                <span className="text-xs font-bold text-blue-500">In 3 days</span>
              </div>
            </div>
          </div>

          {/* Announcements Widget */}
          <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 animate-flyInUp" style={{ animationDelay: '0.7s' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">📢 Announcements</h3>
              <button className="text-xs px-2 py-1 rounded-full text-white hover:opacity-80 transition-opacity" style={{ backgroundColor: '#5B8C51' }}>+ New</button>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-red-50 rounded-xl border-l-4 border-red-500 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">Urgent</span>
                  <span className="text-xs text-gray-400">2 hours ago</span>
                </div>
                <p className="text-sm font-medium text-gray-800">Early Dismissal on Friday</p>
                <p className="text-xs text-gray-500">All students will be dismissed at 12:00 PM</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border-l-4 border-blue-500 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">Info</span>
                  <span className="text-xs text-gray-400">Yesterday</span>
                </div>
                <p className="text-sm font-medium text-gray-800">Parent-Teacher Conference</p>
                <p className="text-xs text-gray-500">Schedule available on portal</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl border-l-4 border-green-500 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">New</span>
                  <span className="text-xs text-gray-400">3 days ago</span>
                </div>
                <p className="text-sm font-medium text-gray-800">Library Hours Extended</p>
                <p className="text-xs text-gray-500">Now open until 6:00 PM</p>
              </div>
            </div>
          </div>

          {/* School Activity Widget */}
          <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 animate-flyInUp" style={{ animationDelay: '0.8s' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">🏫 School Activities</h3>
              <span className="text-xs text-gray-400">This Month</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 bg-purple-50 rounded-xl hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: '#E1BEE7' }}>🎭</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">Drama Club Performance</p>
                  <p className="text-xs text-gray-500">Jan 15 • Auditorium</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-600">Ongoing</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-cyan-50 rounded-xl hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: '#B2EBF2' }}>🏀</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">Basketball Tournament</p>
                  <p className="text-xs text-gray-500">Jan 20 • Sports Complex</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-cyan-100 text-cyan-600">Upcoming</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-amber-50 rounded-xl hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: '#FFE082' }}>🎨</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">Art Exhibition</p>
                  <p className="text-xs text-gray-500">Jan 25 • Main Hall</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-600">Upcoming</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-pink-50 rounded-xl hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: '#F8BBD9' }}>🎵</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">Music Festival</p>
                  <p className="text-xs text-gray-500">Jan 30 • Open Grounds</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-pink-100 text-pink-600">Upcoming</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes flyInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes flyInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes flyInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes flyInDown {
          from {
            opacity: 0;
            transform: translateY(-40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes progressBar {
          from {
            width: 0%;
          }
        }
        
        .animate-flyInLeft {
          animation: flyInLeft 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          opacity: 0;
        }
        
        .animate-flyInRight {
          animation: flyInRight 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          opacity: 0;
        }
        
        .animate-flyInUp {
          animation: flyInUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          opacity: 0;
        }
        
        .animate-flyInDown {
          animation: flyInDown 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          opacity: 0;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          opacity: 0;
        }
        
        .animate-slideUp {
          animation: slideUp 0.5s ease-out forwards;
          opacity: 0;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .animate-progressBar {
          animation: progressBar 1s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
