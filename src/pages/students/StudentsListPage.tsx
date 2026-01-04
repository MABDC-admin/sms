import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useSchoolYear } from '../../contexts/SchoolYearContext'
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription'

interface Student {
  id: string
  student_id: string
  full_name: string
  birthdate: string
  email: string
  password: string
  grade_level: string
  avatar_url: string
  gender?: string
  lrn?: string
}

const gradeColors: { [key: string]: string } = {
  'Kindergarten': 'linear-gradient(135deg, #E8D5B7 0%, #F5E6D3 50%, #E8D5B7 100%)',
  'Grade 1': 'linear-gradient(135deg, #F4D03F 0%, #F7DC6F 50%, #FDEBD0 100%)',
  'Grade 2': 'linear-gradient(135deg, #F8A5C2 0%, #FDCBDF 50%, #F8A5C2 100%)',
  'Grade 3': 'linear-gradient(135deg, #A8E6CF 0%, #DCEDC1 50%, #A8E6CF 100%)',
  'Grade 4': 'linear-gradient(135deg, #F4D03F 0%, #F7DC6F 50%, #F4D03F 100%)',
  'Grade 5': 'linear-gradient(135deg, #87CEEB 0%, #B0E0E6 50%, #87CEEB 100%)',
  'Grade 6': 'linear-gradient(135deg, #F8A5C2 0%, #FFC1CC 50%, #F8A5C2 100%)',
  'Grade 7': 'linear-gradient(135deg, #DDA0DD 0%, #E8C0E8 50%, #DDA0DD 100%)',
  'Grade 8': 'linear-gradient(135deg, #DDA0DD 0%, #E6D0E6 50%, #DDA0DD 100%)',
  'Grade 9': 'linear-gradient(135deg, #87CEEB 0%, #ADD8E6 50%, #87CEEB 100%)',
  'Grade 10': 'linear-gradient(135deg, #F8A5C2 0%, #FDCBDF 50%, #F8A5C2 100%)',
  'Grade 11': 'linear-gradient(135deg, #98D8C8 0%, #C1E8DC 50%, #98D8C8 100%)',
  'Grade 12': 'linear-gradient(135deg, #B8A9C9 0%, #D4C8E0 50%, #B8A9C9 100%)',
}

const gradeLevels = [
  'All Grades', 'Kinder 1', 'Kinder 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 
  'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
]

