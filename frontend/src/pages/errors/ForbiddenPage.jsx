import React from 'react'
import { Link } from 'react-router-dom'

const ForbiddenPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <h1 className="text-4xl font-bold text-slate-800">403</h1>
        <p className="mt-3 text-slate-500">Bạn không có quyền truy cập trang này</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-block rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-white hover:bg-cyan-600"
        >
          Về trang tổng quan
        </Link>
      </div>
    </div>
  )
}

export default ForbiddenPage