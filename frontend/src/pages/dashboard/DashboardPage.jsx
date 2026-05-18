import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../../services/axiosClient'
import StatCard from '../../components/common/StatCard'
import DataTable from '../../components/common/DataTable'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import {
  AlertTriangle,
  ShieldAlert,
  Calendar,
  Clock,
  Eye,
  FileText,
  ArrowRight,
  TrendingDown,
} from 'lucide-react'

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#64748b']

const DashboardPage = () => {
  const navigate = useNavigate()
  const [selectedAlertCategory, setSelectedAlertCategory] = useState(null)
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
        const alertData = alertRes.data || {}
        setAlerts({
          low_stock_count: alertData.summary?.low_stock_count || 0,
          expiring_soon_count: alertData.summary?.expiring_soon_count || 0,
          slow_moving_count: alertData.summary?.slow_moving_count || 0,
          low_stock: alertData.low_stock || [],
          expiring_soon: alertData.expiring_soon || [],
          slow_moving: alertData.slow_moving || [],
        })
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

        {/* Bảng Cảnh Báo Thông Minh (Tương Tác) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <h3 className="text-xl font-bold text-slate-800">Cảnh báo sức khỏe kho</h3>
          </div>
          <div className="space-y-4">
            {/* Tồn thấp */}
            <div 
              onClick={() => setSelectedAlertCategory('low_stock')}
              className="group cursor-pointer rounded-xl bg-red-50/60 p-4 border border-red-100/50 hover:bg-red-50 transition duration-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-xl text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-800">
                    Tồn dưới mức tối thiểu ({alerts.low_stock_count || 0} sản phẩm)
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {alerts.low_stock?.slice(0, 2).map(s => s.product_name).join(', ') || 'Kho hàng an toàn'}
                  </p>
                </div>
              </div>
              <button className="flex items-center gap-1 text-xs font-bold text-red-700 bg-white border border-red-200 px-3 py-1.5 rounded-lg opacity-80 group-hover:opacity-100 transition shadow-sm">
                <Eye className="w-3.5 h-3.5" /> Chi tiết
              </button>
            </div>

            {/* Sắp hết hạn (FEFO) */}
            <div 
              onClick={() => setSelectedAlertCategory('expiring_soon')}
              className="group cursor-pointer rounded-xl bg-amber-50/60 p-4 border border-amber-100/50 hover:bg-amber-50 transition duration-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Sắp hết hạn sử dụng ({alerts.expiring_soon_count || 0} lô hàng)
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {alerts.expiring_soon?.slice(0, 2).map(s => s.product_name).join(', ') || 'Không có lô hàng cận date'}
                  </p>
                </div>
              </div>
              <button className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-white border border-amber-200 px-3 py-1.5 rounded-lg opacity-80 group-hover:opacity-100 transition shadow-sm">
                <Eye className="w-3.5 h-3.5" /> Chi tiết
              </button>
            </div>

            {/* Tồn kho lâu ngày */}
            <div 
              onClick={() => setSelectedAlertCategory('slow_moving')}
              className="group cursor-pointer rounded-xl bg-indigo-50/60 p-4 border border-indigo-100/50 hover:bg-indigo-50 transition duration-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-indigo-800">
                    Tồn kho lâu ngày ({alerts.slow_moving_count || 0} sản phẩm)
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {alerts.slow_moving?.slice(0, 2).map(s => s.product_name).join(', ') || 'Luân chuyển tốt'}
                  </p>
                </div>
              </div>
              <button className="flex items-center gap-1 text-xs font-bold text-indigo-700 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg opacity-80 group-hover:opacity-100 transition shadow-sm">
                <Eye className="w-3.5 h-3.5" /> Chi tiết
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Modal chi tiết cảnh báo sức khỏe kho hàng */}
      {selectedAlertCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-4xl max-h-[85vh] overflow-hidden transform rounded-3xl bg-white shadow-2xl transition-all flex flex-col modal-content">
            <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {selectedAlertCategory === 'low_stock' && <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />}
                {selectedAlertCategory === 'expiring_soon' && <Calendar className="w-5 h-5 text-amber-500" />}
                {selectedAlertCategory === 'slow_moving' && <Clock className="w-5 h-5 text-indigo-500" />}
                {selectedAlertCategory === 'low_stock' && 'Cảnh báo tồn kho dưới mức tối thiểu'}
                {selectedAlertCategory === 'expiring_soon' && 'Cảnh báo hạn sử dụng (FEFO Optimizer)'}
                {selectedAlertCategory === 'slow_moving' && 'Cảnh báo sản phẩm tồn kho lâu ngày (> 30 ngày)'}
              </h3>
              <button 
                onClick={() => setSelectedAlertCategory(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* LOW STOCK TABLE */}
              {selectedAlertCategory === 'low_stock' && (
                alerts.low_stock.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">Tuyệt vời! Hiện không có sản phẩm nào dưới mức tối thiểu.</p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-sm text-left text-slate-600">
                      <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Mã sản phẩm</th>
                          <th className="px-4 py-3">Tên sản phẩm</th>
                          <th className="px-4 py-3 text-center">ĐVT</th>
                          <th className="px-4 py-3 text-right">Tồn hiện tại</th>
                          <th className="px-4 py-3 text-right">Tồn tối thiểu</th>
                          <th className="px-4 py-3 text-right text-red-600 font-bold">Số lượng thiếu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {alerts.low_stock.map((item) => (
                          <tr key={item.product_id} className="hover:bg-slate-50/50 transition">
                            <td className="px-4 py-3 font-semibold text-slate-800">{item.product_code}</td>
                            <td className="px-4 py-3 font-medium text-slate-700">{item.product_name}</td>
                            <td className="px-4 py-3 text-center text-slate-500">{item.unit}</td>
                            <td className="px-4 py-3 text-right font-semibold text-red-600">{item.current_stock}</td>
                            <td className="px-4 py-3 text-right text-slate-500">{item.min_stock}</td>
                            <td className="px-4 py-3 text-right font-bold text-red-600 bg-red-50/30">-{item.shortage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* EXPIRING SOON (FEFO) TABLE */}
              {selectedAlertCategory === 'expiring_soon' && (
                alerts.expiring_soon.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">An toàn! Không có lô hàng nào sắp hết hạn trong 7 ngày tới.</p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-sm text-left text-slate-600">
                      <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Mã lô</th>
                          <th className="px-4 py-3">Tên sản phẩm</th>
                          <th className="px-4 py-3">Hạn sử dụng</th>
                          <th className="px-4 py-3 text-right">Tồn lô</th>
                          <th className="px-4 py-3 text-center">Trạng thái</th>
                          <th className="px-4 py-3 text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {alerts.expiring_soon.map((item) => {
                          const days = item.days_until_expiry
                          let badgeColor = "bg-red-100 text-red-800 border-red-200"
                          if (days > 3) badgeColor = "bg-amber-100 text-amber-800 border-amber-200"
                          
                          return (
                            <tr key={item.lot_id} className="hover:bg-slate-50/50 transition">
                              <td className="px-4 py-3 font-semibold text-slate-800">{item.batch_code || 'Không mã'}</td>
                              <td className="px-4 py-3 font-medium text-slate-700">{item.product_name}</td>
                              <td className="px-4 py-3 text-slate-600 font-semibold">{new Date(item.expiry_date).toLocaleDateString('vi-VN')}</td>
                              <td className="px-4 py-3 text-right font-bold text-slate-800">{item.current_lot_stock} {item.unit}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}>
                                  {days === 0 ? 'Hết hạn hôm nay!' : `Còn ${days} ngày`}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => {
                                    setSelectedAlertCategory(null)
                                    navigate('/exports/create')
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition shadow-sm"
                                >
                                  Ưu tiên xuất <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* SLOW MOVING TABLE */}
              {selectedAlertCategory === 'slow_moving' && (
                alerts.slow_moving.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">Tuyệt vời! Toàn bộ sản phẩm đều được luân chuyển đều đặn.</p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-sm text-left text-slate-600">
                      <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Mã sản phẩm</th>
                          <th className="px-4 py-3">Tên sản phẩm</th>
                          <th className="px-4 py-3 text-right">Tồn hiện tại</th>
                          <th className="px-4 py-3">Ngày xuất cuối</th>
                          <th className="px-4 py-3 text-right">Số ngày chưa xuất</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {alerts.slow_moving.map((item) => (
                          <tr key={item.product_id} className="hover:bg-slate-50/50 transition">
                            <td className="px-4 py-3 font-semibold text-slate-800">{item.product_code}</td>
                            <td className="px-4 py-3 font-medium text-slate-700">{item.product_name}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-700">{item.current_stock} {item.unit}</td>
                            <td className="px-4 py-3 text-slate-500">
                              {item.last_export_date ? new Date(item.last_export_date).toLocaleDateString('vi-VN') : 'Chưa từng xuất'}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-indigo-600 bg-indigo-50/20">
                              {item.days_since_last_export !== null ? `${item.days_since_last_export} ngày` : 'Chưa rõ'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex justify-between items-center">
              <p className="text-xs text-slate-400">Tự động cảnh báo dựa trên quy trình xếp hàng FEFO tối ưu</p>
              <button
                onClick={() => setSelectedAlertCategory(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition shadow-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage