import React, { useEffect, useState } from 'react'
import axiosClient from '../../services/axiosClient'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'

const tabs = [
  { key: 'low_stock', label: 'Tồn thấp', color: 'red' },
  { key: 'expiring_soon', label: 'Sắp hết hạn', color: 'yellow' },
  { key: 'slow_moving', label: 'Tồn lâu', color: 'orange' },
]

const alertConfig = {
  low_stock: {
    title: 'Cảnh báo tồn thấp',
    description: 'Danh sách sản phẩm có tồn kho dưới ngưỡng tối thiểu',
    columns: [
      { key: 'product_code', title: 'Mã SP' },
      { key: 'product_name', title: 'Tên sản phẩm' },
      { key: 'unit', title: 'ĐVT' },
      { key: 'current_stock', title: 'Tồn hiện tại' },
      { key: 'min_stock', title: 'Ngưỡng tối thiểu' },
      {
        key: 'shortage',
        title: 'Cần nhập thêm',
        render: (row) => (
          <span className="font-semibold text-red-600">{row.shortage}</span>
        ),
      },
    ],
    emptyMessage: 'Tất cả sản phẩm đều ổn định',
    emptyDescription: 'Không có sản phẩm nào dưới ngưỡng tồn kho tối thiểu.',
  },
  expiring_soon: {
    title: 'Cảnh báo sắp hết hạn',
    description: 'Lô hàng sắp đến hạn sử dụng trong vòng 7 ngày',
    columns: [
      { key: 'product_code', title: 'Mã SP' },
      { key: 'product_name', title: 'Tên sản phẩm' },
      { key: 'batch_code', title: 'Mã lô' },
      { key: 'expiry_date', title: 'Ngày hết hạn' },
      { key: 'current_lot_stock', title: 'Còn lại' },
      {
        key: 'days_until_expiry',
        title: 'Số ngày còn lại',
        render: (row) => (
          <span className="font-semibold text-yellow-600">{row.days_until_expiry} ngày</span>
        ),
      },
    ],
    emptyMessage: 'Không có sản phẩm sắp hết hạn',
    emptyDescription: 'Tất cả sản phẩm trong kho đều còn hạn sử dụng tốt.',
  },
  slow_moving: {
    title: 'Cảnh báo tồn lâu',
    description: 'Sản phẩm chưa có phiếu xuất nào trong 30 ngày qua',
    columns: [
      { key: 'product_code', title: 'Mã SP' },
      { key: 'product_name', title: 'Tên sản phẩm' },
      { key: 'unit', title: 'ĐVT' },
      { key: 'current_stock', title: 'Tồn hiện tại' },
      { key: 'last_export_date', title: 'Xuất kho lần cuối' },
    ],
    emptyMessage: 'Không có sản phẩm tồn lâu',
    emptyDescription: 'Tất cả sản phẩm đều có luân chuyển tốt.',
  },
}

const AlertsPage = () => {
  const [activeTab, setActiveTab] = useState('low_stock')
  const [allAlerts, setAllAlerts] = useState({})
  const [loading, setLoading] = useState(false)

  const config = alertConfig[activeTab]

  useEffect(() => {
    setLoading(true)
    axiosClient
      .get('/inventory/alerts')
      .then((res) => setAllAlerts(res.data || {}))
      .catch(() => setAllAlerts({}))
      .finally(() => setLoading(false))
  }, [])

  const data = allAlerts[activeTab] || []

  const emptyState = (
    <EmptyState
      icon="alert"
      message={config.emptyMessage}
      description={config.emptyDescription}
    />
  )

  return (
    <div className="space-y-6">
      <PageHeader title={config.title} description={config.description} />

      <div className="flex gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          const count = (allAlerts[tab.key] || []).length
          const colorClasses = {
            red: isActive
              ? 'bg-red-500 text-white shadow-lg shadow-red-200'
              : 'bg-white text-red-600 border-red-200 hover:bg-red-50',
            yellow: isActive
              ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-200'
              : 'bg-white text-yellow-600 border-yellow-200 hover:bg-yellow-50',
            orange: isActive
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
              : 'bg-white text-orange-600 border-orange-200 hover:bg-orange-50',
          }
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl border px-5 py-2.5 text-sm font-semibold transition ${colorClasses[tab.color]}`}
            >
              {tab.label}
              {count > 0 && (
                <span className="ml-2 rounded-full bg-white bg-opacity-30 px-2 py-0.5 text-xs font-bold">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      ) : (
        <DataTable columns={config.columns} data={data} empty={emptyState} />
      )}
    </div>
  )
}

export default AlertsPage