export function StudentsListPage() {
  const { selectedYear } = useSchoolYear()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGrade, setSelectedGrade] = useState('All Grades')
  const [showModal, setShowModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    birthdate: '',
    email: '',
    password: '',
    grade_level: 'Kindergarten',
    avatar_url: '',
    avatar_preview: ''
  })

  // Load students function (memoized for real-time updates)
  const loadStudents = useCallback(async () => {
    setLoading(true)
    
    // First try to fetch from student_records table (real data)
    const { data: records } = await supabase
      .from('student_records')
      .select('*')
      .eq('school_year', selectedYear)
      .order('student_name')

    if (records && records.length > 0) {
      const formattedStudents: Student[] = records.map((row: any) => {
        // Keep original level from CSV
        const gradeLevel = row.level || 'Grade 1'
        
        return {
          id: row.id,
          student_id: row.lrn || '',
          full_name: row.student_name || '',
          birthdate: row.birth_date || '',
          email: `${(row.student_name || 'student').toLowerCase().replace(/[^a-z]/g, '').slice(0, 10)}@school.com`,
          password: '********',
          grade_level: gradeLevel,
          avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(row.student_name || 'default')}&backgroundColor=transparent`,
          gender: row.gender || '',
          lrn: row.lrn || ''
        }
      })
      setStudents(formattedStudents)
    } else {
      // Fallback: try profiles table
      const { data } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          avatar_url,
          students!inner (
            student_id,
            grade_level:grade_levels (name)
          )
        `)
        .eq('role', 'student')
        .order('full_name')

      if (data && data.length > 0) {
        const formattedStudents = data.map((item: any) => ({
          id: item.id,
          student_id: item.students?.[0]?.student_id || '',
          full_name: item.full_name,
          birthdate: item.date_of_birth || '2010-01-01',
          email: item.email || '',
          password: '********',
          grade_level: item.students?.[0]?.grade_level?.name || 'Grade 1',
          avatar_url: item.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${item.full_name}&backgroundColor=transparent`
        }))
        setStudents(formattedStudents)
      } else {
        // No data available
        setStudents([])
      }
    }
    setLoading(false)
  }, [selectedYear])

  // Initial load
  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  // Real-time subscription for live updates
  useRealtimeSubscription(
    { table: 'student_records' },
    loadStudents,
    [selectedYear]
  )

  const filteredStudents = selectedGrade === 'All Grades' 
    ? students 
    : students.filter(s => s.grade_level === selectedGrade)

  function openCreateModal() {
    setEditingStudent(null)
    setFormData({
      full_name: '',
      birthdate: '',
      email: '',
      password: '',
      grade_level: 'Kinder 1',
      avatar_url: '',
      avatar_preview: ''
    })
    setShowModal(true)
  }

  function openEditModal(student: Student) {
    setEditingStudent(student)
    setFormData({
      full_name: student.full_name,
      birthdate: student.birthdate,
      email: student.email,
      password: '',
      grade_level: student.grade_level,
      avatar_url: student.avatar_url,
      avatar_preview: student.avatar_url
    })
    setShowModal(true)
  }

  function calculateAge(birthdate: string): number {
    if (!birthdate) return 0
    const today = new Date()
    const birth = new Date(birthdate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({
          ...formData,
          avatar_url: reader.result as string,
          avatar_preview: reader.result as string
        })
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleSave() {
    if (!formData.full_name || !formData.birthdate || !formData.email) return
    if (!editingStudent && !formData.password) return

    const avatarUrl = formData.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${formData.full_name}&backgroundColor=transparent`

    if (editingStudent) {
      // Update in Supabase
      const { error } = await supabase
        .from('student_records')
        .update({
          student_name: formData.full_name,
          birth_date: formData.birthdate,
          level: formData.grade_level
        })
        .eq('id', editingStudent.id)

      if (error) {
        console.error('Error updating student:', error)
        alert('Failed to update student')
        return
      }

      // Update local state
      setStudents(students.map(s => 
        s.id === editingStudent.id 
          ? {
              ...s,
              full_name: formData.full_name,
              birthdate: formData.birthdate,
              email: formData.email,
              password: formData.password || s.password,
              grade_level: formData.grade_level,
              avatar_url: avatarUrl
            }
          : s
      ))
    } else {
      // Insert new student to Supabase
      const { data: newRecord, error } = await supabase
        .from('student_records')
        .insert({
          student_name: formData.full_name,
          birth_date: formData.birthdate,
          level: formData.grade_level,
          school_year: selectedYear,
          status: 'Active',
          gender: '',
          lrn: `NEW-${Date.now()}`
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating student:', error)
        alert('Failed to create student')
        return
      }

      const newStudent: Student = {
        id: newRecord.id,
        student_id: newRecord.lrn || '',
        full_name: formData.full_name,
        birthdate: formData.birthdate,
        email: formData.email,
        password: formData.password,
        grade_level: formData.grade_level,
        avatar_url: avatarUrl
      }
      setStudents([...students, newStudent])
    }
    setShowModal(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this student?')) return
    
    // Delete from Supabase
    const { error } = await supabase
      .from('student_records')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting student:', error)
      alert('Failed to delete student')
      return
    }

    // Update local state
    setStudents(students.filter(s => s.id !== id))
  }

  return (
    <div className="flex-1 p-6" style={{ backgroundColor: '#F8FAF7' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">👥 Students</h1>
          <p className="text-gray-500">Manage all enrolled students</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium"
          style={{ backgroundColor: '#5B8C51' }}
        >
          + Add Student
        </button>
      </div>

      {/* Grade Filter */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gray-600 font-medium mr-2">Filter by Grade:</span>
          {gradeLevels.map((grade) => (
            <button
              key={grade}
              onClick={() => setSelectedGrade(grade)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedGrade === grade
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={selectedGrade === grade ? { backgroundColor: '#5B8C51' } : {}}
            >
              {grade}
            </button>
          ))}
        </div>
      </div>

      {/* Students Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No students found</div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {filteredStudents.map((student) => {
            const bgColor = gradeColors[student.grade_level] || gradeColors['Grade 1']
            
            return (
              <div
                key={student.id}
                className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                style={{ background: bgColor }}
              >
                {/* Card Header */}
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-white/30 overflow-hidden border-2 border-white/50">
                      <img 
                        src={student.avatar_url}
                        alt={student.full_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">{student.full_name}</h3>
                      <p className="text-sm text-gray-600">Grade: {student.grade_level.replace('Grade ', '')}</p>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-4 pb-4">
                  <div className="flex items-center gap-2 text-gray-700 text-sm mb-2">
                    <span>📧</span>
                    <span className="truncate">{student.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 text-sm mb-3">
                    <span>🎂</span>
                    <span>{calculateAge(student.birthdate)} years old</span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(student)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium bg-white/50 hover:bg-white/70 text-gray-700 transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-400/30 hover:bg-red-400/50 text-red-700 transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Stats Footer */}
      <div className="mt-6 text-sm text-gray-500">
        Showing {filteredStudents.length} of {students.length} students
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto py-8">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingStudent ? 'Edit Student' : 'Add New Student'}
            </h2>
            
            <div className="space-y-4">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-4 border-gray-100 mb-3">
                  <img 
                    src={formData.avatar_preview || `https://api.dicebear.com/7.x/adventurer/svg?seed=default&backgroundColor=transparent`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <label className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#5B8C51' }}>
                  📷 Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none"
                  placeholder="Enter student's full name"
                />
              </div>

              {/* Birthdate and Age */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birthdate</label>
                  <input
                    type="date"
                    value={formData.birthdate}
                    onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="text"
                    value={formData.birthdate ? `${calculateAge(formData.birthdate)} years old` : ''}
                    readOnly
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-600"
                    placeholder="Auto-calculated"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (for login)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none"
                  placeholder="student@school.com"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingStudent && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
              
              {/* Grade Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                <select
                  value={formData.grade_level}
                  onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none"
                >
                  {gradeLevels.slice(1).map((grade) => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-3 rounded-xl text-white font-medium"
                style={{ backgroundColor: '#5B8C51' }}
              >
                {editingStudent ? 'Update' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
