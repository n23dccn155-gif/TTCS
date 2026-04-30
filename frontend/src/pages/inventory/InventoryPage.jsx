import React, { useEffect, useState } from 'react'
import inventoryService from '../../services/inventoryService'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'

const InventoryPage = () => {
  const [inventory, setInventory] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const res = await inventoryService.getAll()
      setInventory(res.data)
    }
    fetchData()
  }, [])

  const columns = [
    { key: 'code', title: 'Mã SP' },
    { key: 'name', title: 'Tên sản phẩm' },
    { key: 'category', title: 'Danh mục' },
    { key: 'unit', title: 'Đơn vị' },
    { key: 'totalImport', title: 'Tổng nhập' },
    { key: 'totalExport', title: 'Tổng xuất' },
    { key: 'currentStock', title: 'Tồn hiện tại' },
  ]

  const emptyState = (
    <EmptyState
      icon="inventory"
      message="Chưa có dữ liệu tồn kho"
      description="Dữ liệu tồn kho sẽ hiển thị sau khi có phiếu nhập/xuất."
    />
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tồn kho hiện tại"
        description="Hiển thị số lượng tồn của từng sản phẩm"
      />
      <DataTable columns={columns} data={inventory} empty={emptyState} />
    </div>
  )
}

export default InventoryPage
