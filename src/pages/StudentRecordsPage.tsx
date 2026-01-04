import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { StudentDetailModal } from '../components/StudentDetailModal'
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription'

interface StudentRecord {
  id: string
  lrn: string
  full_name: string
  grade_level: string
  age: number
  avatar_url: string
  status: 'Active' | 'Inactive'
  school_year: string
  gender?: string
  birth_date?: string
  mother_contact?: string
  mother_maiden_name?: string
  father_contact?: string
  father_name?: string
}

const gradeLevels = ['All', 'Kinder 1', 'Kinder 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
const schoolYears = ['All Years', '2024-2025', '2025-2026', '2026-2027']

const gradeColors: { [key: string]: string } = {
  'Kinder 1': 'linear-gradient(135deg, #E8D5B7 0%, #F5E6D3 50%, #E8D5B7 100%)',
  'Kinder 2': 'linear-gradient(135deg, #F5E1C8 0%, #FAF0E6 50%, #F5E1C8 100%)',
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

export function StudentRecordsPage() {
  const [records, setRecords] = useState<StudentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('All')
  const [selectedYear, setSelectedYear] = useState('2025-2026')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importPreview, setImportPreview] = useState<StudentRecord[]>([])
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null)

  // Load records function (memoized for real-time updates)
  const loadRecordsFromSupabase = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('student_records')
        .select('*')
        .order('student_name')

      // Filter by school year if not 'All Years'
      if (selectedYear !== 'All Years') {
        query = query.eq('school_year', selectedYear)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching records:', error)
        setLoading(false)
        return
      }

      if (data && data.length > 0) {
        const formattedRecords: StudentRecord[] = data.map((row: any) => {
          // Keep original level from CSV (Kinder 1, Kinder 2, Grade X)
          const gradeLevel = row.level || 'Grade 1'
          
          return {
            id: row.id,
            lrn: row.lrn || '',
            full_name: row.student_name || '',
            grade_level: gradeLevel,
            age: parseInt(row.age) || 0,
            avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(row.student_name || 'default')}&backgroundColor=transparent`,
            status: (row.status as 'Active' | 'Inactive') || 'Active',
            school_year: row.school_year || '2025-2026',
            gender: row.gender || '',
            birth_date: row.birth_date || '',
            mother_contact: row.mother_contact || '',
            mother_maiden_name: row.mother_maiden_name || '',
            father_contact: row.father_contact || '',
            father_name: row.father_name || ''
          }
        })
        setRecords(formattedRecords)
      } else {
        setRecords([])
      }
    } catch (err) {
      console.error('Error:', err)
    }
    setLoading(false)
  }, [selectedYear])

  // Initial load
  useEffect(() => {
    loadRecordsFromSupabase()
  }, [loadRecordsFromSupabase])

  // Real-time subscription for live updates
  useRealtimeSubscription(
    { table: 'student_records' },
    loadRecordsFromSupabase,
    [selectedYear]
  )

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.lrn.toLowerCase().includes(searchTerm.toLowerCase())
    // Proper grade level matching - exact match
    const matchesGrade = selectedGrade === 'All' || r.grade_level === selectedGrade
    const matchesYear = selectedYear === 'All Years' || r.school_year === selectedYear
    return matchesSearch && matchesGrade && matchesYear
  })

  const getGradeDisplay = (grade: string) => {
    return grade // Display original level from CSV
  }

  const getGradeColor = (grade: string) => {
    return gradeColors[grade] || 'linear-gradient(135deg, #5B8C51 0%, #7CAE72 50%, #5B8C51 100%)'
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      parseCSV(text)
    }
    reader.readAsText(file)
  }

  function parseCSV(text: string) {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) return

    // Parse header
    const headers = lines[0].split(/[\t,]/).map(h => h.trim().toLowerCase())
    
    // Find column indices
    const levelIdx = headers.findIndex(h => h === 'level')
    const lrnIdx = headers.findIndex(h => h === 'lrn')
    const nameIdx = headers.findIndex(h => h.includes('student_name') || h.includes('name'))
    const birthIdx = headers.findIndex(h => h.includes('birth'))
    const ageIdx = headers.findIndex(h => h === 'age')
    const genderIdx = headers.findIndex(h => h === 'gender')
    const motherContactIdx = headers.findIndex(h => h.includes('mother_contact'))
    const motherNameIdx = headers.findIndex(h => h.includes('mother_maiden'))
    const fatherContactIdx = headers.findIndex(h => h.includes('father_contact'))
    const fatherNameIdx = headers.findIndex(h => h.includes('father_name'))

    // Parse data rows
    const imported: StudentRecord[] = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(/[\t,]/)
      if (cols.length < 3) continue

      const gradeLevel = cols[levelIdx]?.trim() || 'Grade 1'
      const lrn = cols[lrnIdx]?.trim() || ''
      const fullName = cols[nameIdx]?.trim() || ''
      const birthDate = cols[birthIdx]?.trim() || ''
      const age = parseInt(cols[ageIdx]?.trim() || '0') || 0
      const gender = cols[genderIdx]?.trim() || ''

      if (!fullName) continue

      imported.push({
        id: `import-${i}`,
        lrn: lrn,
        full_name: fullName,
        grade_level: gradeLevel, // Keep original level: Kinder 1, Kinder 2, Grade X
        age: age,
        avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${fullName}&backgroundColor=transparent`,
        status: 'Active',
        school_year: selectedYear,
        gender: gender,
        birth_date: birthDate,
        mother_contact: cols[motherContactIdx]?.trim() || '',
        mother_maiden_name: cols[motherNameIdx]?.trim() || '',
        father_contact: cols[fatherContactIdx]?.trim() || '',
        father_name: cols[fatherNameIdx]?.trim() || ''
      })
    }

    setImportPreview(imported)
    setShowImportModal(true)
  }

  function confirmImport() {
    setImporting(true)
    // Add imported records to existing records
    setRecords([...records, ...importPreview])
    setImporting(false)
    setShowImportModal(false)
    setImportPreview([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="flex-1 p-6" style={{ backgroundColor: '#F8FAF7' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">📋 Student Records</h1>
          <p className="text-gray-500">Manage student records by school year</p>
        </div>
        <div className="flex gap-2">
          <label
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium cursor-pointer"
            style={{ backgroundColor: '#3B82F6' }}
          >
            ⬆️ Import CSV
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium"
            style={{ backgroundColor: '#5B8C51' }}
          >
            + Add Student
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          {/* School Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-gray-800 text-white font-medium"
            style={{ backgroundColor: '#1a1a2e' }}
          >
            {schoolYears.map(year => (
              <option key={year} value={year}>{year === 'All Years' ? '📅 ALL' : `📅 ${year}`}</option>
            ))}
          </select>

          {/* Search */}
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search by name or LRN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-green-500 outline-none"
            />
          </div>

          {/* Grade Level Filter */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200"
          >
            {gradeLevels.map(grade => (
              <option key={grade} value={grade}>Level: {grade}</option>
            ))}
          </select>

          {/* More & Export */}
          <button className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-2">
            🔽 More
          </button>
          <button className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-2">
            ⬇️ Export
          </button>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-lg ${viewMode === 'card' ? 'bg-green-600 text-white' : 'text-gray-600'}`}
            >
              ▦
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-green-600 text-white' : 'text-gray-600'}`}
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Count */}
      <div className="mb-4 text-gray-600">
        {loading ? 'Loading...' : `Showing ${filteredRecords.length} of ${records.length} students`}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12 text-gray-500">Loading student records from database...</div>
      )}

      {/* Card View */}
      {!loading && viewMode === 'card' && (
        <div className="grid grid-cols-6 gap-4">
          {filteredRecords.map((record) => {
            const bgGradient = getGradeColor(record.grade_level)
            return (
              <div
                key={record.id}
                className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                style={{ background: bgGradient }}
              >
                {/* Status Badge */}
                <div className="p-3">
                  <span className="px-2 py-1 rounded text-xs font-medium text-white" style={{ backgroundColor: '#22c55e' }}>
                    {record.status}
                  </span>
                </div>

                {/* Avatar */}
                <div className="flex justify-center pb-3">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/50 bg-white/30">
                      {record.avatar_url ? (
                        <img src={record.avatar_url} alt={record.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-700">
                          {record.full_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                  </div>
                </div>

                {/* Name & Grade */}
                <div className="text-center px-2 pb-2">
                  <h3 className="text-gray-800 font-bold text-sm truncate">{record.full_name}</h3>
                  <p className="text-sm text-gray-600">{getGradeDisplay(record.grade_level)}</p>
                </div>

                {/* LRN & Age */}
                <div className="px-3 pb-3 flex justify-between text-xs text-gray-600">
                  <div>
                    <div>LRN</div>
                    <div className="text-gray-800 font-medium truncate" style={{ maxWidth: '80px' }}>{record.lrn}</div>
                  </div>
                  <div className="text-right">
                    <div>Age</div>
                    <div className="text-gray-800 font-medium">{record.age}</div>
                  </div>
                </div>

                {/* View Button */}
                <button 
                  onClick={() => setSelectedStudent(record)}
                  className="w-full py-2 text-sm font-medium flex items-center justify-center gap-2 bg-white/50 hover:bg-white/70 text-gray-700 transition-colors"
                >
                  👁️ View
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* List View */}
      {!loading && viewMode === 'list' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: '#1a1a2e' }}>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Student</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">LRN</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Grade Level</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Age</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">School Year</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded text-xs font-medium text-white" style={{ backgroundColor: '#22c55e' }}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden" style={{ background: getGradeColor(record.grade_level) }}>
                          {record.avatar_url ? (
                            <img src={record.avatar_url} alt={record.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-700">
                              {record.full_name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-gray-800">{record.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{record.lrn}</td>
                    <td className="px-4 py-3">
                      <span className="text-gray-700">{record.grade_level}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{record.age}</td>
                    <td className="px-4 py-3 text-gray-600">{record.school_year}</td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => setSelectedStudent(record)}
                        className="px-3 py-1 rounded-lg text-sm hover:bg-gray-100" 
                        style={{ color: '#5B8C51' }}
                      >
                        👁️ View
                      </button>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto py-8">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">⬆️ Import Preview</h2>
              <button onClick={() => setShowImportModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            
            <div className="mb-4 p-4 bg-green-50 rounded-xl">
              <p className="text-green-800 font-medium">✅ Found {importPreview.length} students ready to import</p>
              <p className="text-green-600 text-sm">School Year: {selectedYear}</p>
            </div>

            {/* Preview Table */}
            <div className="overflow-auto max-h-[400px] mb-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2">#</th>
                    <th className="text-left px-3 py-2">LRN</th>
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Grade</th>
                    <th className="text-left px-3 py-2">Age</th>
                    <th className="text-left px-3 py-2">Gender</th>
                    <th className="text-left px-3 py-2">Birth Date</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.slice(0, 50).map((record, idx) => (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                      <td className="px-3 py-2 font-mono text-xs">{record.lrn}</td>
                      <td className="px-3 py-2 font-medium">{record.full_name}</td>
                      <td className="px-3 py-2">{record.grade_level}</td>
                      <td className="px-3 py-2">{record.age}</td>
                      <td className="px-3 py-2">{record.gender}</td>
                      <td className="px-3 py-2">{record.birth_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importPreview.length > 50 && (
                <p className="text-center text-gray-500 py-2">... and {importPreview.length - 50} more students</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowImportModal(false); setImportPreview([]); }}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                disabled={importing}
                className="flex-1 px-4 py-3 rounded-xl text-white font-medium"
                style={{ backgroundColor: '#5B8C51' }}
              >
                {importing ? 'Importing...' : `Import ${importPreview.length} Students`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          gradeColor={getGradeColor(selectedStudent.grade_level)}
        />
      )}
    </div>
  )
}
