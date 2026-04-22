import React, { useEffect, useState } from 'react'
import alertService from '../../services/alertService'
import DataTable from '../../components/common/DataTable'

const ExpiryAlertPage = () => {
  const [data, setData] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const res = await alertService.getExpiry()
      setData(res.data)
    }
    fetchData()
  }, [])

  const columns = [
    { key: 'name', title: 'Sản phẩm' },
    { key: 'importDate', title: 'Ngày nhập' },
    { key: 'expiryDate', title: 'Ngày hết hạn' },
    { key: 'remainingDays', title: 'Số ngày còn lại' },
  ]

  return <DataTable columns={columns} data={data} />
}

export default ExpiryAlertPage