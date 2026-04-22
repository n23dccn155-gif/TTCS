import React from 'react'

const EmptyState = ({ message = 'Không có dữ liệu' }) => {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
      {message}
    </div>
  )
}

export default EmptyState