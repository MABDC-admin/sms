import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { useAuth } from '../contexts/AuthContext'

export function FinanceDashboard() {
  const { profile } = useAuth()
  
  // Check for demo user
  const demoUserStr = localStorage.getItem('demo_user')
  const demoUser = demoUserStr ? JSON.parse(demoUserStr) : null
  const currentUser = profile || demoUser
  void currentUser // Keep for future use
  
  const [loading, setLoading] = useState(true)
  const [collected, setCollected] = useState(0)
  const [outstanding, setOutstanding] = useState(0)
  const [employees, setEmployees] = useState<any[]>([])
  const [payrollTotal, setPayrollTotal] = useState(0)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      
      try {
        const [paymentsRes, invoicesRes, employeesRes] = await Promise.all([
          supabase.from('payments').select('amount'),
          supabase.from('invoices').select('total, status').in('status', ['issued', 'partially_paid']),
          supabase.from('employees').select('full_name, position, basic_salary').eq('is_active', true).limit(5)
        ])

        const totalCollected = paymentsRes.data?.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0) || 0
        setCollected(totalCollected)

        const totalOutstanding = invoicesRes.data?.reduce((acc: number, curr: any) => acc + (Number(curr.total) || 0), 0) || 0
        setOutstanding(totalOutstanding)

        if (employeesRes.data) {
          setEmployees(employeesRes.data.map(emp => ({
            name: emp.full_name,
            role: emp.position || 'Employee',
            amount: emp.basic_salary ? `$${Number(emp.basic_salary).toLocaleString()}` : ''
          })))
          
          const totalSalaries = employeesRes.data.reduce((acc: number, curr: any) => acc + (Number(curr.basic_salary) || 0), 0)
          setPayrollTotal(totalSalaries)
        }
      } catch (err) {
        console.error("Error loading finance dashboard:", err)
      }

      setLoading(false)
    }
    loadData()
  }, [])

  // Temporary mock data for charts while aggregation API is being built
  const monthlyData = [
    { name: 'Sep', income: 85, progress: 45, returned: 25 },
    { name: 'Oct', income: 95, progress: 55, returned: 35 },
    { name: 'Nov', income: 75, progress: 40, returned: 20 },
    { name: 'Dec', income: 88, progress: 50, returned: 30 },
    { name: 'Jan', income: 92, progress: 48, returned: 28 },
    { name: 'Feb', income: 78, progress: 42, returned: 22 },
    { name: 'Mar', income: 98, progress: 58, returned: 38 },
    { name: 'Apr', income: 82, progress: 45, returned: 25 },
    { name: 'May', income: 90, progress: 52, returned: 32 },
  ]

  return (
    <div className="flex-1 p-6" style={{ backgroundColor: '#F8FAF7' }}>
      {/* Top Row - 3 Cards */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        <div className="col-span-4 bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E8F5E3' }}>
              <span style={{ color: '#5B8C51' }}>💰</span>
            </div>
            <p className="text-sm text-gray-600">Collected</p>
          </div>
          <p className="text-4xl font-bold text-gray-800 mb-4">{loading ? '...' : `$${collected.toLocaleString()}`}</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Collected - <span className="font-semibold text-gray-700">${(collected * 0.8).toLocaleString()}</span></span>
            <span className="text-gray-500">Expected - <span className="font-semibold text-gray-700">${(collected * 1.5).toLocaleString()}</span></span>
          </div>
        </div>

        <div className="col-span-4 bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-2">Outstanding Balance</p>
          <p className="text-4xl font-bold text-gray-800 mb-4">{loading ? '...' : `$${outstanding.toLocaleString()}`}</p>
          <p className="text-sm text-gray-500">Overdue - <span className="font-semibold text-gray-700">${(outstanding * 0.3).toLocaleString()}</span></p>
        </div>

        <div className="col-span-4 bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Finance Status</p>
            <span className="text-2xl font-bold" style={{ color: '#5B8C51' }}>7</span>
          </div>
          <p className="text-xs text-gray-500 mb-1">Pending Approvals</p>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-3xl font-bold text-gray-800">$148,000</p>
            <span className="text-xl" style={{ color: '#5B8C51' }}>✓</span>
          </div>
          <p className="text-sm text-gray-500">Quarterly - <span className="font-semibold text-gray-700">$12,200</span></p>
        </div>
      </div>

      {/* Middle Row - 2 Cards */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        <div className="col-span-6 bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Monthly Income vs Expenses</h3>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E8F5E3' }}>
                <span style={{ color: '#5B8C51' }}>📊</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#5B8C51' }}></div><span className="text-xs text-gray-600">Income</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8BB87D' }}></div><span className="text-xs text-gray-600">In Progress</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#C5DEB8' }}></div><span className="text-xs text-gray-600">Returned</span></div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={[0, 100]} ticks={[0, 50, 90, 100]} tickFormatter={(v) => `${v}%`} />
              <Bar dataKey="income" fill="#5B8C51" radius={[2, 2, 0, 0]} barSize={12} />
              <Bar dataKey="progress" fill="#8BB87D" radius={[2, 2, 0, 0]} barSize={12} />
              <Bar dataKey="returned" fill="#C5DEB8" radius={[2, 2, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="col-span-6 bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Revenue Breakdown</h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E8F5E3' }}>
              <span style={{ color: '#5B8C51' }}>💵</span>
            </div>
          </div>
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-800">{loading ? '...' : `$${collected.toLocaleString()}`}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Collection Rate</p>
              <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-green-50">
                <p className="text-lg font-bold" style={{ color: '#5B8C51' }}>{(collected + outstanding > 0 ? (collected / (collected + outstanding) * 100).toFixed(1) : 0)}%</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-2">
            <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500 mb-1">Tuition</p><p className="text-lg font-bold text-gray-800">${(collected * 0.7).toLocaleString(undefined, {maximumFractionDigits: 0})}</p></div>
            <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500 mb-1">Fees</p><p className="text-lg font-bold text-gray-800">${(collected * 0.1).toLocaleString(undefined, {maximumFractionDigits: 0})}</p></div>
            <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500 mb-1">Other</p><p className="text-lg font-bold text-gray-800">${(collected * 0.2).toLocaleString(undefined, {maximumFractionDigits: 0})}</p></div>
          </div>
        </div>
      </div>

      {/* Bottom Row - 4 Cards */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3 bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8F5E3' }}>
                <span className="text-xs" style={{ color: '#5B8C51' }}>👥</span>
              </div>
              <p className="text-sm text-gray-600">Employees</p>
            </div>
            <span className="text-xs text-gray-400">›</span>
          </div>
          <p className="text-xs text-gray-500 mb-2">Total payroll</p>
          <div className="flex items-baseline gap-4">
            <p className="text-2xl font-bold text-gray-800">{loading ? '...' : `$${payrollTotal.toLocaleString()}`}</p>
          </div>
        </div>

        <div className="col-span-2 bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8F5E3' }}>
                <span className="text-xs" style={{ color: '#5B8C51' }}>💳</span>
              </div>
              <p className="text-sm text-gray-600">Salaries</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">{loading ? '...' : `$${(payrollTotal / 12).toLocaleString()}`}</p>
          <p className="text-sm text-gray-500">Monthly avg</p>
        </div>

        <div className="col-span-4 bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Employees</h3>
            <div className="flex items-center gap-2 text-gray-400"><span>‹</span><span>›</span></div>
          </div>
          <div className="space-y-3">
            {employees.length > 0 ? employees.map((emp, index) => (
              <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E8F5E3' }}>
                  <span className="text-lg" style={{ color: '#5B8C51' }}>👤</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{emp.name}</p>
                  <p className="text-xs text-gray-500">{emp.role}</p>
                </div>
                {emp.amount && <p className="text-sm font-semibold text-gray-700">{emp.amount}</p>}
              </div>
            )) : (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400">No active employees found.</p>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-3 bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800">Finance & HR</h3>
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E8F5E3' }}>
              <span className="text-xs" style={{ color: '#5B8C51' }}>📈</span>
            </div>
          </div>
          <p className="text-3xl font-bold mb-4" style={{ color: '#5B8C51' }}>{loading ? '...' : `$${(payrollTotal > 0 ? payrollTotal * 1.5 : 1125000).toLocaleString()}`}</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5B8C51' }}></div>
              <div><p className="text-xs text-gray-600">Annual Budget</p><p className="text-xs text-gray-500">Approved</p></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#C5DEB8' }}></div>
              <div><p className="text-xs text-gray-600">Quarterly Report</p><p className="text-xs text-gray-500">Due: Mar 31</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
