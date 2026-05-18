import React, { useEffect, useState } from 'react'
import axiosClient from '../../services/axiosClient'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import { exportToExcel } from '../../utils/exportUtils'
import { FileSpreadsheet } from 'lucide-react'

const InventoryPage = () => {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    axiosClient.get('/inventory')
      .then((res) => setInventory(res.data.inventory || []))
      .catch(() => setInventory([]))
      .finally(() => setLoading(false))
  }, [])

  const handleExport = () => {
    const formattedData = inventory.map(item => ({
      'Mã SP': item.product_code,
      'Tên sản phẩm': item.product_name,
      'Danh mục': item.category,
      'Đơn vị': item.unit,
      'Tổng nhập': item.total_imported,
      'Tổng xuất': item.total_exported,
      'Tồn hiện tại': item.current_stock,
      'Ngưỡng tối thiểu': item.min_stock
    }))
    exportToExcel(formattedData, 'Bao_Cao_Ton_Kho')
  }

  const columns = [
    { key: 'product_code', title: 'Mã SP' },
    { key: 'product_name', title: 'Tên sản phẩm' },
    { key: 'category', title: 'Danh mục' },
    { key: 'unit', title: 'Đơn vị' },
    { key: 'total_imported', title: 'Tổng nhập' },
    { key: 'total_exported', title: 'Tổng xuất' },
    {
      key: 'current_stock',
      title: 'Tồn hiện tại',
      render: (row) => (
        <span
          className={`font-semibold ${
            row.current_stock < row.min_stock ? 'text-red-600' : 'text-emerald-600'
          }`}
        >
          {row.current_stock}
        </span>
      ),
    },
    { key: 'min_stock', title: 'Ngưỡng tối thiểu' },
  ]

  const emptyState = (
    <EmptyState
      icon="inventory"
      message="Chưa có dữ liệu tồn kho"
      description="Dữ liệu tồn kho sẽ hiển thị sau khi có phiếu nhập/xuất."
    />
  )

  const actionButton = (
    <button
      onClick={handleExport}
      disabled={inventory.length === 0}
      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50 disabled:shadow-none"
    >
      <FileSpreadsheet className="h-4 w-4" />
      Xuất Excel
    </button>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tồn kho hiện tại"
        description="Hiển thị số lượng tồn của từng sản phẩm"
        action={actionButton}
      />
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      ) : (
        <DataTable columns={columns} data={inventory} empty={emptyState} />
      )}
    </div>
  )
}

export default InventoryPage

