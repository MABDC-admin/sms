import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { StudentKpis } from '../types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { useAuth } from '../contexts/AuthContext'

export function StudentDashboard() {
  const { profile } = useAuth()
  
  // Check for demo user
  const demoUserStr = localStorage.getItem('demo_user')
  const demoUser = demoUserStr ? JSON.parse(demoUserStr) : null
  const currentUser = profile || demoUser
  
  const [kpis, setKpis] = useState<StudentKpis | null>(null)
  const [loading, setLoading] = useState(true)
  const [gradeData, setGradeData] = useState<any[]>([])
  const [assignmentsDue, setAssignmentsDue] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      if (!currentUser?.id) return
      setLoading(true)
      
      try {
        // Load KPIs
        const { data: kpiData } = await supabase.from('v_student_kpis_year').select('*').maybeSingle()
        setKpis(kpiData as StudentKpis | null)
        
        // Load Grades
        const { data: grades } = await supabase
          .from('grades')
          .select('label, value, classes(subject_name)')
          .eq('student_id', currentUser.id)
          .limit(10)
        
        if (grades) {
          const formattedGrades = grades.map((g: any) => ({
            name: g.classes?.subject_name?.substring(0, 4) || g.label,
            value: g.value
          }))
          setGradeData(formattedGrades)
        }

        // Load Assignments
        const { data: enrollments } = await supabase
          .from('class_students')
          .select('class_id')
          .eq('student_id', currentUser.id)
        
        const classIds = enrollments?.map(e => e.class_id) || []
        
        if (classIds.length > 0) {
          const { data: assignments } = await supabase
            .from('assignments')
            .select('title, due_at, classes(subject_name)')
            .in('class_id', classIds)
            .gte('due_at', new Date().toISOString())
            .order('due_at', { ascending: true })
            .limit(5)
            
          if (assignments) {
            setAssignmentsDue(assignments.map((a: any) => ({
              title: a.title,
              subtitle: a.classes?.subject_name,
              date: new Date(a.due_at).toLocaleDateString(),
              days: Math.ceil((new Date(a.due_at).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) + ' days'
            })))
          }

          const { data: anns } = await supabase
            .from('announcements')
            .select('title, content, published_at')
            .in('class_id', classIds)
            .order('published_at', { ascending: false })
            .limit(4)
            
          if (anns) {
            setAnnouncements(anns.map((a: any) => ({
              title: a.title,
              subtitle: a.content.substring(0, 30) + '...',
              date: new Date(a.published_at).toLocaleDateString(),
              time: new Date(a.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            })))
          }
        }
      } catch (err) {
        console.error("Error loading student dashboard data:", err)
      }

      setLoading(false)
    }
    loadData()
  }, [currentUser?.id])

  return (
    <div className="flex-1 p-6" style={{ backgroundColor: '#F8FAF7' }}>
      {/* Welcome Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Welcome Back, {currentUser?.full_name || 'Student'}!</h1>
        <div className="flex items-center gap-4">
          <button className="p-2 border border-gray-300 rounded-lg text-gray-500">☐</button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2" style={{ borderColor: '#5B8C51', color: '#5B8C51' }}>
            Load Report <span>→</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8F5E3' }}>
            <span className="text-xl" style={{ color: '#5B8C51' }}>📚</span>
          </div>
          <div>
            <p className="text-sm text-gray-600">Subjects Enrolled</p>
            <p className="text-xs text-gray-400">Active courses</p>
          </div>
          <p className="text-4xl font-bold text-gray-800 ml-auto">{loading ? '...' : (kpis?.enrolled_subjects || 0)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8F5E3' }}>
            <span className="text-xl" style={{ color: '#5B8C51' }}>📅</span>
          </div>
          <div>
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-xs text-gray-400">Due today</p>
          </div>
          <p className="text-4xl font-bold text-gray-800 ml-auto">{assignmentsDue.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8F5E3' }}>
            <span className="text-xl" style={{ color: '#5B8C51' }}>✅</span>
          </div>
          <div>
            <p className="text-sm text-gray-600">Assignments</p>
            <p className="text-xs text-gray-400">Completed</p>
          </div>
          <p className="text-4xl font-bold ml-auto" style={{ color: '#5B8C51' }}>89%</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8F5E3' }}>
            <span className="text-xl" style={{ color: '#5B8C51' }}>👤</span>
          </div>
          <div>
            <p className="text-sm text-gray-600">Attendance</p>
            <p className="text-xs text-gray-400">This month</p>
          </div>
          <p className="text-4xl font-bold ml-auto" style={{ color: '#5B8C51' }}>{(kpis as any)?.attendance_rate ? Math.round((kpis as any).attendance_rate) : 100}%</p>
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        <div className="col-span-8 bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Grade Progress Per Subject</h3>
          </div>
          {gradeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={gradeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={[0, 100]} ticks={[50, 75, 100]} tickFormatter={(v) => `${v}%`} />
                <Line type="monotone" dataKey="value" stroke="#5B8C51" strokeWidth={2} dot={{ fill: '#5B8C51', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400">No grade data available</div>
          )}
        </div>

        <div className="col-span-4 bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Deadlines</h3>
          <div className="space-y-4">
            {assignmentsDue.length > 0 ? assignmentsDue.map((assignment, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E8F5E3' }}>
                  <span className="text-sm" style={{ color: '#5B8C51' }}>📝</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 truncate" title={assignment.title}>{assignment.title}</p>
                  <p className="text-xs text-gray-500">{assignment.subtitle || 'General'} • {assignment.days}</p>
                </div>
              </div>
            )) : (
               <div className="text-sm text-gray-400 mt-8 text-center">No upcoming deadlines</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recent Announcements</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {announcements.length > 0 ? announcements.map((ann, index) => (
              <div key={index} className="p-3 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E8F5E3' }}>
                    <span className="text-xs" style={{ color: '#5B8C51' }}>📢</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate" title={ann.title}>{ann.title}</p>
                  <p className="text-xs text-gray-500 ml-auto whitespace-nowrap">{ann.date}</p>
                </div>
                <p className="text-xs text-gray-500 ml-8 truncate">{ann.subtitle}</p>
                <p className="text-xs text-gray-400 ml-8">{ann.time}</p>
              </div>
            )) : (
              <div className="col-span-2 text-sm text-gray-400 py-4 text-center">No recent announcements</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
