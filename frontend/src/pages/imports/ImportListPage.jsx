import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import importService from '../../services/importService'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import { FileSpreadsheet } from 'lucide-react'
import { exportToExcel } from '../../utils/exportUtils'

const ImportListPage = () => {
  const [imports, setImports] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const res = await importService.getAll()
      setImports(res.data)
    }
    fetchData()
  }, [])

  const handleExport = () => {
    const formattedData = imports.map(item => ({
      'Mã phiếu nhập': item.receipt_code,
      'Nhà cung cấp': item.supplier_name,
      'Ngày nhập': item.import_date,
      'Ghi chú': item.note,
      'Người tạo': item.creator_name
    }))
    exportToExcel(formattedData, 'Danh_Sach_Phieu_Nhap')
  }

  const columns = [
    { key: 'receipt_code', title: 'Mã phiếu nhập' },
    { key: 'supplier_name', title: 'Nhà cung cấp' },
    { key: 'import_date', title: 'Ngày nhập' },
    { key: 'note', title: 'Ghi chú' },
    { key: 'creator_name', title: 'Người tạo' },
    {
      key: 'actions',
      title: 'Hành động',
      render: (row) => (
        <Link
          to={`/imports/${row.id}`}
          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-cyan-50 hover:text-cyan-600 transition"
        >
          Chi tiết
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Danh sách phiếu nhập"
        description="Theo dõi tất cả phiếu nhập kho"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={imports.length === 0}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-100 hover:bg-emerald-700 transition disabled:opacity-50 disabled:shadow-none"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Xuất Excel
            </button>
            <Link
              to="/imports/create"
              className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-600 whitespace-nowrap"
            >
              + Tạo phiếu nhập
            </Link>
          </div>
        }
      />
      <DataTable columns={columns} data={imports} />
    </div>
  )
}

export default ImportListPage