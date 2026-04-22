import React, { useEffect, useState } from 'react'
import alertService from '../../services/alertService'
import DataTable from '../../components/common/DataTable'

const SlowMovingPage = () => {
  const [data, setData] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const res = await alertService.getSlowMoving()
      setData(res.data)
    }
    fetchData()
  }, [])

  const columns = [
    { key: 'name', title: 'Sản phẩm' },
    { key: 'stock', title: 'Tồn kho' },
    { key: 'lastImportDate', title: 'Ngày nhập gần nhất' },
    {
      key: 'lastExportDate',
      title: 'Ngày xuất gần nhất',
      render: (row) => row.lastExportDate || 'Chưa có xuất',
    },
  ]

  return <DataTable columns={columns} data={data} />
}

export default SlowMovingPage