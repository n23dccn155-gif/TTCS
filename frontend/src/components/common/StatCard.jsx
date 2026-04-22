import React from 'react'

const StatCard = ({ title, value, color = 'bg-cyan-500' }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-800">{value}</h3>
        </div>
        <div className={`h-12 w-12 rounded-xl ${color}`}></div>
      </div>
    </div>
  )
}

export default StatCard