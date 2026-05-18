import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import exportService from '../../services/exportService'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import { ArrowLeft, Printer } from 'lucide-react'

const ExportDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [receipt, setReceipt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await exportService.getById(id)
        setReceipt(res.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể tải chi tiết phiếu xuất')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
        <p className="font-semibold">{error || 'Phiếu xuất không tồn tại'}</p>
        <button onClick={() => navigate('/exports')} className="mt-4 text-sm underline">
          Quay lại danh sách
        </button>
      </div>
    )
  }

  const formatCurrency = (val) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)

  const handlePrint = () => {
    window.print()
  }

  const columns = [
    { key: 'product_name', title: 'Sản phẩm' },
    { key: 'product_unit', title: 'Đơn vị' },
    { key: 'quantity', title: 'Số lượng' },
    { key: 'selling_price', title: 'Đơn giá xuất', render: (row) => formatCurrency(row.selling_price) },
    { key: 'total', title: 'Thành tiền', render: (row) => <span className="font-semibold text-slate-800">{formatCurrency(row.quantity * row.selling_price)}</span> },
  ]

  const actionButton = (
    <div className="flex flex-col items-end gap-1 no-print">
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-200 transition hover:bg-cyan-700"
      >
        <Printer className="h-4 w-4" />
        In / Xuất PDF
      </button>
      <span className="text-[10px] text-slate-400 font-normal italic">
        *Mẹo: Chọn "Lưu dưới dạng PDF" để tải về máy
      </span>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 no-print">
        <button
          onClick={() => navigate('/exports')}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <PageHeader 
          title={`Chi tiết phiếu xuất: ${receipt.receipt_code}`} 
          action={actionButton}
        />
      </div>

      <div className="print-container space-y-6 p-0 print:p-6">
        {/* Printed Header */}
        <div className="hidden print:block text-center border-b border-slate-200 pb-4 mb-6">
          <h1 className="text-2xl font-bold uppercase text-slate-900">PHIẾU XUẤT KHO</h1>
          <p className="text-sm text-slate-500 mt-1">Mã phiếu: {receipt.receipt_code}</p>
          <p className="text-xs text-slate-400 mt-0.5">Ngày tạo: {receipt.export_date}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Thông tin phiếu - luôn hiển thị */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 print:col-span-2">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Thông tin phiếu</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Mã phiếu</p>
                <p className="font-semibold text-slate-800">{receipt.receipt_code}</p>
              </div>
              <div>
                <p className="text-slate-500">Ngày xuất</p>
                <p className="font-semibold text-slate-800">{receipt.export_date}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500">Tên người nhận</p>
                <p className="font-semibold text-slate-800">{receipt.customer_name || 'Không có'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500">Địa chỉ giao hàng</p>
                <p className="font-semibold text-slate-800">{receipt.delivery_address || 'Không có'}</p>
              </div>
              <div>
                <p className="text-slate-500">Lý do</p>
                <p className="font-semibold text-slate-800">{receipt.reason}</p>
              </div>
              <div>
                <p className="text-slate-500">Ghi chú</p>
                <p className="font-semibold text-slate-800">{receipt.note || '-'}</p>
              </div>
            </div>
          </div>

          {/* Tổng giá trị - CHỈ hiện trên màn hình, ẩn khi in */}
          <div className="no-print rounded-2xl border border-slate-200 bg-indigo-50 p-6 shadow-sm flex flex-col justify-center">
            <p className="text-indigo-700 font-medium mb-1">Tổng giá trị xuất</p>
            <p className="text-3xl font-bold text-indigo-900">{formatCurrency(receipt.total_amount)}</p>
            <div className="mt-4 inline-block">
              <span className="rounded-full bg-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-800">
                Trạng thái: {receipt.status}
              </span>
            </div>
          </div>
        </div>

        {/* Danh sách sản phẩm */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="text-lg font-bold text-slate-800">Danh sách sản phẩm</h3>
          </div>
          <DataTable columns={columns} data={receipt.details || []} />
        </div>

        {/* Tổng giá trị - CHỈ hiện khi in, ẩn trên màn hình */}
        <div className="hidden print:flex items-center justify-between border border-slate-200 rounded-xl p-5 mt-2">
          <div>
            <p className="text-slate-500 text-sm">Trạng thái phiếu</p>
            <p className="font-bold text-slate-800 text-lg mt-0.5">{receipt.status}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-sm">Tổng giá trị xuất kho</p>
            <p className="text-3xl font-bold text-slate-900 mt-0.5">{formatCurrency(receipt.total_amount)}</p>
          </div>
        </div>

        {/* Printed Footer for signatures */}
        <div className="hidden print:grid grid-cols-2 gap-4 text-center mt-12 pt-8 border-t border-slate-200">
          <div>
            <p className="font-bold">Người xuất phiếu</p>
            <p className="text-xs text-slate-400 mt-1">(Ký, ghi rõ họ tên)</p>
            <p className="mt-12 text-sm font-semibold">{receipt.creator_name || '........................'}</p>
          </div>
          <div>
            <p className="font-bold">Người nhận hàng</p>
            <p className="text-xs text-slate-400 mt-1">(Ký, ghi rõ họ tên)</p>
            <p className="mt-12 text-sm font-semibold">........................................</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExportDetailPage

