import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription'

interface ClassItem {
  id: string
  subject_name: string
  color: string
  section: { name: string } | null
  teacher: { full_name: string } | null
  student_count: number
}

export function ClassesListPage() {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Load classes function (memoized for real-time updates)
  const loadClasses = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('classes')
      .select(`
        id,
        subject_name,
        color,
        section:sections (name),
        teacher:profiles!teacher_id (full_name)
      `)
      .order('subject_name')

    if (data) {
      // Get student counts
      const classesWithCounts = await Promise.all(
        data.map(async (cls: any) => {
          const { count } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', cls.id)

          return {
            id: cls.id,
            subject_name: cls.subject_name,
            color: cls.color,
            section: cls.section,
            teacher: cls.teacher,
            student_count: count || 0
          }
        })
      )
      setClasses(classesWithCounts)
    }
    setLoading(false)
  }, [])

  // Initial load
  useEffect(() => {
    loadClasses()
  }, [loadClasses])

  // Real-time subscriptions for live updates
  useRealtimeSubscription(
    [
      { table: 'classes' },
      { table: 'enrollments' }
    ],
    loadClasses,
    []
  )

  const filteredClasses = classes.filter(c =>
    c.subject_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this class?')) return
    await supabase.from('classes').delete().eq('id', id)
    loadClasses()
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Classes</h1>
          <p className="text-gray-500">Manage all class sections</p>
        </div>
        <Link
          to="/classes/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium"
          style={{ backgroundColor: '#5B8C51' }}
        >
          <span>+</span> Add Class
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-4 p-8 text-center text-gray-500">Loading...</div>
        ) : filteredClasses.length === 0 ? (
          <div className="col-span-4 p-8 text-center text-gray-500">No classes found</div>
        ) : (
          filteredClasses.map((cls) => (
            <div key={cls.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div 
                className="h-3"
                style={{ backgroundColor: cls.color || '#5B8C51' }}
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{cls.subject_name}</h3>
                <p className="text-sm text-gray-500 mb-3">{cls.section?.name || 'No Section'}</p>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <span>👨‍🏫</span> {cls.teacher?.full_name || 'No Teacher'}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👥</span> {cls.student_count} Students
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Link
                    to={`/classes/${cls.id}/edit`}
                    className="flex-1 text-center px-3 py-2 rounded-lg text-sm hover:bg-gray-100"
                    style={{ color: '#5B8C51' }}
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(cls.id)}
                    className="flex-1 text-center px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
