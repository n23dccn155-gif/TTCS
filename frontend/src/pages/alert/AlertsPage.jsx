import React, { useEffect, useState } from 'react'
import alertService from '../../services/alertService'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'

const tabs = [
  { key: 'low-stock', label: 'Tồn thấp', color: 'red' },
  { key: 'expiry', label: 'Sắp hết hạn', color: 'yellow' },
  { key: 'slow-moving', label: 'Tồn lâu', color: 'orange' },
]

const alertConfig = {
  'low-stock': {
    title: 'Cảnh báo tồn thấp',
    description: 'Danh sách sản phẩm có tồn kho dưới ngưỡng tối thiểu',
    columns: [
      { key: 'code', title: 'Mã SP' },
      { key: 'name', title: 'Tên sản phẩm' },
      { key: 'currentStock', title: 'Tồn hiện tại' },
      { key: 'min_stock', title: 'Ngưỡng tối thiểu' },
      {
        key: 'needImport',
        title: 'Cần nhập thêm',
        render: (row) => (
          <span className="font-semibold text-red-600">
            {row.min_stock - row.currentStock > 0 ? row.min_stock - row.currentStock : 0}
          </span>
        ),
      },
    ],
    emptyMessage: 'Tất cả sản phẩm đều ổn định',
    emptyDescription: 'Không có sản phẩm nào dưới ngưỡng tồn kho tối thiểu.',
    fetch: () => alertService.getLowStock(),
  },
  'expiry': {
    title: 'Cảnh báo sắp hết hạn',
    description: 'Danh sách sản phẩm nhập kho sắp đến hạn sử dụng',
    columns: [
      { key: 'product_name', title: 'Sản phẩm' },
      { key: 'quantity', title: 'Số lượng' },
      { key: 'expiry_date', title: 'Ngày hết hạn' },
    ],
    emptyMessage: 'Không có sản phẩm sắp hết hạn',
    emptyDescription: 'Tất cả sản phẩm trong kho đều còn hạn sử dụng tốt.',
    fetch: () => alertService.getExpiry(),
  },
  'slow-moving': {
    title: 'Cảnh báo tồn lâu',
    description: 'Danh sách sản phẩm tồn kho lâu ngày, ít luân chuyển',
    columns: [
      { key: 'code', title: 'Mã SP' },
      { key: 'name', title: 'Tên sản phẩm' },
      { key: 'category', title: 'Danh mục' },
      { key: 'totalImport', title: 'Tổng nhập' },
      { key: 'totalExport', title: 'Tổng xuất' },
      { key: 'currentStock', title: 'Tồn hiện tại' },
    ],
    emptyMessage: 'Không có sản phẩm tồn lâu',
    emptyDescription: 'Tất cả sản phẩm đều có luân chuyển tốt.',
    fetch: () => alertService.getSlowMoving(),
  },
}

const AlertsPage = () => {
  const [activeTab, setActiveTab] = useState('low-stock')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  const config = alertConfig[activeTab]

  useEffect(() => {
    setLoading(true)
    config
      .fetch()
      .then((res) => setData(res.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [activeTab])

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
