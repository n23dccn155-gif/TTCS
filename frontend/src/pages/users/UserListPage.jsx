import React, { useEffect, useState } from 'react'
import userService from '../../services/userService'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import { formatRole } from '../../utils/format'
import { X } from 'lucide-react'

const UserListPage = () => {
  const [users, setUsers] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    password: '',
    role: 'staff',
  })

  const fetchData = async () => {
    try {
      const res = await userService.getAll()
      setUsers(res.data)
    } catch (error) {
      console.error('Failed to fetch users', error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await userService.create(formData)
      setIsModalOpen(false)
      setFormData({ username: '', full_name: '', password: '', role: 'staff' })
      fetchData() // Refresh list
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi tạo tài khoản')
    }
  }

  const columns = [
    { key: 'username', title: 'Username' },
    { key: 'full_name', title: 'Họ và tên' },
    { key: 'email', title: 'Email', render: (row) => row.email || <span className="text-gray-400 italic">Chưa cập nhật</span> },
    {
      key: 'role',
      title: 'Vai trò',
      render: (row) => formatRole(row.role),
    },
    {
      key: 'is_active',
      title: 'Trạng thái',
      render: (row) =>
        row.is_active ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Hoạt động
          </span>
        ) : (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            Bị khóa
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
          <button 
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-600 shadow-sm"
          >
            + Thêm nhân viên
          </button>
        }
      />
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200">
        <DataTable columns={columns} data={users} />
      </div>

      {/* Modal Thêm Nhân Viên */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md transform rounded-2xl bg-white shadow-2xl transition-all">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-800">Thêm nhân viên mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Họ và tên thật <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Tên đăng nhập (Username) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: nvana"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Mật khẩu cấp tạm <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Mật khẩu ban đầu"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Vai trò</label>
                <select
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="staff">Nhân viên Kho (Staff)</option>
                  <option value="admin">Quản lý (Admin)</option>
                </select>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-cyan-200 hover:bg-cyan-600 transition"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserListPage