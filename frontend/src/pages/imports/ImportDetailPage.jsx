import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import importService from '../../services/importService'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import { ArrowLeft } from 'lucide-react'

const ImportDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [receipt, setReceipt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await importService.getById(id)
        setReceipt(res.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể tải chi tiết phiếu nhập')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
        <p className="font-semibold">{error || 'Phiếu nhập không tồn tại'}</p>
        <button onClick={() => navigate('/imports')} className="mt-4 text-sm underline">
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
    { key: 'unit_price', title: 'Đơn giá', render: (row) => formatCurrency(row.unit_price) },
    { key: 'total', title: 'Thành tiền', render: (row) => <span className="font-semibold text-slate-800">{formatCurrency(row.quantity * row.unit_price)}</span> },
    { key: 'batch_code', title: 'Mã lô', render: (row) => row.batch_code || '-' },
    { key: 'expiry_date', title: 'Hạn sử dụng', render: (row) => row.expiry_date || '-' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/imports')}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <PageHeader title={`Chi tiết phiếu nhập: ${receipt.receipt_code}`} />
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
              <p className="text-slate-500">Ngày nhập</p>
              <p className="font-semibold text-slate-800">{receipt.import_date}</p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-500">Nhà cung cấp</p>
              <p className="font-semibold text-slate-800">{receipt.supplier_name || 'Không có'}</p>
            </div>
            <div>
              <p className="text-slate-500">Người tạo</p>
              <p className="font-semibold text-slate-800">{receipt.creator_name || '-'}</p>
            </div>
            <div>
              <p className="text-slate-500">Ghi chú</p>
              <p className="font-semibold text-slate-800">{receipt.note || '-'}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-cyan-50 p-6 shadow-sm flex flex-col justify-center">
          <p className="text-cyan-700 font-medium mb-1">Tổng giá trị phiếu nhập</p>
          <p className="text-3xl font-bold text-cyan-900">{formatCurrency(receipt.total_amount)}</p>
          <div className="mt-4 inline-block">
            <span className="rounded-full bg-cyan-200 px-3 py-1 text-xs font-semibold text-cyan-800">
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

export default ImportDetailPage
