import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import exportService from '../../services/exportService'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import { ArrowLeft } from 'lucide-react'

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

  const columns = [
    { key: 'product_name', title: 'Sản phẩm' },
    { key: 'product_unit', title: 'Đơn vị' },
    { key: 'quantity', title: 'Số lượng' },
    { key: 'selling_price', title: 'Đơn giá xuất', render: (row) => formatCurrency(row.selling_price) },
    { key: 'total', title: 'Thành tiền', render: (row) => <span className="font-semibold text-slate-800">{formatCurrency(row.quantity * row.selling_price)}</span> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/exports')}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <PageHeader title={`Chi tiết phiếu xuất: ${receipt.receipt_code}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
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

        <div className="rounded-2xl border border-slate-200 bg-indigo-50 p-6 shadow-sm flex flex-col justify-center">
          <p className="text-indigo-700 font-medium mb-1">Tổng giá trị xuất</p>
          <p className="text-3xl font-bold text-indigo-900">{formatCurrency(receipt.total_amount)}</p>
          <div className="mt-4 inline-block">
            <span className="rounded-full bg-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-800">
              Trạng thái: {receipt.status}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-800">Danh sách sản phẩm</h3>
        </div>
        <DataTable columns={columns} data={receipt.details || []} />
      </div>
    </div>
  )
}

export default ExportDetailPage
