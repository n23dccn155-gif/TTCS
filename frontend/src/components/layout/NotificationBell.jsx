import React, { useState, useEffect, useRef } from 'react'
import { Bell, AlertTriangle, Clock, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../../services/axiosClient'

const NotificationBell = () => {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState({ alerts_count: 0, alerts: [], activities: [] })
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const fetchNotifications = async () => {
    try {
      const res = await axiosClient.get('/inventory/bell-notifications')
      if (res.data) {
        setData(res.data)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  // Initial fetch and polling every 30 seconds
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNavigate = (path) => {
    setOpen(false)
    navigate(path)
  }

  const hasNotifications = data.alerts_count > 0 || data.activities.length > 0

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex items-center justify-center rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
        title="Thông báo"
      >
        <Bell className={`h-5 w-5 ${data.alerts_count > 0 ? 'animate-pulse text-red-400' : ''}`} strokeWidth={2} />
        {data.alerts_count > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-800">
            {data.alerts_count > 9 ? '9+' : data.alerts_count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xl">
          <div className="bg-slate-50 px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-slate-800">Thông báo hệ thống</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {/* ALERTS SECTION */}
            {data.alerts.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Cảnh báo</div>
                {data.alerts.map((alert, idx) => (
                  <div
                    key={`alert-${idx}`}
                    onClick={() => handleNavigate('/alerts')}
                    className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition hover:bg-red-50"
                  >
                    <div className="mt-0.5 rounded-full bg-red-100 p-1.5 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ACTIVITIES SECTION */}
            {data.activities.length > 0 && (
              <div className="p-2 border-t border-gray-50">
                <div className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Hoạt động gần đây</div>
                {data.activities.map((act, idx) => (
                  <div
                    key={`act-${idx}`}
                    onClick={() => handleNavigate(act.type === 'import' ? '/imports' : '/exports')}
                    className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition hover:bg-cyan-50"
                  >
                    <div className={`mt-0.5 rounded-full p-1.5 ${act.type === 'import' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                      <ArrowRight className={`h-4 w-4 ${act.type === 'import' ? 'rotate-90' : '-rotate-90'}`} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 leading-snug">{act.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!hasNotifications && (
              <div className="p-6 text-center text-slate-500">
                <Clock className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                <p className="text-sm">Không có thông báo mới</p>
              </div>
            )}
          </div>
          
          <div className="bg-slate-50 p-2 text-center border-t border-gray-100">
            <button onClick={fetchNotifications} className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 transition">
              Làm mới
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
