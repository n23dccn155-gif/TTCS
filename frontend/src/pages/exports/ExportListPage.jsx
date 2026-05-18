import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import exportService from '../../services/exportService'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import { FileSpreadsheet } from 'lucide-react'
import { exportToExcel } from '../../utils/exportUtils'

const ExportListPage = () => {
  const [exportsData, setExportsData] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const res = await exportService.getAll()
      setExportsData(res.data)
    }
    fetchData()
  }, [])

  const handleExport = () => {
    const formattedData = exportsData.map(item => ({
      'Mã phiếu xuất': item.receipt_code,
      'Lý do xuất': item.reason,
      'Ngày xuất': item.export_date,
      'Ghi chú': item.note,
      'Người tạo': item.creator_name
    }))
    exportToExcel(formattedData, 'Danh_Sach_Phieu_Xuat')
  }

  const columns = [
    { key: 'receipt_code', title: 'Mã phiếu xuất' },
    { key: 'reason', title: 'Lý do xuất' },
    { key: 'export_date', title: 'Ngày xuất' },
    { key: 'note', title: 'Ghi chú' },
    { key: 'creator_name', title: 'Người tạo' },
    {
      key: 'actions',
      title: 'Hành động',
      render: (row) => (
        <Link
          to={`/exports/${row.id}`}
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
        title="Danh sách phiếu xuất"
        description="Theo dõi tất cả phiếu xuất kho"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={exportsData.length === 0}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-100 hover:bg-emerald-700 transition disabled:opacity-50 disabled:shadow-none"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Xuất Excel
            </button>
            <Link
              to="/exports/create"
              className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-600 whitespace-nowrap"
            >
              + Tạo phiếu xuất
            </Link>
          </div>
        }
      />
      <DataTable columns={columns} data={exportsData} />
    </div>
  )
}

export default ExportListPage

