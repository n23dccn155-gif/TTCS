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
    { key: 'code', title: 'Mã phiếu xuất' },
    { key: 'reason', title: 'Lý do xuất' },
    { key: 'date', title: 'Ngày xuất' },
    { key: 'totalItems', title: 'Số dòng SP' },
    { key: 'status', title: 'Trạng thái' },
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