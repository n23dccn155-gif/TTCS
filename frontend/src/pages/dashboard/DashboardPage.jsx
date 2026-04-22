import React from 'react'
import StatCard from '../../components/common/StatCard'
import DataTable from '../../components/common/DataTable'

const recentTransactions = [
  // { id: 1, code: 'PN001', type: 'Nhập kho', date: '20/04/2026', status: 'Hoàn thành' },
  // { id: 2, code: 'PX001', type: 'Xuất kho', date: '20/04/2026', status: 'Hoàn thành' },
  // { id: 3, code: 'PN002', type: 'Nhập kho', date: '19/04/2026', status: 'Hoàn thành' },
]

const DashboardPage = () => {
  const columns = [
    { key: 'code', title: 'Mã phiếu' },
    { key: 'type', title: 'Loại' },
    { key: 'date', title: 'Ngày' },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => (
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          {row.status}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Tổng sản phẩm" value="0" color="bg-blue-500" />
        <StatCard title="Phiếu nhập tháng này" value="0" color="bg-emerald-500" />
        <StatCard title="Phiếu xuất tháng này" value="0" color="bg-orange-500" />
        <StatCard title="Cảnh báo tồn thấp" value="0" color="bg-red-500" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <DataTable columns={columns} data={recentTransactions} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-xl font-bold text-slate-800">Cảnh báo nhanh</h3>
          <div className="space-y-4">
            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">Tồn thấp</p>
              <p className="mt-1 text-sm text-slate-600"> </p>
            </div>
            <div className="rounded-xl bg-yellow-50 p-4">
              <p className="text-sm font-semibold text-yellow-700">Sắp hết hạn</p>
              <p className="mt-1 text-sm text-slate-600"> </p>
            </div>
            <div className="rounded-xl bg-orange-50 p-4">
              <p className="text-sm font-semibold text-orange-700">Tồn lâu</p>
              <p className="mt-1 text-sm text-slate-600"> </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default DashboardPage