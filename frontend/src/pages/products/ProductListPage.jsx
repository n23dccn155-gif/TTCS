import React, { useEffect, useState } from 'react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import productService from '../../services/productService'

const ProductListPage = () => {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchProducts = async () => {
      const res = await productService.getAll()
      setProducts(res.data)
    }
    fetchProducts()
  }, [])

  const filteredProducts = products.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { key: 'code', title: 'Mã SP' },
    { key: 'name', title: 'Tên sản phẩm' },
    { key: 'category', title: 'Danh mục' },
    { key: 'unit', title: 'Đơn vị' },
    { key: 'stock', title: 'Tồn kho' },
    { key: 'min_stock', title: 'Min Stock' },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) =>
        row.stock < row.min_stock ? (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            Tồn thấp
          </span>
        ) : (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Ổn định
          </span>
        ),
    },
  ]

  const emptyState =
    products.length === 0 ? (
      <EmptyState
        icon="box"
        message="Chưa có sản phẩm nào"
        description="Bạn có thể thêm sản phẩm mới để bắt đầu quản lý kho."
      >
        <button className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600">
          + Thêm sản phẩm
        </button>
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
        description="Quản lý thông tin sản phẩm trong kho"
        action={
          <button className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-600">
            + Thêm sản phẩm
          </button>
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <input
          type="text"
          placeholder="Tìm theo mã hoặc tên sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
        />
      </div>

      <DataTable columns={columns} data={filteredProducts} empty={emptyState} />
    </div>
  )
}

export default ProductListPage
