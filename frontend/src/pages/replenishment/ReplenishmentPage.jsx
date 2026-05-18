import React, { useState, useEffect } from 'react'
import { 
  Lightbulb, 
  ArrowRight, 
  CheckCircle, 
  Loader, 
  Truck, 
  AlertTriangle, 
  FilePlus, 
  Phone, 
  Clock, 
  ShoppingBag, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react'
import inventoryService from '../../services/inventoryService'
import importService from '../../services/importService'
import { formatCurrency } from '../../utils/format'

const ReplenishmentPage = () => {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [approvingSupplierId, setApprovingSupplierId] = useState(null)
  const [successInfo, setSuccessInfo] = useState(null)
  const [error, setError] = useState(null)
  const [expandedSuppliers, setExpandedSuppliers] = useState({})

  const fetchSuggestions = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await inventoryService.getReplenishmentSuggestions()
      if (response && response.data) {
        setSuggestions(response.data.suggestions || [])
        // Mở rộng tất cả các nhà cung cấp theo mặc định để dễ nhìn
        const defaultExpanded = {}
        ;(response.data.suggestions || []).forEach(s => {
          defaultExpanded[s.supplier_id] = true
        })
        setExpandedSuppliers(defaultExpanded)
      }
    } catch (err) {
      console.error(err)
      setError('Không thể tải đề xuất bổ hàng tự động. Vui lòng liên hệ quản trị hệ thống.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuggestions()
  }, [])

  const toggleSupplier = (id) => {
    setExpandedSuppliers(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const handleApprove = async (supplierId, items) => {
    try {
      setApprovingSupplierId(supplierId)
      setError(null)
      setSuccessInfo(null)

      // Chuẩn bị payload khớp với định dạng tạo phiếu nhập
      // Backend bắt buộc điền batch_code, mfg_date, expiry_date
      // Chúng ta sẽ tự động tạo mã lô theo thời gian hiện tại
      const todayStr = new Date().toISOString().split('T')[0]
      // NSX mặc định hôm nay, HSD mặc định hôm nay + 1 năm
      const mfgDate = todayStr
      const expiryDate = new Date()
      expiryDate.setFullYear(expiryDate.getFullYear() + 1)
      const expiryStr = expiryDate.toISOString().split('T')[0]

      const payload = {
        supplier_id: supplierId,
        import_date: todayStr,
        note: `Phiếu nhập tự động tạo từ Đề xuất Bổ hàng hệ thống WMS`,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.suggested_qty,
          unit_price: item.unit_price,
          batch_code: `AUTO-${item.product_code}-${todayStr.replace(/-/g, '')}`,
          mfg_date: mfgDate,
          expiry_date: expiryStr
        }))
      }

      const res = await importService.create(payload)
      if (res && res.data) {
        setSuccessInfo({
          supplierName: suggestions.find(s => s.supplier_id === supplierId)?.supplier_name,
          receiptCode: res.data.receipt_code,
          totalAmount: res.data.total_amount || 0
        })
        // Tải lại danh sách đề xuất
        await fetchSuggestions()
      }
    } catch (err) {
      console.error(err)
      const errMsg = err.response?.data?.error || 'Đã xảy ra lỗi hệ thống khi duyệt phiếu nhập.'
      setError(errMsg)
    } finally {
      setApprovingSupplierId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto h-12 w-12 animate-spin text-cyan-500" />
          <p className="mt-4 text-slate-500 font-medium dark:text-slate-400">Đang phân tích tồn kho và lập bảng đề xuất tự động...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Gradient Premium Header strip */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-800 to-indigo-950 p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 backdrop-blur-md">
                <Lightbulb className="h-6 w-6" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight">Đề xuất Tái bổ hàng Tự động</h1>
            </div>
            <p className="mt-2 text-slate-300 text-sm max-w-2xl">
              Hệ thống quét tồn kho thông minh qua <code className="bg-slate-900/50 px-1 py-0.5 rounded text-cyan-300">v_stock_balance</code>, 
              tự động so sánh giá nhập hợp đồng từ các nhà cung cấp, và lập kế hoạch mua hàng tối ưu nhất để tránh đứt gãy chuỗi cung ứng.
            </p>
          </div>
          <button 
            onClick={fetchSuggestions}
            className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-500/20 active:scale-95"
          >
            Quét Lại Kho Hàng
          </button>
        </div>
      </div>

      {/* Success notification banner */}
      {successInfo && (
        <div className="rounded-2xl border border-green-200 bg-green-50/80 p-4 text-green-800 dark:bg-green-950/20 dark:border-green-900/50 dark:text-green-300 backdrop-blur-md flex items-start gap-3 shadow-md animate-fade-in">
          <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-base">Phê duyệt & Tạo đơn hàng thành công!</h4>
            <p className="mt-1 text-sm">
              Đã tự động lập phiếu nhập kho <strong className="font-semibold text-green-700 dark:text-green-400">{successInfo.receiptCode}</strong> từ nhà cung cấp <strong className="font-semibold">{successInfo.supplierName}</strong>. 
              Tổng giá trị nhập dự kiến: <strong className="font-semibold">{formatCurrency(successInfo.totalAmount)} đ</strong>.
            </p>
          </div>
          <button 
            onClick={() => setSuccessInfo(null)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Error notification banner */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-red-800 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-300 backdrop-blur-md flex items-start gap-3 shadow-md">
          <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-base">Lỗi khi thực hiện giao dịch</h4>
            <p className="mt-1 text-sm">{error}</p>
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            Bỏ qua
          </button>
        </div>
      )}

      {/* Suggested orders list grouped by Supplier */}
      {suggestions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900/50 shadow-sm">
          <ShoppingBag className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-700" />
          <h3 className="mt-4 text-lg font-bold text-slate-800 dark:text-slate-200">Kho hàng đạt trạng thái lý tưởng!</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Không phát hiện sản phẩm nào có lượng tồn kho thực tế thấp hơn ngưỡng an toàn tối thiểu (<code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">min_stock</code>). Không cần bổ sung vào lúc này.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              Danh sách đề xuất ({suggestions.length} nhà cung cấp tối ưu)
            </h2>
            <span className="text-xs font-medium text-slate-500">
              Nhấp vào đầu thẻ để thu gọn / mở rộng chi tiết các mặt hàng
            </span>
          </div>

          {suggestions.map((sup) => {
            const isExpanded = !!expandedSuppliers[sup.supplier_id]
            const isApproving = approvingSupplierId === sup.supplier_id

            return (
              <div 
                key={sup.supplier_id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow dark:border-slate-850 dark:bg-slate-900"
              >
                {/* Supplier Card Header - Clicking toggles expand/collapse */}
                <div 
                  onClick={() => toggleSupplier(sup.supplier_id)}
                  className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800 cursor-pointer select-none"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                      <Truck className="h-6 w-6" />
                    </span>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 hover:text-cyan-500 transition-colors">
                        {sup.supplier_name}
                      </h3>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {sup.supplier_phone || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Thời gian giao: ~{sup.max_lead_time_days} ngày
                        </span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                          {sup.items.length} mặt hàng cần nhập
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-15 lg:ml-0" onClick={e => e.stopPropagation()}>
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tổng giá ước tính</p>
                      <p className="text-xl font-extrabold text-cyan-600 dark:text-cyan-400">
                        {formatCurrency(sup.total_estimated_amount)} đ
                      </p>
                    </div>

                    <button
                      disabled={isApproving}
                      onClick={() => handleApprove(sup.supplier_id, sup.items)}
                      className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-3 transition-colors active:scale-95 disabled:opacity-50"
                    >
                      {isApproving ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          Đang duyệt...
                        </>
                      ) : (
                        <>
                          <FilePlus className="h-4 w-4" />
                          Lập Phiếu Nhập
                        </>
                      )}
                    </button>

                    {/* Expand indicator icon */}
                    <div onClick={() => toggleSupplier(sup.supplier_id)} className="p-1 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>
                </div>

                {/* Items Detail Table (Collapsible) */}
                {isExpanded && (
                  <div className="p-5 overflow-x-auto animate-slide-down">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-350">
                      <thead className="bg-slate-50 dark:bg-slate-800/40 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3 rounded-l-xl">Mã SP</th>
                          <th className="px-4 py-3">Tên sản phẩm</th>
                          <th className="px-4 py-3">Danh mục</th>
                          <th className="px-4 py-3 text-center">Tồn kho</th>
                          <th className="px-4 py-3 text-center">Tối thiểu</th>
                          <th className="px-4 py-3 text-center">Thiếu hụt</th>
                          <th className="px-4 py-3 text-center text-indigo-600 dark:text-indigo-400 font-bold">Đề xuất nhập</th>
                          <th className="px-4 py-3 text-right">Đơn giá hợp đồng</th>
                          <th className="px-4 py-3 text-right rounded-r-xl">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {sup.items.map((item) => (
                          <tr key={item.product_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                            <td className="px-4 py-3.5 font-mono text-xs font-semibold">{item.product_code}</td>
                            <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">{item.product_name}</td>
                            <td className="px-4 py-3.5">
                              <span className="inline-block rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400">
                                {item.category}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center text-red-500 font-semibold">{item.current_stock} {item.unit}</td>
                            <td className="px-4 py-3.5 text-center font-medium text-slate-400">{item.min_stock} {item.unit}</td>
                            <td className="px-4 py-3.5 text-center">
                              <span className="inline-block rounded-md bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400 px-2 py-0.5 text-xs font-bold">
                                -{item.shortage}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center font-extrabold text-indigo-600 dark:text-indigo-400 text-base">
                              {item.suggested_qty} {item.unit}
                            </td>
                            <td className="px-4 py-3.5 text-right font-medium">{formatCurrency(item.unit_price)} đ</td>
                            <td className="px-4 py-3.5 text-right font-bold text-slate-900 dark:text-white">
                              {formatCurrency(item.estimated_amount)} đ
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ReplenishmentPage
