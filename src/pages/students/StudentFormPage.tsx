import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

interface GradeLevel {
  id: string
  name: string
}

export function StudentFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([])

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    date_of_birth: '',
    gender: 'male',
    phone: '',
    address: '',
    grade_level_id: '',
    enrollment_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadGradeLevels()
    if (isEdit) loadStudent()
  }, [id])

  async function loadGradeLevels() {
    const { data } = await supabase.from('grade_levels').select('id, name').order('ordinal')
    setGradeLevels(data || [])
  }

  async function loadStudent() {
    setLoading(true)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, students(*)')
      .eq('id', id)
      .single()

    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        date_of_birth: profile.date_of_birth || '',
        gender: profile.gender || 'male',
        phone: profile.phone || '',
        address: profile.address || '',
        grade_level_id: profile.students?.[0]?.grade_level_id || '',
        enrollment_date: profile.students?.[0]?.enrollment_date || new Date().toISOString().split('T')[0]
      })
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    if (isEdit) {
      // Update existing student
      await supabase.from('profiles').update({
        full_name: formData.full_name,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        phone: formData.phone,
        address: formData.address
      }).eq('id', id)

      await supabase.from('students').update({
        grade_level_id: formData.grade_level_id || null,
        enrollment_date: formData.enrollment_date
      }).eq('profile_id', id)
    } else {
      // Create new student via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: 'tempPassword123!',
        options: {
          data: {
            full_name: formData.full_name,
            role: 'student'
          }
        }
      })

      if (authError) {
        alert(authError.message)
        setSaving(false)
        return
      }

      if (authData.user) {
        // Update profile
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          full_name: formData.full_name,
          email: formData.email,
          role: 'student',
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          phone: formData.phone,
          address: formData.address
        })

        // Create student record
        await supabase.from('students').insert({
          profile_id: authData.user.id,
          grade_level_id: formData.grade_level_id || null,
          enrollment_date: formData.enrollment_date
        })
      }
    }

    setSaving(false)
    navigate('/students')
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/students" className="text-gray-400 hover:text-gray-600">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">
          {isEdit ? 'Edit Student' : 'Add New Student'}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
              required
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
              disabled={isEdit}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
            <select
              value={formData.grade_level_id}
              onChange={(e) => setFormData({ ...formData, grade_level_id: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
            >
              <option value="">Select Grade</option>
              {gradeLevels.map(gl => (
                <option key={gl.id} value={gl.id}>{gl.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Date</label>
            <input
              type="date"
              value={formData.enrollment_date}
              onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-100">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl text-white font-medium disabled:opacity-50"
            style={{ backgroundColor: '#5B8C51' }}
          >
            {saving ? 'Saving...' : isEdit ? 'Update Student' : 'Create Student'}
          </button>
          <Link
            to="/students"
            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
