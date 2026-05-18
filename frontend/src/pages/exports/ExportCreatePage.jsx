import React, { useState, useEffect } from 'react'
import exportService from '../../services/exportService'
import productService from '../../services/productService'

const ExportCreatePage = () => {
  const [productOptions, setProductOptions] = useState([])

  const [formData, setFormData] = useState({
    receiptCode: '',
    exportDate: new Date().toISOString().split('T')[0], // Mặc định hôm nay
    customerName: '',
    deliveryAddress: '',
    note: '',
  })

  const [items, setItems] = useState([{ productId: '', productName: '', quantity: '', sellingPrice: '', totalAmount: 0 }])

  // Lấy mã phiếu xuất tiếp theo từ hệ thống
  const fetchNextCode = async () => {
    try {
      const res = await exportService.getNextExportCode()
      if (res.data.success) {
        setFormData((prev) => ({ ...prev, receiptCode: res.data.receipt_code }))
      }
    } catch (error) {
      console.error('Lỗi khi tải mã phiếu xuất:', error)
    }
  }

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
    fetchNextCode()
  }, [])

  const handleFormChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleItemChange = (index, field, value) => {
    const updated = [...items]
    updated[index][field] = value

    if (field === 'productId') {
      let product = productOptions.find((p) => String(p.id) === String(value))
      
      if (!product && value) {
        product = productOptions.find(
          (p) => p.name.toLowerCase() === String(value).toLowerCase() || 
                 (p.product_code && p.product_code.toLowerCase() === String(value).toLowerCase())
        )
      }

      if (product) {
        updated[index].productId = product.id
        updated[index].productName = product.name
        // Điền đơn giá xuất đề xuất (ví dụ đơn giá vốn cộng 20% lợi nhuận)
        updated[index].sellingPrice = product.unit_price ? Math.round(product.unit_price * 1.2) : 0
        
        // Tính lại thành tiền
        const qty = parseFloat(updated[index].quantity) || 0
        updated[index].totalAmount = qty * updated[index].sellingPrice
      } else {
        if (!value) {
          updated[index].productName = ''
          updated[index].sellingPrice = ''
          updated[index].totalAmount = 0
        }
      }
    }

    // Tính thành tiền
    if (field === 'quantity' || field === 'sellingPrice') {
      const qty = parseFloat(field === 'quantity' ? value : updated[index].quantity) || 0
      const prc = parseFloat(field === 'sellingPrice' ? value : updated[index].sellingPrice) || 0
      updated[index].totalAmount = qty * prc
    }

    setItems(updated)
  }

  const addRow = () => {
    setItems([...items, { productId: '', productName: '', quantity: '', sellingPrice: '', totalAmount: 0 }])
  }

  const removeRow = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate số lượng tồn kho trước khi gửi
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const prod = productOptions.find(p => String(p.id) === String(item.productId));
      if (prod) {
        const totalRequested = items
          .filter(it => String(it.productId) === String(item.productId))
          .reduce((sum, it) => sum + (parseInt(it.quantity) || 0), 0);
        
        const currentStock = prod.current_stock || 0;
        if (totalRequested > currentStock) {
          alert(`Lỗi: Không thể xuất sản phẩm "${prod.name}" vượt quá số lượng tồn kho thực tế! (Yêu cầu: ${totalRequested}, Hiện có: ${currentStock}).`);
          return;
        }
      }
    }

    try {
      await exportService.create({ ...formData, items })
      alert('Tạo phiếu xuất thành công!')
      setFormData({ 
        receiptCode: '', 
        exportDate: new Date().toISOString().split('T')[0], 
        customerName: '', 
        deliveryAddress: '', 
        note: '' 
      })
      setItems([{ productId: '', productName: '', quantity: '', sellingPrice: '', totalAmount: 0 }])
      fetchNextCode() // Lấy mã cho phiếu xuất tiếp theo
    } catch (error) {
      alert(error.response?.data?.error || error.response?.data?.message || 'Lỗi khi tạo phiếu xuất')
    }
  }

  const selectedProductIds = items.map(item => item.productId).filter(Boolean)

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800">Tạo phiếu xuất kho</h3>
        <p className="mt-1 text-sm text-slate-500">
          Nhập thông tin phiếu và danh sách sản phẩm cần xuất kho (Đóng gói FEFO tự động ở Backend)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
          
          {/* Mã phiếu xuất - Read-only (Tự sinh) */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Mã phiếu xuất</label>
            <input
              type="text"
              readOnly
              required
              name="receiptCode"
              value={formData.receiptCode}
              placeholder="Đang tải mã phiếu xuất..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none text-slate-600 font-bold cursor-not-allowed shadow-inner"
            />
          </div>

          {/* Ngày xuất */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Ngày xuất</label>
            <input
              type="date"
              required
              name="exportDate"
              value={formData.exportDate}
              onChange={handleFormChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            />
          </div>

          {/* Tên khách hàng */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Người nhận / Khách hàng</label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleFormChange}
              placeholder="Nhập tên khách hàng hoặc người nhận..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            />
          </div>

          {/* Địa chỉ giao hàng */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Địa chỉ giao hàng</label>
            <input
              type="text"
              name="deliveryAddress"
              value={formData.deliveryAddress}
              onChange={handleFormChange}
              placeholder="Nhập địa chỉ giao hàng..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            />
          </div>

          {/* Ghi chú */}
          <div className="flex flex-col space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Ghi chú phiếu xuất</label>
            <input
              type="text"
              name="note"
              value={formData.note}
              onChange={handleFormChange}
              placeholder="Nhập ghi chú phiếu xuất hàng..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-lg font-bold text-slate-800">Chi tiết sản phẩm xuất</h4>
            <button
              type="button"
              onClick={addRow}
              className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600 shadow-sm"
            >
              + Thêm dòng
            </button>
          </div>

          <div className="space-y-6">
            {items.map((item, index) => {
              const product = productOptions.find(p => String(p.id) === String(item.productId))
              const isDuplicated = item.productId && selectedProductIds.filter(id => String(id) === String(item.productId)).length > 1
              
              // Tính tổng lượng yêu cầu xuất của sản phẩm này trên form
              const totalProductRequested = items
                .filter(it => String(it.productId) === String(item.productId))
                .reduce((sum, it) => sum + (parseInt(it.quantity) || 0), 0)

              // Kiểm tra cảnh báo quá tải tồn kho
              let stockWarning = ''
              if (product && item.quantity) {
                const currentStock = product.current_stock || 0
                if (totalProductRequested > currentStock) {
                  stockWarning = `Vượt quá tồn kho thực tế! (Trong kho: ${currentStock}, Yêu cầu xuất: ${totalProductRequested}).`
                }
              }

              return (
                <div
                  key={index}
                  className={`flex flex-col space-y-3 rounded-2xl border p-5 transition-all ${
                    isDuplicated || stockWarning ? 'border-red-200 bg-red-50/10' : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-6 items-end">
                    
                    {/* Chọn Sản Phẩm (ID / Searchable Dropdown) */}
                    <div className="relative flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">ID sản phẩm</label>
                      <input
                        type="text"
                        required
                        list={`export-product-list-${index}`}
                        placeholder="Nhập ID..."
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                        className={`w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-500 ${
                          isDuplicated || stockWarning ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:ring-cyan-200'
                        }`}
                      />
                      <datalist id={`export-product-list-${index}`}>
                        {productOptions.map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            {prod.id} - {prod.name} (Tồn: {prod.current_stock || 0})
                          </option>
                        ))}
                      </datalist>
                    </div>

                    {/* Tên sản phẩm */}
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tên sản phẩm</label>
                      <input
                        type="text"
                        placeholder="Tên sản phẩm"
                        readOnly
                        value={item.productName || ''}
                        className="rounded-xl border border-slate-300 bg-slate-100/80 text-slate-500 cursor-not-allowed font-semibold px-3 py-2 outline-none"
                      />
                    </div>

                    {/* Số lượng xuất */}
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Số lượng xuất</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="Số lượng"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className={`rounded-xl border px-3 py-2 outline-none focus:border-cyan-500 ${
                          stockWarning ? 'border-red-400 bg-red-50/5' : 'border-slate-300'
                        }`}
                      />
                    </div>

                    {/* Đơn giá xuất */}
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Đơn giá xuất (VNĐ)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1000"
                        placeholder="Đơn giá xuất"
                        value={item.sellingPrice}
                        onChange={(e) => handleItemChange(index, 'sellingPrice', e.target.value)}
                        className="rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-cyan-500"
                      />
                    </div>

                    {/* Thành tiền */}
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Thành tiền</label>
                      <input
                        type="text"
                        readOnly
                        value={(item.totalAmount || 0).toLocaleString('vi-VN')}
                        className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 outline-none text-slate-600 font-bold cursor-not-allowed"
                      />
                    </div>

                  </div>

                  {/* Cảnh báo & Thông tin hỗ trợ */}
                  <div className="flex flex-col space-y-1">
                    
                    {/* Cảnh báo lặp dòng */}
                    {isDuplicated && (
                      <span className="text-amber-600 text-xs font-bold flex items-center space-x-1">
                        ⚠️ Cảnh báo: Trùng lặp sản phẩm xuất trên nhiều dòng.
                      </span>
                    )}

                    {/* Cảnh báo thiếu tồn kho */}
                    {stockWarning && (
                      <span className="text-red-500 text-xs font-bold flex items-center space-x-1 animate-pulse">
                        ❌ {stockWarning}
                      </span>
                    )}

                    {/* Hiển thị phân khu / tồn kho thực tế */}
                    {product && (
                      <span className="text-slate-400 text-xs font-medium">
                        ➔ Danh mục: <span className="font-semibold text-slate-600">{product.category}</span> | Tồn thực tế: <span className="font-bold text-indigo-600">{product.current_stock || 0} đơn vị</span>
                      </span>
                    )}
                  </div>

                  {/* Xóa dòng */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      disabled={items.length === 1}
                      className="rounded-xl bg-red-50 px-3 py-1 text-xs font-bold text-red-600 border border-red-100 hover:bg-red-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
                    >
                      Xóa dòng
                    </button>
                  </div>

                </div>
              )
            })}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-indigo-500 px-6 py-3 font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-600 transition-all active:scale-95"
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