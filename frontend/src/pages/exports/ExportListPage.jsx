import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import exportService from '../../services/exportService'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'

const ExportListPage = () => {
  const [exportsData, setExportsData] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const res = await exportService.getAll()
      setExportsData(res.data)
    }
    fetchData()
  }, [])

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
          <Link
            to="/exports/create"
            className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-600"
          >
            + Tạo phiếu xuất
          </Link>
        }
      />
      <DataTable columns={columns} data={exportsData} />
    </div>
  )
}

export default ExportListPage
