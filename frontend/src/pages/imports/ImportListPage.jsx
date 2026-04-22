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
    { key: 'code', title: 'Mã phiếu nhập' },
    { key: 'supplier', title: 'Nhà cung cấp' },
    { key: 'date', title: 'Ngày nhập' },
    { key: 'totalItems', title: 'Số dòng SP' },
    { key: 'status', title: 'Trạng thái' },
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