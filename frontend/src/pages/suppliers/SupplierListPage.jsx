import React, { useEffect, useState } from 'react'
import supplierService from '../../services/supplierService'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import { useAuth } from '../../contexts/AuthContext'
import { X, Edit2, Trash2, ShieldAlert } from 'lucide-react'

const SupplierListPage = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [suppliers, setSuppliers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState(null)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await supplierService.getAll()
      setSuppliers(res.data)
    } catch (error) {
      console.error('Failed to fetch suppliers', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredSuppliers = suppliers.filter(
    (item) =>
      (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.contact_person || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.phone || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.address || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    try {
      await supplierService.create(formData)
      setIsCreateOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi thêm nhà cung cấp!')
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    try {
      await supplierService.update(selectedSupplier.id, formData)
      setIsEditOpen(false)
      setSelectedSupplier(null)
      resetForm()
      fetchData()
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật nhà cung cấp!')
    }
  }

  const handleDelete = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhà cung cấp "${name}"? Thao tác này sẽ ẩn nhà cung cấp khỏi danh sách.`)) {
      try {
        await supplierService.delete(id)
        fetchData()
      } catch (error) {
        alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa nhà cung cấp!')
      }
    }
  }

  const openEditModal = (supplier) => {
    setSelectedSupplier(supplier)
    setFormData({
      name: supplier.name || '',
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
    })
    setIsEditOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
    })
  }

  const columns = [
    { key: 'name', title: 'Tên nhà cung cấp' },
    { 
      key: 'contact_person', 
      title: 'Người liên hệ',
      render: (row) => row.contact_person || <span className="text-slate-400 italic">Chưa cập nhật</span>
    },
    { key: 'phone', title: 'Số điện thoại' },
    { 
      key: 'email', 
      title: 'Email',
      render: (row) => row.email || <span className="text-slate-400 italic">Chưa cập nhật</span>
    },
    { key: 'address', title: 'Địa chỉ' },
  ]

  // Add Action column only if current user is an Admin
  if (isAdmin) {
    columns.push({
      key: 'actions',
      title: 'Hành động',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(row)}
            className="p-1 text-cyan-600 hover:bg-cyan-50 rounded-lg transition"
            title="Sửa nhà cung cấp"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id, row.name)}
            className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Xóa nhà cung cấp"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    })
  }

  const emptyState =
    suppliers.length === 0 ? (
      <EmptyState
        icon="truck"
        message="Chưa có nhà cung cấp nào"
        description="Bạn có thể thêm nhà cung cấp mới để quản lý thông tin đối tác."
      >
        {isAdmin && (
          <button 
            onClick={() => { resetForm(); setIsCreateOpen(true); }}
            className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600"
          >
            + Thêm NCC
          </button>
        )}
      </EmptyState>
    ) : (
      <EmptyState
        icon="search"
        message="Không tìm thấy nhà cung cấp"
        description="Thử tìm kiếm với từ khóa khác."
      />
    )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhà cung cấp"
        description="Quản lý danh sách đối tác cung cấp hàng hóa cho kho"
        action={
          isAdmin ? (
            <button 
              onClick={() => { resetForm(); setIsCreateOpen(true); }}
              className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-600 transition shadow-sm shadow-cyan-100"
            >
              + Thêm NCC
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              Chỉ Admin mới có quyền Thêm/Sửa/Xóa
            </div>
          )
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <input
          type="text"
          placeholder="Tìm theo tên nhà cung cấp, liên hệ, SĐT, địa chỉ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        />
      </div>

      <div className="rounded-2xl bg-white shadow-sm border border-slate-200">
        <DataTable columns={columns} data={filteredSuppliers} empty={emptyState} />
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg transform rounded-2xl bg-white shadow-2xl transition-all">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-800">Thêm nhà cung cấp mới</h3>
              <button onClick={() => setIsCreateOpen(false)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Tên nhà cung cấp <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Công ty TNHH ABC"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Người liên hệ</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Số điện thoại <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 0912345678"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Địa chỉ Email</label>
                <input
                  type="email"
                  placeholder="Ví dụ: contact@abc.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Địa chỉ nhà cung cấp <span className="text-red-500">*</span></label>
                <textarea
                  required
                  placeholder="Ví dụ: 123 Đường ABC, Quận XYZ, TP.HCM"
                  rows="2"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-cyan-200 hover:bg-cyan-600 transition"
                >
                  Thêm mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg transform rounded-2xl bg-white shadow-2xl transition-all">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-800">Cập nhật nhà cung cấp</h3>
              <button onClick={() => { setIsEditOpen(false); setSelectedSupplier(null); }} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Tên nhà cung cấp <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Công ty TNHH ABC"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Người liên hệ</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Số điện thoại <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 0912345678"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Địa chỉ Email</label>
                <input
                  type="email"
                  placeholder="Ví dụ: contact@abc.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Địa chỉ nhà cung cấp <span className="text-red-500">*</span></label>
                <textarea
                  required
                  placeholder="Ví dụ: 123 Đường ABC, Quận XYZ, TP.HCM"
                  rows="2"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsEditOpen(false); setSelectedSupplier(null); }}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-cyan-200 hover:bg-cyan-600 transition"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SupplierListPage