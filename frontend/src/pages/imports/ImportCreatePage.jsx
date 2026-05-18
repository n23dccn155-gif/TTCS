import React, { useState, useEffect } from 'react'
import importService from '../../services/importService'
import productService from '../../services/productService'
import supplierService from '../../services/supplierService'
import locationService from '../../services/locationService'

const ImportCreatePage = () => {
  const [allProducts, setAllProducts] = useState([])        // toàn bộ sản phẩm
  const [productOptions, setProductOptions] = useState([])  // sản phẩm đã lọc theo NCC
  const [supplierOptions, setSupplierOptions] = useState([])
  const [locationOptions, setLocationOptions] = useState([])
  
  const [formData, setFormData] = useState({
    receiptCode: '',
    importDate: new Date().toISOString().split('T')[0], // Mặc định là ngày hôm nay
    supplierId: '',
    note: '',
  })

  const [items, setItems] = useState([
    { productId: '', productName: '', quantity: '', price: '', totalAmount: 0, mfgDate: '', expiryDate: '', locationId: '', isNewProduct: true },
  ])

  // Lấy mã phiếu nhập tiếp theo từ hệ thống
  const fetchNextCode = async () => {
    try {
      const codeRes = await importService.getNextImportCode()
      if (codeRes.data.success) {
        setFormData((prev) => ({ ...prev, receiptCode: codeRes.data.receipt_code }))
      }
    } catch (error) {
      console.error('Lỗi khi lấy mã phiếu tiếp theo:', error)
    }
  }

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [prodRes, supRes, locRes] = await Promise.all([
          productService.getAll(),
          supplierService.getAll(),
          locationService.getAvailable()
        ])
        setAllProducts(prodRes.data)
        setProductOptions(prodRes.data)  // mặc định hiện tất cả
        setSupplierOptions(supRes.data)
        setLocationOptions(locRes.data)
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error)
      }
    }
    fetchOptions()
    fetchNextCode()
  }, [])

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Khi chọn nhà cung cấp, lọc danh sách sản phẩm
    if (name === 'supplierId') {
      if (value) {
        const sid = parseInt(value)
        const filtered = allProducts.filter(p => p.supplier_ids && p.supplier_ids.includes(sid))
        setProductOptions(filtered.length > 0 ? filtered : allProducts)
      } else {
        setProductOptions(allProducts)
      }
      // Reset item sản phẩm khi đổi NCC
      setItems([{ productId: '', productName: '', quantity: '', price: '', totalAmount: 0, mfgDate: '', expiryDate: '', locationId: '', isNewProduct: true }])
    }
  }

  const handleItemChange = (index, field, value) => {
    const updated = [...items]
    updated[index][field] = value

    // Tự động điền tên sản phẩm và đơn giá chuẩn nếu nhập ID
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
        updated[index].price = product.unit_price || 0 // Khóa cứng theo giá chuẩn
        updated[index].isNewProduct = false
        
        // Tính lại thành tiền
        const qty = parseFloat(updated[index].quantity) || 0
        updated[index].totalAmount = qty * (product.unit_price || 0)
      } else {
        updated[index].isNewProduct = true
        if (!value) {
          updated[index].productName = ''
          updated[index].price = ''
          updated[index].totalAmount = 0
        }
      }
    }

    // Tính thành tiền khi thay đổi số lượng
    if (field === 'quantity') {
      const qty = parseFloat(value) || 0
      const prc = parseFloat(updated[index].price) || 0
      updated[index].totalAmount = qty * prc
    }

    setItems(updated)
  }

  const addRow = () => {
    setItems([
      ...items,
      { productId: '', productName: '', quantity: '', price: '', totalAmount: 0, mfgDate: '', expiryDate: '', locationId: '', isNewProduct: true },
    ])
  }

  const removeRow = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate trước khi submit: Check NSX < HSD
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.mfgDate && item.expiryDate) {
        if (new Date(item.mfgDate) >= new Date(item.expiryDate)) {
          alert(`Lỗi dòng ${i + 1}: Ngày sản xuất (NSX) phải nhỏ hơn Hạn sử dụng (HSD) cho sản phẩm "${item.productName}".`);
          return;
        }
      }
    }

    try {
      await importService.create({ ...formData, items })
      alert('Tạo phiếu nhập thành công!')
      // Reset form sau khi tạo xong
      setFormData({ 
        receiptCode: '', 
        importDate: new Date().toISOString().split('T')[0], 
        supplierId: '', 
        note: '' 
      })
      setItems([{ productId: '', productName: '', quantity: '', price: '', totalAmount: 0, mfgDate: '', expiryDate: '', locationId: '', isNewProduct: true }])
      fetchNextCode() // Lấy mã phiếu tiếp theo cho lượt sau
    } catch (error) {
      alert(error.response?.data?.error || error.response?.data?.message || 'Lỗi khi tạo phiếu nhập')
    }
  }

  // Phục vụ cảnh báo trùng lặp & Sức chứa phân khu
  const selectedProductIds = items.map(item => item.productId).filter(Boolean)
  const selectedSupplier = supplierOptions.find(s => String(s.id) === String(formData.supplierId))

  const getCategoryFormTotal = (categoryName) => {
    return items.reduce((sum, item) => {
      if (item.productId && item.quantity) {
        const prod = productOptions.find(p => String(p.id) === String(item.productId))
        if (prod && prod.category === categoryName) {
          return sum + (parseInt(item.quantity) || 0)
        }
      }
      return sum
    }, 0)
  }

  const getZoneFreeCapacity = (categoryName) => {
    const zoneShelves = locationOptions.filter(l => l.zone === categoryName)
    return zoneShelves.reduce((acc, curr) => acc + (curr.max_capacity - (curr.current_occupied || 0)), 0)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800">Tạo phiếu nhập kho</h3>
        <p className="mt-1 text-sm text-slate-500">
          Nhập thông tin phiếu và danh sách sản phẩm cần nhập vào các phân khu kệ hàng phù hợp
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
          
          {/* Mã phiếu nhập - Read-only (Tự sinh) */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Mã phiếu nhập</label>
            <input
              type="text"
              readOnly
              required
              name="receiptCode"
              value={formData.receiptCode}
              placeholder="Đang tải mã phiếu..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none text-slate-600 font-bold cursor-not-allowed shadow-inner"
            />
          </div>

          {/* Ngày nhập */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Ngày nhập</label>
            <input
              type="date"
              required
              name="importDate"
              value={formData.importDate}
              onChange={handleFormChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            />
          </div>

          {/* Nhà cung cấp */}
          <div className="flex flex-col space-y-1 relative">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nhà cung cấp</label>
            <input
              type="text"
              name="supplierId"
              required
              list="supplier-list"
              value={formData.supplierId}
              onChange={handleFormChange}
              placeholder="Nhập hoặc chọn nhà cung cấp từ danh sách..."
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

          {/* Ghi chú */}
          <div className="flex flex-col space-y-1 justify-end">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Ghi chú</label>
            <input
              type="text"
              name="note"
              value={formData.note}
              onChange={handleFormChange}
              placeholder="Nhập ghi chú phiếu nhập..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            />
          </div>

          {/* Thông tin liên hệ nhà cung cấp (Mới - Tự động hiển thị) */}
          {selectedSupplier && (
            <div className="md:col-span-2 rounded-xl bg-cyan-50/50 border border-cyan-100 p-4 flex items-center space-x-3 text-cyan-800 text-sm animate-fade-in">
              <svg className="w-5 h-5 text-cyan-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div>
                <span className="font-bold">Người liên hệ NCC:</span>{' '}
                <span className="font-semibold text-cyan-900">{selectedSupplier.contact_person || 'Không có'}</span>
                {selectedSupplier.phone && <span className="mx-2">|</span>}
                {selectedSupplier.phone && (
                  <>
                    <span className="font-bold">SĐT:</span>{' '}
                    <span className="font-semibold text-cyan-900">{selectedSupplier.phone}</span>
                  </>
                )}
                {selectedSupplier.email && <span className="mx-2">|</span>}
                {selectedSupplier.email && (
                  <>
                    <span className="font-bold">Email:</span>{' '}
                    <span className="font-semibold text-cyan-900">{selectedSupplier.email}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-lg font-bold text-slate-800">Chi tiết sản phẩm nhập</h4>
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
              
              // Tính toán cảnh báo sức chứa phân khu
              let capacityWarning = ''
              if (product && item.quantity) {
                const zoneFree = getZoneFreeCapacity(product.category)
                const formTotalForZone = getCategoryFormTotal(product.category)
                if (formTotalForZone > zoneFree) {
                  capacityWarning = `Phân khu "${product.category}" không đủ sức chứa trống! (Cần: ${formTotalForZone}, Cực đại trống: ${zoneFree}).`
                }
              }

              return (
                <div
                  key={index}
                  className={`flex flex-col space-y-3 rounded-2xl border p-5 transition-all ${
                    isDuplicated ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-8 items-end">
                    
                    {/* Chọn Sản Phẩm (ID / Searchable Dropdown) */}
                    <div className="relative flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">ID sản phẩm</label>
                      <input
                        type="text"
                        required
                        list={`product-list-${index}`}
                        placeholder="Nhập ID..."
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                        className={`w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-500 ${
                          isDuplicated ? 'border-amber-400 focus:ring-amber-200' : 'border-slate-300 focus:ring-cyan-200'
                        }`}
                      />
                      <datalist id={`product-list-${index}`}>
                        {productOptions.map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            {prod.id} - {prod.name}
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
                        readOnly={!item.isNewProduct}
                        value={item.productName || ''}
                        onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                        className={`rounded-xl border border-slate-300 px-3 py-2 outline-none ${
                          !item.isNewProduct 
                            ? 'bg-slate-100/80 text-slate-500 cursor-not-allowed font-semibold' 
                            : 'bg-white text-slate-800 focus:border-cyan-500'
                        }`}
                      />
                    </div>

                    {/* Số lượng */}
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Số lượng</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="Số lượng"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-cyan-500"
                      />
                    </div>

                    {/* Đơn giá nhập (Locked - Read-only) */}
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Đơn giá</label>
                      <input
                        type="text"
                        readOnly
                        placeholder="Đơn giá nhập"
                        value={item.price ? item.price.toLocaleString('vi-VN') + ' đ' : '0 đ'}
                        className="rounded-xl border border-slate-300 bg-slate-100/80 text-slate-500 cursor-not-allowed font-semibold px-3 py-2 outline-none"
                      />
                    </div>

                    {/* Ngày sản xuất (NSX) - Mới */}
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 text-cyan-700">Ngày SX (NSX)</label>
                      <input
                        type="date"
                        required
                        value={item.mfgDate}
                        onChange={(e) => handleItemChange(index, 'mfgDate', e.target.value)}
                        className="rounded-xl border border-slate-300 px-2 py-2 outline-none focus:border-cyan-500 text-sm"
                      />
                    </div>

                    {/* Hạn sử dụng (HSD) */}
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 text-cyan-700">Hạn dùng (HSD)</label>
                      <input
                        type="date"
                        required
                        value={item.expiryDate}
                        onChange={(e) => handleItemChange(index, 'expiryDate', e.target.value)}
                        className="rounded-xl border border-slate-300 px-2 py-2 outline-none focus:border-cyan-500 text-sm"
                      />
                    </div>

                    {/* Kệ cất hàng (Mới: Mặc định là Tự động) */}
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Kệ cất hàng</label>
                      <select
                        value={item.locationId}
                        onChange={(e) => handleItemChange(index, 'locationId', e.target.value)}
                        className="rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-cyan-500 bg-white text-sm"
                      >
                        <option value="">Tự động xếp (Best-Fit)</option>
                        {locationOptions
                          .filter(loc => !product || loc.zone === product.category) // Lọc kệ thuộc phân khu phù hợp
                          .map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              {loc.location_code} - Trống: {loc.max_capacity - (loc.current_occupied || 0)}
                            </option>
                          ))}
                      </select>
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
                    
                    {/* Cảnh báo trùng lặp dòng */}
                    {isDuplicated && (
                      <span className="text-amber-600 text-xs font-bold flex items-center space-x-1">
                        ⚠️ Cảnh báo: Sản phẩm bị lặp. Hệ thống sẽ cộng dồn số lượng khi nhập.
                      </span>
                    )}

                    {/* Cảnh báo quá tải phân khu */}
                    {capacityWarning && (
                      <span className="text-red-500 text-xs font-bold flex items-center space-x-1 animate-pulse">
                        ❌ {capacityWarning}
                      </span>
                    )}

                    {/* Nhãn hiển thị phân khu đích */}
                    {product && (
                      <span className="text-slate-400 text-xs font-medium">
                        ➔ Danh mục: <span className="font-semibold text-slate-600">{product.category}</span> | Sức chứa trống tối đa cả khu: <span className="font-semibold text-slate-600">{getZoneFreeCapacity(product.category)} đơn vị</span>
                      </span>
                    )}
                  </div>

                  {/* Nút xóa dòng */}
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
              className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white shadow-md shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-95"
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