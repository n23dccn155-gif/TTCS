import React, { useEffect, useState } from 'react'
import alertService from '../../services/alertService'
import DataTable from '../../components/common/DataTable'

const LowStockPage = () => {
  const [data, setData] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const res = await alertService.getLowStock()
      setData(res.data)
    }
    fetchData()
  }, [])

  const columns = [
    { key: 'code', title: 'Mã SP' },
    { key: 'name', title: 'Tên sản phẩm' },
    { key: 'stock', title: 'Tồn hiện tại' },
    { key: 'minStock', title: 'Ngưỡng tối thiểu' },
    {
      key: 'needImport',
      title: 'Cần nhập thêm',
      render: (row) => (
        <span className="font-semibold text-red-600">{row.minStock - row.stock}</span>
      ),
    },
  ]

  return <DataTable columns={columns} data={data} />
}

export default LowStockPage