import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import exportService from '../../services/exportService'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'

const ExportListPage = () => {
  const [exportsData, setExportsData] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const res = await exportService.getAll()
      setExportsData(res.data)
    }
    fetchData()
  }, [])

  const columns = [
    { key: 'code', title: 'Mã phiếu xuất' },
    { key: 'reason', title: 'Lý do xuất' },
    { key: 'date', title: 'Ngày xuất' },
    { key: 'totalItems', title: 'Số dòng SP' },
    { key: 'status', title: 'Trạng thái' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Danh sách phiếu xuất"
        description="Theo dõi tất cả phiếu xuất kho"
        action={
          <Link
            to="/exports/create"
            className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-600"
          >
            + Tạo phiếu xuất
          </Link>
        }
      />
      <DataTable columns={columns} data={exportsData} />
    </div>
  )
}

export default ExportListPage


// import React from 'react'
// import DataTable from '../../components/common/DataTable'
// import '../../styles/export-list-style.css'

// const ExportListPage = () => {
//   const exportReceipts = []

//   const columns = [
//     { key: 'receiptCode', title: 'Mã phiếu' },
//     { key: 'exportDate', title: 'Ngày xuất' },
//     { key: 'reason', title: 'Lý do xuất' },
//     { key: 'createdBy', title: 'Người tạo' },
//     { key: 'note', title: 'Ghi chú' },
//   ]

//   return (
//     <div className="export-page">
//       <aside className="sidebar-panel">
//         <div className="brand-block">
//           <div className="brand-mark">KHO</div>
//           <p>Quản lý kho hàng</p>
//         </div>

//         <div className="profile-card">
//           <span>Xin chào</span>
//           <h3>Chủ đại lý</h3>
//           <small>CHỦ ĐẠI LÝ</small>
//         </div>

//         <nav className="menu-list">
//           {[
//             'Tổng quan',
//             'Sản phẩm',
//             'Nhà cung cấp',
//             'Người dùng',
//             'Phiếu nhập',
//             'Phiếu xuất',
//             'Tồn kho',
//             'Cảnh báo',
//           ].map((item) => (
//             <button
//               key={item}
//               className={`menu-item ${item === 'Phiếu xuất' ? 'active' : ''}`}
//             >
//               <span className="menu-dot" />
//               {item}
//             </button>
//           ))}
//         </nav>
//       </aside>

//       <main className="content-panel">
//         <header className="top-header">
//           <div>
//             <h1>Phiếu xuất kho</h1>
//             <p>Hệ thống quản lý kho hàng và sản phẩm</p>
//           </div>

//           <div className="user-chip">
//             <div>
//               <span>Chủ đại lý</span>
//               <strong>Chủ đại lý</strong>
//             </div>
//             <div className="avatar">C</div>
//             <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
//               <path d="m5 7 5 5 5-5" />
//             </svg>
//           </div>
//         </header>

//         <section className="hero-strip">
//           <div className="hero-copy">
//             <span className="eyebrow">Quản lý xuất kho</span>
//             <h2>Danh sách phiếu xuất</h2>
//             <p>Theo dõi tất cả phiếu xuất kho trong một giao diện gọn hơn, hiện đại hơn.</p>
//           </div>
//           <button className="create-button">+ Tạo phiếu xuất</button>
//         </section>

//         <section className="filter-bar">
//           <div className="filter-item">
//             <label>Trạng thái</label>
//             <select>
//               <option>Tất cả</option>
//             </select>
//           </div>
//           <div className="filter-item">
//             <label>Khoảng thời gian</label>
//             <select>
//               <option>Hôm nay</option>
//             </select>
//           </div>
//           <div className="filter-item search-item">
//             <label>Tìm kiếm</label>
//             <input placeholder="Nhập mã phiếu hoặc người tạo" />
//           </div>
//         </section>

//         <section className="table-card">
//           <div className="section-heading">
//             <div>
//               <h3>Dữ liệu phiếu xuất</h3>
//               <p>Khi chưa có dữ liệu, hệ thống hiển thị trạng thái trống theo phong cách dashboard.</p>
//             </div>
//             <span className="badge-soft">0 phiếu</span>
//           </div>
//           <DataTable columns={columns} data={exportReceipts} />
//         </section>
//       </main>
//     </div>
//   )
// }

// export default ExportListPage
