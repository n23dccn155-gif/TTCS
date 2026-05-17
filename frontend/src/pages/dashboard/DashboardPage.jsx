import React, { useEffect, useState } from 'react'
import axiosClient from '../../services/axiosClient'
import StatCard from '../../components/common/StatCard'
import DataTable from '../../components/common/DataTable'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#64748b']

const DashboardPage = () => {
  const [overview, setOverview] = useState({
    total_product_types: 0,
    total_current_stock: 0,
    total_stock_value: 0,
  })
  const [thisMonth, setThisMonth] = useState({
    import_receipts_count: 0,
    export_receipts_count: 0,
  })
  const [alerts, setAlerts] = useState({
    low_stock_count: 0,
    expiring_soon_count: 0,
    slow_moving_count: 0,
    low_stock: [],
    expiring_soon: [],
    slow_moving: [],
  })
  const [recentImports, setRecentImports] = useState([])
  const [recentExports, setRecentExports] = useState([])
  const [chartData, setChartData] = useState({
    stats_7days: [],
    category_stock: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axiosClient.get('/inventory/dashboard'),
      axiosClient.get('/inventory/alerts'),
      axiosClient.get('/imports'),
      axiosClient.get('/exports'),
      axiosClient.get('/inventory/stats'),
    ])
      .then(([dashRes, alertRes, impRes, expRes, statsRes]) => {
        setOverview(dashRes.data.overview || {})
        setThisMonth(dashRes.data.this_month || {})
        setAlerts(alertRes.data || {})
        setRecentImports((impRes.data || []).slice(0, 5))
        setRecentExports((expRes.data || []).slice(0, 5))
        setChartData(statsRes.data || { stats_7days: [], category_stock: [] })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const importColumns = [
    { key: 'receipt_code', title: 'Mã phiếu' },
    { key: 'supplier_name', title: 'Nhà cung cấp' },
    { key: 'import_date', title: 'Ngày nhập' },
  ]

  const exportColumns = [
    { key: 'receipt_code', title: 'Mã phiếu' },
    { key: 'reason', title: 'Lý do' },
    { key: 'export_date', title: 'Ngày xuất' },
  ]

  const formatCurrency = (val) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Tổng loại sản phẩm" value={overview.total_product_types} color="bg-blue-400" />
        <StatCard title="Phiếu nhập tháng này" value={thisMonth.import_receipts_count} color="bg-emerald-400" />
        <StatCard title="Phiếu xuất tháng này" value={thisMonth.export_receipts_count} color="bg-orange-400" />
        <StatCard title="Cảnh báo tồn thấp" value={alerts.low_stock_count || 0} color="bg-red-400" />
      </section>

      {/* Giá trị tồn kho */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Tổng giá trị tồn kho hiện tại</p>
        <p className="mt-1 text-3xl font-bold text-slate-800">
          {formatCurrency(overview.total_stock_value)}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Tổng tồn: <strong>{overview.total_current_stock?.toLocaleString()}</strong> sản phẩm
        </p>
      </div>

      {/* Charts Section */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bar Chart: Import/Export last 7 days */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-slate-800">Xu hướng nhập xuất (7 ngày qua)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.stats_7days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{fill: '#f8fafc'}}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar name="Nhập kho" dataKey="import" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar name="Xuất kho" dataKey="export" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Inventory by Category */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-slate-800">Cơ cấu tồn kho theo danh mục</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.category_stock}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.category_stock.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend 
                  iconType="circle" 
                  layout="vertical" 
                  align="right" 
                  verticalAlign="top" 
                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Giao dịch nhập gần đây */}
        <div className="xl:col-span-1">
          <h3 className="mb-3 text-lg font-bold text-slate-800">Nhập kho gần đây</h3>
          <DataTable columns={importColumns} data={recentImports} />
        </div>

        {/* Giao dịch xuất gần đây */}
        <div className="xl:col-span-1">
          <h3 className="mb-3 text-lg font-bold text-slate-800">Xuất kho gần đây</h3>
          <DataTable columns={exportColumns} data={recentExports} />
        </div>

        {/* Cảnh báo nhanh */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-xl font-bold text-slate-800">Cảnh báo nhanh</h3>
          <div className="space-y-4">
            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">
                Tồn thấp — {alerts.low_stock_count || 0} sản phẩm
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {alerts.low_stock?.slice(0, 2).map(s => s.product_name).join(', ') || 'Không có'}
              </p>
            </div>
            <div className="rounded-xl bg-yellow-50 p-4">
              <p className="text-sm font-semibold text-yellow-700">
                Sắp hết hạn (7 ngày) — {alerts.expiring_soon_count || 0} lô
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {alerts.expiring_soon?.slice(0, 2).map(s => s.product_name).join(', ') || 'Không có'}
              </p>
            </div>
            <div className="rounded-xl bg-orange-50 p-4">
              <p className="text-sm font-semibold text-orange-700">
                Tồn lâu (30 ngày) — {alerts.slow_moving_count || 0} sản phẩm
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {alerts.slow_moving?.slice(0, 2).map(s => s.product_name).join(', ') || 'Không có'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default DashboardPage