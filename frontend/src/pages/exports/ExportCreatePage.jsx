import React, { useState } from 'react'
import exportService from '../../services/exportService'

const productOptions = [
  { id: 1, name: 'Sữa tươi Vinamilk' },
  { id: 2, name: 'Mì Hảo Hảo' },
  { id: 3, name: 'Coca Cola' },
]

const ExportCreatePage = () => {
  const [formData, setFormData] = useState({
    receiptCode: 'PX003',
    exportDate: '',
    reason: '',
    note: '',
  })

  const [items, setItems] = useState([{ productId: '', quantity: '' }])

  const handleFormChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleItemChange = (index, field, value) => {
    const updated = [...items]
    updated[index][field] = value
    setItems(updated)
  }

  const addRow = () => {
    setItems([...items, { productId: '', quantity: '' }])
  }

  const removeRow = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await exportService.create({ ...formData, items })
    alert('Tạo phiếu xuất thành công (demo)')
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800">Tạo phiếu xuất kho</h3>
        <p className="mt-1 text-sm text-slate-500">
          Lập phiếu xuất và kiểm tra số lượng tồn trước khi lưu
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
          <input
            type="text"
            name="receiptCode"
            value={formData.receiptCode}
            onChange={handleFormChange}
            placeholder="Mã phiếu xuất"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          />
          <input
            type="date"
            name="exportDate"
            value={formData.exportDate}
            onChange={handleFormChange}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          />
          <input
            type="text"
            name="reason"
            value={formData.reason}
            onChange={handleFormChange}
            placeholder="Lý do xuất"
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
                className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3"
              >
                <select
                  value={item.productId}
                  onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                  className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
                >
                  <option value="">Chọn sản phẩm</option>
                  {productOptions.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Số lượng xuất"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
                />

                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="rounded-xl bg-red-500 px-4 py-3 font-semibold text-white hover:bg-red-600"
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white hover:bg-emerald-600"
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