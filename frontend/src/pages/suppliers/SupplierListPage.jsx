import React, { useEffect, useState } from 'react'
import supplierService from '../../services/supplierService'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'

const SupplierListPage = () => {
  const [suppliers, setSuppliers] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const res = await supplierService.getAll()
      setSuppliers(res.data)
    }
    fetchData()
  }, [])

  const columns = [
    { key: 'code', title: 'Mã NCC' },
    { key: 'name', title: 'Tên nhà cung cấp' },
    { key: 'phone', title: 'Số điện thoại' },
    { key: 'address', title: 'Địa chỉ' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhà cung cấp"
        description="Quản lý danh sách nhà cung cấp"
        action={
          <button className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-600">
            + Thêm NCC
          </button>
        }
      />
      <DataTable columns={columns} data={suppliers} />
    </div>
  )
}

export default SupplierListPage