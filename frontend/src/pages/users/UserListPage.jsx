import React, { useEffect, useState } from 'react'
import userService from '../../services/userService'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import { formatRole } from '../../utils/format'

const UserListPage = () => {
  const [users, setUsers] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const res = await userService.getAll()
      setUsers(res.data)
    }
    fetchData()
  }, [])

  const columns = [
    { key: 'username', title: 'Username' },
    { key: 'full_name', title: 'Họ tên' },
    {
      key: 'role',
      title: 'Vai trò',
      render: (row) => formatRole(row.role),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => (
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          {row.status}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Người dùng"
        description="Quản lý tài khoản và phân quyền"
        action={
          <button className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-600">
            + Thêm user
          </button>
        }
      />
      <DataTable columns={columns} data={users} />
    </div>
  )
}

export default UserListPage