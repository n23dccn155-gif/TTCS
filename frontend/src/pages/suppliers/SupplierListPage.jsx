import React, { useEffect, useState } from 'react'
import supplierService from '../../services/supplierService'
import productService from '../../services/productService'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import { useAuth } from '../../contexts/AuthContext'
import { X, Edit2, Trash2, ShieldAlert, ChevronDown, ChevronUp, Package } from 'lucide-react'

const SupplierListPage = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [suppliers, setSuppliers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [expandedSupplierId, setExpandedSupplierId] = useState(null)
  const [productsBySupplier, setProductsBySupplier] = useState({})

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
    tax_code: '',
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

  const toggleSupplierProducts = async (supplierId) => {
    if (expandedSupplierId === supplierId) {
      setExpandedSupplierId(null)
      return
    }
    setExpandedSupplierId(supplierId)
    if (!productsBySupplier[supplierId]) {
      try {
        const res = await productService.getBySupplier(supplierId)
        setProductsBySupplier(prev => ({ ...prev, [supplierId]: res.data }))
      } catch {
        setProductsBySupplier(prev => ({ ...prev, [supplierId]: [] }))
      }
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
      tax_code: supplier.tax_code || '',
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
      tax_code: '',
    })
  }

  const columns = [
    { key: 'name', title: 'Tên nhà cung cấp' },
    { 
      key: 'tax_code', 
      title: 'Mã số thuế',
      render: (row) => row.tax_code || <span className="text-slate-400 italic">Chưa cập nhật</span>
    },
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
    {
      key: 'expand',
      title: 'Sản phẩm',
      render: (row) => (
        <button
          onClick={() => toggleSupplierProducts(row.id)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition"
        >
          <Package className="h-3.5 w-3.5" />
          Chi tiết
          {expandedSupplierId === row.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      )
    },
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

      <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <DataTable columns={columns} data={filteredSuppliers} empty={emptyState} />

        {/* Expanded product panel */}
        {expandedSupplierId && (() => {
          const sup = suppliers.find(s => s.id === expandedSupplierId)
          const prods = productsBySupplier[expandedSupplierId]
          return (
            // <div className="border-t border-indigo-100 bg-indigo-50 px-6 py-4">
            //   <div className="flex items-center gap-2 mb-3">
            //     <Package className="h-4 w-4 text-indigo-600" />
            //     <h4 className="font-bold text-indigo-800 text-sm">
            //       Sản phẩm của: {sup?.name}
            //     </h4>
            //     <span className="ml-auto text-xs text-indigo-500">{prods?.length || 0} sản phẩm</span>
            //   </div>
            //   {!prods ? (
            //     <p className="text-xs text-slate-500">Đang tải...</p>
            //   ) : prods.length === 0 ? (
            //     <p className="text-xs text-slate-400 italic">Nhà cung cấp này chưa có sản phẩm nào được liên kết.</p>
            //   ) : (
            //     <div className="flex flex-wrap gap-2">
            //       {prods.map(p => (
            //         <span key={p.id} className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
            //           <span className="text-indigo-400 font-mono">{p.product_code}</span>
            //           {p.name}
            //           {p.unit && <span className="text-slate-400">/ {p.unit}</span>}
            //         </span>
            //       ))}
            //     </div>
            //   )}
            // </div>
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
              onClick={() => setExpandedSupplierId(null)}
            >
              <div
                className="w-full max-w-4xl transform rounded-2xl bg-white shadow-2xl transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-indigo-600" />
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Sản phẩm của nhà cung cấp</h3>
                      <p className="text-sm text-slate-500">{sup?.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedSupplierId(null)}
                    className="rounded-full p-1 text-gray-400 hover:bg-gray-100 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto p-6">
                  {!prods ? (
                    <p className="text-sm text-slate-500">Đang tải...</p>
                  ) : prods.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">
                      Nhà cung cấp này chưa có sản phẩm nào được liên kết.
                    </p>
                  ) : (
                    <>
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm font-semibold text-indigo-700">
                          Danh sách sản phẩm đang liên kết
                        </span>
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                          {prods.length} sản phẩm
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {prods.map((p) => (
                          <div
                            key={p.id}
                            className="rounded-xl border border-indigo-100 bg-slate-50 px-4 py-3"
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <span className="rounded-lg bg-indigo-100 px-2 py-1 text-xs font-mono font-semibold text-indigo-600">
                                {p.product_code || 'SP'}
                              </span>
                              {p.unit && (
                                <span className="text-xs text-slate-400">{p.unit}</span>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-slate-800">
                              {p.name || p.product_name}
                            </p>
                            {p.category && (
                              <p className="mt-1 text-xs text-slate-500">Danh mục: {p.category}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })()}
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
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Mã số thuế</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 0101234567"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    value={formData.tax_code}
                    onChange={(e) => setFormData({...formData, tax_code: e.target.value})}
                  />
                </div>
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
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Mã số thuế</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 0101234567"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    value={formData.tax_code}
                    onChange={(e) => setFormData({...formData, tax_code: e.target.value})}
                  />
                </div>
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