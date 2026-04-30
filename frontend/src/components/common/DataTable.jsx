import React from 'react'
import EmptyState from './EmptyState'

const DataTable = ({ columns = [], data = [], empty }) => {
  if (!data.length) {
    return empty || <EmptyState message="Chưa có dữ liệu để hiển thị" />
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr className="text-left text-sm text-slate-600">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-4">
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={row.id || index} className="border-t border-slate-100">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-4 text-slate-700">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DataTable