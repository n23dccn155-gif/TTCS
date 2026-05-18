import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import importService from '../../services/importService'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'

const ImportListPage = () => {
  const [imports, setImports] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const res = await importService.getAll()
      setImports(res.data)
    }
    fetchData()
  }, [])

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
          <Link
            to="/imports/create"
            className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-600"
          >
            + Tạo phiếu nhập
          </Link>
        }
      />
      <DataTable columns={columns} data={imports} />
    </div>
  )
}

export default ImportListPage