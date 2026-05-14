import React, { useState, useEffect } from 'react'
import importService from '../../services/importService'
import productService from '../../services/productService'
import supplierService from '../../services/supplierService'
import locationService from '../../services/locationService'

const ImportCreatePage = () => {
  const [productOptions, setProductOptions] = useState([])
  const [supplierOptions, setSupplierOptions] = useState([])
  const [locationOptions, setLocationOptions] = useState([])
  
  const [formData, setFormData] = useState({
    receiptCode: '',
    importDate: '',
    supplierId: '',
    note: '',
  })

  const [items, setItems] = useState([
    { productId: '', productName: '', quantity: '', price: '', totalAmount: 0, expiryDate: '', locationId: '', isNewProduct: true },
  ])

  useEffect(() => {
    // Fetch danh sách sản phẩm, nhà cung cấp và vị trí kệ từ DB
    const fetchOptions = async () => {
      try {
        const [prodRes, supRes, locRes] = await Promise.all([
          productService.getAll(),
          supplierService.getAll(),
          locationService.getAvailable()
        ])
        setProductOptions(prodRes.data)
        setSupplierOptions(supRes.data)
        setLocationOptions(locRes.data)
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error)
      }
    }
    fetchOptions()
  }, [])

  const handleFormChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleItemChange = (index, field, value) => {
    const updated = [...items]
    updated[index][field] = value

    // Tự động điền tên sản phẩm nếu nhập ID
    if (field === 'productId') {
      const product = productOptions.find((p) => String(p.id) === String(value))
      if (product) {
        updated[index].productName = product.name
        updated[index].isNewProduct = false
      } else {
        updated[index].isNewProduct = true
      }
    }

    // Tính thành tiền
    if (field === 'quantity' || field === 'price') {
      const qty = parseFloat(updated[index].quantity) || 0
      const prc = parseFloat(updated[index].price) || 0
      updated[index].totalAmount = qty * prc
    }
    setItems(updated)
  }

  const addRow = () => {
    setItems([
      ...items,
      { productId: '', productName: '', quantity: '', price: '', totalAmount: 0, expiryDate: '', locationId: '', isNewProduct: true },
    ])
  }

  const removeRow = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await importService.create({ ...formData, items })
      alert('Tạo phiếu nhập thành công!')
      // Reset form sau khi tạo xong
      setFormData({ receiptCode: '', importDate: '', supplierId: '', note: '' })
      setItems([{ productId: '', productName: '', quantity: '', price: '', totalAmount: 0, expiryDate: '', locationId: '', isNewProduct: true }])
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi tạo phiếu nhập')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800">Tạo phiếu nhập kho</h3>
        <p className="mt-1 text-sm text-slate-500">
          Nhập thông tin phiếu và danh sách sản phẩm cần nhập
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
            placeholder="Mã phiếu nhập (VD: PN001)"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          />
          <input
            type="date"
            required
            name="importDate"
            value={formData.importDate}
            onChange={handleFormChange}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          />
          <div className="relative">
            <input
              type="text"
              name="supplierId"
              required
              list="supplier-list"
              value={formData.supplierId}
              onChange={handleFormChange}
              placeholder="Nhập nhà cung cấp (ID hoặc chọn từ danh sách)"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            />
            <datalist id="supplier-list">
              {supplierOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </datalist>
          </div>
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
            <h4 className="text-lg font-bold text-slate-800">Chi tiết sản phẩm nhập</h4>
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
                className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-8 items-end"
              >
                <div className="relative">
                  <input
                    type="text"
                    required
                    list={`product-list-${index}`}
                    placeholder="Nhập ID"
                    value={item.productId}
                    onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
                  />
                  <datalist id={`product-list-${index}`}>
                    {productOptions.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </datalist>
                </div>

                <input
                  type="text"
                  placeholder="Tên sản phẩm"
                  readOnly={!item.isNewProduct}
                  value={item.productName || ''}
                  onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                  className={`rounded-xl border border-slate-300 px-4 py-3 outline-none ${
                    !item.isNewProduct 
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed' 
                      : 'bg-white text-slate-800 focus:border-cyan-500'
                  }`}
                />

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
                  placeholder="Đơn giá nhập"
                  value={item.price}
                  onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                  className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
                />
                <input
                  type="date"
                  required
                  value={item.expiryDate}
                  onChange={(e) => handleItemChange(index, 'expiryDate', e.target.value)}
                  className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
                />

                <select
                  value={item.locationId}
                  onChange={(e) => handleItemChange(index, 'locationId', e.target.value)}
                  className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 bg-white"
                >
                  <option value="">Chọn kệ cất</option>
                  {locationOptions.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.location_code}) - Trống: {loc.max_capacity - (loc.current_occupied || 0)}
                    </option>
                  ))}
                </select>

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
              className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white shadow-md shadow-emerald-200 hover:bg-emerald-600"
            >
              Lưu phiếu nhập
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ImportCreatePage