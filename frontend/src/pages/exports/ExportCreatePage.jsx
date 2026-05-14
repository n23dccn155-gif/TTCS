import React, { useState, useEffect } from 'react'
import exportService from '../../services/exportService'
import productService from '../../services/productService'

const ExportCreatePage = () => {
  const [productOptions, setProductOptions] = useState([])

  const [formData, setFormData] = useState({
    receiptCode: '',
    exportDate: '',
    customerName: '',
    note: '',
  })

  const [items, setItems] = useState([{ productId: '', quantity: '', price: '', totalAmount: 0 }])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productService.getAll()
        setProductOptions(res.data)
      } catch (error) {
        console.error('Lỗi khi tải danh sách sản phẩm:', error)
      }
    }
    fetchProducts()
  }, [])

  const handleFormChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleItemChange = (index, field, value) => {
    const updated = [...items]
    updated[index][field] = value

    // Tính thành tiền
    if (field === 'quantity' || field === 'price') {
      const qty = parseFloat(updated[index].quantity) || 0
      const prc = parseFloat(updated[index].price) || 0
      updated[index].totalAmount = qty * prc
    }

    setItems(updated)
  }

  const addRow = () => {
    setItems([...items, { productId: '', quantity: '', price: '', totalAmount: 0 }])
  }

  const removeRow = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await exportService.create({ ...formData, items })
      alert('Tạo phiếu xuất thành công!')
      setFormData({ receiptCode: '', exportDate: '', customerName: '', note: '' })
      setItems([{ productId: '', quantity: '', price: '', totalAmount: 0 }])
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi tạo phiếu xuất')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800">Tạo phiếu xuất kho</h3>
        <p className="mt-1 text-sm text-slate-500">
          Nhập thông tin phiếu và danh sách sản phẩm cần xuất
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
          <input
            type="text"
            required
            name="receiptCode"
            value={formData.receiptCode}
            onChange={handleFormChange}
            placeholder="Mã phiếu xuất (VD: PX001)"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          />
          <input
            type="date"
            required
            name="exportDate"
            value={formData.exportDate}
            onChange={handleFormChange}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          />
          <input
            type="text"
            name="customerName"
            value={formData.customerName}
            onChange={handleFormChange}
            placeholder="Tên khách hàng / Người nhận"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          />
          <input
            type="text"
            name="note"
            value={formData.note}
            onChange={handleFormChange}
            placeholder="Ghi chú"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-lg font-bold text-slate-800">Chi tiết sản phẩm xuất</h4>
            <button
              type="button"
              onClick={addRow}
              className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600"
            >
              + Thêm dòng
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-5 items-end"
              >
                <select
                  required
                  value={item.productId}
                  onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                  className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
                >
                  <option value="">Chọn sản phẩm</option>
                  {productOptions.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.product_code}) - Tồn: {product.current_stock || 0}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Số lượng"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
                />
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  placeholder="Đơn giá xuất"
                  value={item.price}
                  onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                  className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
                />

                {/* Thành tiền */}
                <div className="flex flex-col space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Thành tiền</span>
                  <input
                    type="text"
                    readOnly
                    value={(item.totalAmount || 0).toLocaleString('vi-VN')}
                    className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 outline-none text-slate-600 font-semibold cursor-not-allowed"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  disabled={items.length === 1}
                  className="rounded-xl bg-red-500 px-4 py-3 font-semibold text-white hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed h-[48px]"
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-indigo-500 px-6 py-3 font-semibold text-white shadow-md shadow-indigo-200 hover:bg-indigo-600"
            >
              Lưu phiếu xuất
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ExportCreatePage