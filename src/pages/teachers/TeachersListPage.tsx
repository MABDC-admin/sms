import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription'

interface Teacher {
  id: string
  full_name: string
  email: string
  password: string
  avatar_url: string
  assigned_levels: string[]
  assigned_subjects: string[]
}

const gradeColors: { [key: string]: string } = {
  'Kindergarten 1': 'linear-gradient(135deg, #E8D5B7 0%, #F5E6D3 50%, #E8D5B7 100%)',
  'Kindergarten 2': 'linear-gradient(135deg, #F5E1C8 0%, #FAF0E6 50%, #F5E1C8 100%)',
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

const gradeLevels = ['Kindergarten 1', 'Kindergarten 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']

const subjects = ['English', 'Mathematics', 'Science', 'Filipino', 'Social Studies', 'MAPEH', 'TLE', 'Values Education']

// Demo teachers - 1 per grade level
const demoTeachers: Teacher[] = [
  { id: '1', full_name: 'Sarah Mitchell', email: 'sarah.mitchell@school.com', password: 'teacher123', assigned_levels: ['Kindergarten 1'], assigned_subjects: ['English', 'Mathematics'], avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah&backgroundColor=transparent' },
  { id: '2', full_name: 'Michael Thompson', email: 'michael.thompson@school.com', password: 'teacher123', assigned_levels: ['Kindergarten 2'], assigned_subjects: ['English', 'Science'], avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Michael&backgroundColor=transparent' },
  { id: '3', full_name: 'Jennifer Garcia', email: 'jennifer.garcia@school.com', password: 'teacher123', assigned_levels: ['Grade 1'], assigned_subjects: ['Mathematics', 'Filipino'], avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jennifer&backgroundColor=transparent' },
  { id: '4', full_name: 'David Martinez', email: 'david.martinez@school.com', password: 'teacher123', assigned_levels: ['Grade 2'], assigned_subjects: ['Science', 'Social Studies'], avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=David&backgroundColor=transparent' },
  { id: '5', full_name: 'Emily Rodriguez', email: 'emily.rodriguez@school.com', password: 'teacher123', assigned_levels: ['Grade 3'], assigned_subjects: ['English', 'MAPEH'], avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Emily&backgroundColor=transparent' },
  { id: '6', full_name: 'James Wilson', email: 'james.wilson@school.com', password: 'teacher123', assigned_levels: ['Grade 4'], assigned_subjects: ['Mathematics', 'TLE'], avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=James&backgroundColor=transparent' },
  { id: '7', full_name: 'Amanda Brown', email: 'amanda.brown@school.com', password: 'teacher123', assigned_levels: ['Grade 5'], assigned_subjects: ['Science', 'Values Education'], avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Amanda&backgroundColor=transparent' },
  { id: '8', full_name: 'Robert Davis', email: 'robert.davis@school.com', password: 'teacher123', assigned_levels: ['Grade 6'], assigned_subjects: ['Filipino', 'Social Studies'], avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Robert&backgroundColor=transparent' },
  { id: '9', full_name: 'Jessica Lee', email: 'jessica.lee@school.com', password: 'teacher123', assigned_levels: ['Grade 7'], assigned_subjects: ['English', 'Mathematics'], avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jessica&backgroundColor=transparent' },
  { id: '10', full_name: 'Christopher Clark', email: 'christopher.clark@school.com', password: 'teacher123', assigned_levels: ['Grade 8'], assigned_subjects: ['Science', 'MAPEH'], avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Christopher&backgroundColor=transparent' },
  { id: '11', full_name: 'Ashley White', email: 'ashley.white@school.com', password: 'teacher123', assigned_levels: ['Grade 9'], assigned_subjects: ['Mathematics', 'TLE'], avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ashley&backgroundColor=transparent' },
  { id: '12', full_name: 'Daniel Harris', email: 'daniel.harris@school.com', password: 'teacher123', assigned_levels: ['Grade 10'], assigned_subjects: ['English', 'Filipino'], avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Daniel&backgroundColor=transparent' },
  { id: '13', full_name: 'Michelle Anderson', email: 'michelle.anderson@school.com', password: 'teacher123', assigned_levels: ['Grade 11'], assigned_subjects: ['Science', 'Values Education'], avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Michelle&backgroundColor=transparent' },
  { id: '14', full_name: 'Kevin Johnson', email: 'kevin.johnson@school.com', password: 'teacher123', assigned_levels: ['Grade 12'], assigned_subjects: ['Mathematics', 'Science'], avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kevin&backgroundColor=transparent' },
]

export function TeachersListPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLevel, setSelectedLevel] = useState('All Levels')
  const [showModal, setShowModal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    assigned_levels: [] as string[],
    assigned_subjects: [] as string[]
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load teachers function (memoized for real-time updates)
  const loadTeachers = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        avatar_url,
        teachers (
          specialization
        )
      `)
      .eq('role', 'teacher')
      .order('full_name')

    if (data && data.length > 0) {
      const formattedTeachers = data.map((item: any) => ({
        id: item.id,
        full_name: item.full_name,
        email: item.email,
        password: '********',
        avatar_url: item.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${item.full_name}&backgroundColor=transparent`,
        assigned_levels: ['Grade 1'],
        assigned_subjects: ['English']
      }))
      setTeachers(formattedTeachers)
    } else {
      setTeachers(demoTeachers)
    }
    setLoading(false)
  }, [])

  // Initial load
  useEffect(() => {
    loadTeachers()
  }, [loadTeachers])

  // Real-time subscription for live updates
  useRealtimeSubscription(
    { table: 'profiles', filter: 'role=eq.teacher' },
    loadTeachers,
    []
  )

  const filterLevels = ['All Levels', ...gradeLevels]

  const filteredTeachers = selectedLevel === 'All Levels'
    ? teachers
    : teachers.filter(t => t.assigned_levels.includes(selectedLevel))

  function openCreateModal() {
    setEditingTeacher(null)
    setFormData({ full_name: '', email: '', password: '', assigned_levels: [], assigned_subjects: [] })
    setAvatarFile(null)
    setAvatarPreview(null)
    setShowModal(true)
  }

  function openEditModal(teacher: Teacher) {
    setEditingTeacher(teacher)
    setFormData({
      full_name: teacher.full_name,
      email: teacher.email,
      password: '',
      assigned_levels: teacher.assigned_levels,
      assigned_subjects: teacher.assigned_subjects
    })
    setAvatarFile(null)
    setAvatarPreview(teacher.avatar_url)
    setShowModal(true)
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function uploadAvatar(teacherId: string): Promise<string | null> {
    if (!avatarFile) return null

    try {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${teacherId}-${Date.now()}.${fileExt}`
      const filePath = `teacher-avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return null
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (err) {
      console.error('Avatar upload failed:', err)
      return null
    }
  }

  function toggleLevel(level: string) {
    if (formData.assigned_levels.includes(level)) {
      setFormData({ ...formData, assigned_levels: formData.assigned_levels.filter(l => l !== level) })
    } else {
      setFormData({ ...formData, assigned_levels: [...formData.assigned_levels, level] })
    }
  }

  function toggleSubject(subject: string) {
    if (formData.assigned_subjects.includes(subject)) {
      setFormData({ ...formData, assigned_subjects: formData.assigned_subjects.filter(s => s !== subject) })
    } else {
      setFormData({ ...formData, assigned_subjects: [...formData.assigned_subjects, subject] })
    }
  }

  async function handleSave() {
    if (!formData.full_name || !formData.email) return
    if (!editingTeacher && !formData.password) return

    setUploading(true)

    if (editingTeacher) {
      // Upload avatar if a new file was selected
      let newAvatarUrl = editingTeacher.avatar_url
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(editingTeacher.id)
        if (uploadedUrl) newAvatarUrl = uploadedUrl
      }

      // Update in database if it exists
      await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          email: formData.email,
          avatar_url: newAvatarUrl
        })
        .eq('id', editingTeacher.id)

      setTeachers(teachers.map(t =>
        t.id === editingTeacher.id
          ? {
              ...t,
              full_name: formData.full_name,
              email: formData.email,
              password: formData.password || t.password,
              avatar_url: newAvatarUrl,
              assigned_levels: formData.assigned_levels,
              assigned_subjects: formData.assigned_subjects
            }
          : t
      ))
    } else {
      const newId = Date.now().toString()
      let newAvatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${formData.full_name}&backgroundColor=transparent`
      
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(newId)
        if (uploadedUrl) newAvatarUrl = uploadedUrl
      }

      const newTeacher: Teacher = {
        id: newId,
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        avatar_url: newAvatarUrl,
        assigned_levels: formData.assigned_levels,
        assigned_subjects: formData.assigned_subjects
      }
      setTeachers([...teachers, newTeacher])
    }
    
    setUploading(false)
    setShowModal(false)
  }

  function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this teacher?')) {
      setTeachers(teachers.filter(t => t.id !== id))
    }
  }

  return (
    <div className="flex-1 p-6" style={{ backgroundColor: '#F8FAF7' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">👨‍🏫 Teachers</h1>
          <p className="text-gray-500">Manage all teaching staff</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium"
          style={{ backgroundColor: '#5B8C51' }}
        >
          + Add Teacher
        </button>
      </div>

      {/* Level Filter */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gray-600 font-medium mr-2">Filter by Level:</span>
          {filterLevels.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedLevel === level
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={selectedLevel === level ? { backgroundColor: '#5B8C51' } : {}}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Teachers Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : filteredTeachers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No teachers found</div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {filteredTeachers.map((teacher) => {
            const primaryLevel = teacher.assigned_levels[0] || 'Grade 1'
            const bgColor = gradeColors[primaryLevel] || gradeColors['Grade 1']

            return (
              <div
                key={teacher.id}
                className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                style={{ background: bgColor }}
              >
                {/* Card Header */}
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-white/30 overflow-hidden border-2 border-white/50">
                      <img
                        src={teacher.avatar_url}
                        alt={teacher.full_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">{teacher.full_name}</h3>
                      <p className="text-sm text-gray-600">{teacher.assigned_levels.join(', ')}</p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-4 pb-4">
                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex items-center gap-2 text-gray-700">
                      <span>📧</span>
                      <span className="truncate">{teacher.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <span>📚</span>
                      <span className="truncate">{teacher.assigned_subjects.join(', ')}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(teacher)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium bg-white/50 hover:bg-white/70 text-gray-700 transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(teacher.id)}
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
        Showing {filteredTeachers.length} of {teachers.length} teachers
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto py-8">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
            </h2>

            <div className="space-y-4">
              {/* Avatar Upload */}
              <div className="flex items-center gap-4">
                <div 
                  className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden cursor-pointer border-2 border-dashed border-gray-300 hover:border-green-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                      📷
                    </div>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 2MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none"
                  placeholder="Enter teacher's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none"
                  placeholder="teacher@school.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingTeacher && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Grade Levels</label>
                <div className="flex flex-wrap gap-2">
                  {gradeLevels.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => toggleLevel(level)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        formData.assigned_levels.includes(level)
                          ? 'text-white'
                          : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                      }`}
                      style={formData.assigned_levels.includes(level) ? { backgroundColor: '#5B8C51' } : {}}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Subjects</label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject) => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => toggleSubject(subject)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        formData.assigned_subjects.includes(subject)
                          ? 'text-white'
                          : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                      }`}
                      style={formData.assigned_subjects.includes(subject) ? { backgroundColor: '#5B8C51' } : {}}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2"
                style={{ backgroundColor: '#5B8C51' }}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Saving...
                  </>
                ) : (
                  editingTeacher ? 'Update' : 'Add Teacher'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
