import React, { useEffect, useState } from 'react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import productService from '../../services/productService'
import locationService from '../../services/locationService'
import { useAuth } from '../../contexts/AuthContext'
import { X, Edit2, Trash2, ShieldAlert, ArrowUpDown } from 'lucide-react'

const ProductListPage = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [products, setProducts] = useState([])
  const [locations, setLocations] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState('id')

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Form states
  const [formData, setFormData] = useState({
    product_code: '',
    name: '',
    category: '',
    unit: '',
    min_stock: 0,
    max_stock: 10000,
    unit_price: '',
    description: '',
    location_id: '',
  })

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const [prodRes, locRes] = await Promise.all([
        productService.getAll(),
        locationService.getAll()
      ])
      setProducts(prodRes.data)
      setLocations(locRes.data)
    } catch (error) {
      console.error('Failed to fetch data', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const filteredProducts = products
    .filter(
      (item) =>
        (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.product_code || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.category || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '')
      }
      if (sortBy === 'price_desc') {
        return (b.unit_price || 0) - (a.unit_price || 0)
      }
      // Default: sort by ID (ascending)
      return (a.id || 0) - (b.id || 0)
    })

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    try {
      await productService.create(formData)
      setIsCreateOpen(false)
      resetForm()
      fetchProducts()
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi thêm sản phẩm!')
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    try {
      await productService.update(selectedProduct.id, formData)
      setIsEditOpen(false)
      setSelectedProduct(null)
      resetForm()
      fetchProducts()
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật sản phẩm!')
    }
  }

  const handleDelete = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}"? Thao tác này sẽ ẩn sản phẩm khỏi hệ thống.`)) {
      try {
        await productService.delete(id)
        fetchProducts()
      } catch (error) {
        alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa sản phẩm!')
      }
    }
  }

  const openEditModal = (product) => {
    setSelectedProduct(product)
    setFormData({
      product_code: product.product_code || '',
      name: product.name || '',
      category: product.category || '',
      unit: product.unit || '',
      min_stock: product.min_stock || 0,
      max_stock: product.max_stock || 10000,
      unit_price: product.unit_price || '',
      description: product.description || '',
      location_id: product.location_id || '',
    })
    setIsEditOpen(true)
  }

  const resetForm = () => {
    setFormData({
      product_code: '',
      name: '',
      category: '',
      unit: '',
      min_stock: 0,
      max_stock: 10000,
      unit_price: '',
      description: '',
      location_id: '',
    })
  }

  // Format currency
  const formatCurrency = (val) => {
    if (!val) return '0đ'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  const columns = [
    { key: 'product_code', title: 'Mã SP' },
    { key: 'name', title: 'Tên sản phẩm' },
    { key: 'category', title: 'Danh mục' },
    { key: 'unit', title: 'Đơn vị' },
    { 
      key: 'unit_price', 
      title: 'Đơn giá',
      render: (row) => <span className="font-medium text-slate-900">{formatCurrency(row.unit_price)}</span>
    },
    { key: 'min_stock', title: 'Min/Max', render: (row) => `${row.min_stock} / ${row.max_stock || 10000}` },
    {
      key: 'current_stock',
      title: 'Tồn thực tế',
      render: (row) => {
        const stock = row.current_stock || 0
        const min = row.min_stock || 0
        const max = row.max_stock || 10000
        if (stock === 0) {
          return (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              Hết hàng (0)
            </span>
          )
        } else if (stock < min) {
          return (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              Tồn kho thấp ({stock})
            </span>
          )
        } else if (stock > max) {
          return (
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
              Vượt tối đa ({stock})
            </span>
          )
        } else {
          return (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              An toàn ({stock})
            </span>
          )
        }
      }
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
            title="Sửa sản phẩm"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id, row.name)}
            className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Xóa sản phẩm"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    })
  }

  const emptyState =
    products.length === 0 ? (
      <EmptyState
        icon="box"
        message="Chưa có sản phẩm nào"
        description="Bạn có thể thêm sản phẩm mới để bắt đầu quản lý kho."
      >
        {isAdmin && (
          <button 
            onClick={() => { resetForm(); setIsCreateOpen(true); }}
            className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600"
          >
            + Thêm sản phẩm
          </button>
        )}
      </EmptyState>
    ) : (
      <EmptyState
        icon="search"
        message="Không tìm thấy sản phẩm"
        description="Thử tìm kiếm với từ khóa khác."
      />
    )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Danh sách sản phẩm"
        description="Quản lý danh mục hàng hóa trong kho hàng"
        action={
          isAdmin ? (
            <button 
              onClick={() => { resetForm(); setIsCreateOpen(true); }}
              className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-600 transition shadow-sm shadow-cyan-100"
            >
              + Thêm sản phẩm
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              Chỉ Admin mới có quyền Thêm/Sửa/Xóa
            </div>
          )
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm theo mã, tên hoặc danh mục sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-50">
          <div className="flex items-center gap-2 text-slate-500">
            <ArrowUpDown className="h-4 w-4" />
            <span className="text-sm font-medium">Sắp xếp theo:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition hover:border-cyan-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          >
            <option value="id">ID sản phẩm</option>
            <option value="name">Tên sản phẩm</option>
            <option value="price_desc">Đơn giá</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm border border-slate-200">
        <DataTable columns={columns} data={filteredProducts} empty={emptyState} />
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg transform rounded-2xl bg-white shadow-2xl transition-all">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-800">Thêm sản phẩm mới</h3>
              <button onClick={() => setIsCreateOpen(false)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Mã sản phẩm <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: SP001"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    value={formData.product_code}
                    onChange={(e) => setFormData({...formData, product_code: e.target.value})}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Tên sản phẩm <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Sữa tươi Vinamilk"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Danh mục</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Thực phẩm, Đồ khô"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    list="category"
                  />
                  <datalist id="category">
                    <option value="Thực phẩm"></option>
                    <option value="Đồ uống"></option>
                    <option value="Gia dụng"></option>
                    <option value="Điện tử"></option>
                    <option value="Thời trang"></option>
                    <option value="Vật liệu xây dựng"></option>
                    <option value="Khác"></option>
                  </datalist>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Đơn vị tính <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Hộp, Thùng, Lon"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Đơn giá bán (VND)</label>
                  <input
                    type="number"
                    step="1000"
                    placeholder="Ví dụ: 15000"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Kệ kho mặc định</label>
                  <select
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 bg-white"
                    value={formData.location_id}
                    onChange={(e) => setFormData({...formData, location_id: e.target.value})}
                  >
                    <option value="">Chọn kệ chứa</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name} ({loc.location_code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Ngưỡng tối thiểu <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 10"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({...formData, min_stock: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Ngưỡng tối đa <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 10000"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    value={formData.max_stock}
                    onChange={(e) => setFormData({...formData, max_stock: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Mô tả sản phẩm</label>
                <textarea
                  placeholder="Mô tả thêm về sản phẩm..."
                  rows="3"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
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
              <h3 className="text-lg font-bold text-slate-800">Cập nhật sản phẩm</h3>
              <button onClick={() => { setIsEditOpen(false); setSelectedProduct(null); }} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Mã sản phẩm <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: SP001"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    value={formData.product_code}
                    onChange={(e) => setFormData({...formData, product_code: e.target.value})}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Tên sản phẩm <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Sữa tươi Vinamilk"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Danh mục</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Thực phẩm, Đồ khô"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    list="category"
                  />
                  <datalist id="category">
                    <option value="Thực phẩm"></option>
                    <option value="Đồ uống"></option>
                    <option value="Gia dụng"></option>
                    <option value="Điện tử"></option>
                    <option value="Thời trang"></option>
                    <option value="Vật liệu xây dựng"></option>
                    <option value="Khác"></option>
                  </datalist>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Đơn vị tính <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Hộp, Thùng, Lon"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Đơn giá bán (VND)</label>
                  <input
                    type="number"
                    step="1000"
                    placeholder="Ví dụ: 15000"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Kệ kho mặc định</label>
                  <select
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 bg-white"
                    value={formData.location_id}
                    onChange={(e) => setFormData({...formData, location_id: e.target.value})}
                  >
                    <option value="">Chọn kệ chứa</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name} ({loc.location_code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Ngưỡng tối thiểu <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 10"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({...formData, min_stock: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Ngưỡng tối đa <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 10000"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    value={formData.max_stock}
                    onChange={(e) => setFormData({...formData, max_stock: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Mô tả sản phẩm</label>
                <textarea
                  placeholder="Mô tả thêm về sản phẩm..."
                  rows="3"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsEditOpen(false); setSelectedProduct(null); }}
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

export default ProductListPage
