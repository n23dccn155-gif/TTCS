import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Menu,
  Search,
  Maximize,
  Bell,
  ChevronDown,
  User,
  Lock,
  Settings,
  LogOut,
  Sun,
  Moon,
  Database,
  Server,
  CheckCircle2,
  Cpu,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import NotificationBell from './NotificationBell'

const Header = ({ onToggleSidebar }) => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [dispatchAlgo, setDispatchAlgo] = useState(() => localStorage.getItem('wms-dispatch-algo') || 'FEFO')
  const dropdownRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('wms-dispatch-algo', dispatchAlgo)
  }, [dispatchAlgo])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Create dynamic dropdown items based on role
  const dropdownItems = [
    { label: 'Hồ sơ cá nhân', action: 'profile', icon: User },
    ...(user?.role === 'admin' ? [{ label: 'Cài đặt hệ thống', action: 'settings', icon: Settings }] : []),
    { label: 'Đăng xuất', action: 'logout', icon: LogOut },
  ]

  const handleMenuClick = (action) => {
    setOpen(false)
    if (action === 'logout') {
      setConfirmLogout(true)
      return
    }
    if (action === 'profile') {
      navigate('/profile')
      return
    }
    if (action === 'settings') {
      setIsSettingsOpen(true)
      return
    }
  }

  const handleConfirmLogout = () => {
    setConfirmLogout(false)
    logout()
    navigate('/auth/login')
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 h-20 border-b border-slate-700 bg-slate-800 text-white">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left: Toggle + Search */}
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleSidebar}
              className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
              title="Thu gọn / mở sidebar"
            >
              <Menu className="h-6 w-6" strokeWidth={2} />
            </button>

            <div className="relative hidden sm:block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="h-4 w-4" strokeWidth={2} />
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-64 rounded-full border-none bg-slate-900/60 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 outline-none ring-1 ring-slate-600 transition focus:bg-slate-900/80 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Right: Fullscreen + Notification + Profile */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
              title="Toàn màn hình"
            >
              <Maximize className="h-5 w-5" strokeWidth={2} />
            </button>

            <NotificationBell />

            <div ref={dropdownRef} className="relative ml-2">
              <button
                onClick={() => setOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-white/10"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500 text-sm font-bold text-white">
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="hidden text-sm font-semibold text-white md:block">
                  {user?.full_name}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-white/70 transition-transform ${open ? 'rotate-180' : ''}`}
                  strokeWidth={2}
                />
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
                  {dropdownItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.action}
                        onClick={() => handleMenuClick(item.action)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-gray-50 ${
                          item.action === 'logout' ? 'text-red-600' : 'text-gray-700'
                        }`}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2} />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {confirmLogout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm transform rounded-3xl bg-white p-8 shadow-2xl transition-all modal-content">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900">Xác nhận đăng xuất</h3>
              <p className="mt-3 text-slate-500">
                Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
              </p>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setConfirmLogout(false)}
                className="flex-1 rounded-2xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 sm:flex-none"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 rounded-2xl bg-red-500 px-6 py-3 text-sm font-semibold text-white transition shadow-lg shadow-red-200 hover:bg-red-600 sm:flex-none"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg transform rounded-3xl bg-white shadow-2xl transition-all modal-content overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-600" />
                Cài đặt hệ thống
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Theme Settings */}
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2.5">Giao diện (Theme)</h4>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      {isDark ? <Moon className="w-5 h-5 text-indigo-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Chế độ hiển thị</p>
                      <p className="text-sm text-slate-500">{isDark ? 'Giao diện Tối (Dark Mode)' : 'Giao diện Sáng (Light Mode)'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={toggleTheme}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${isDark ? 'bg-indigo-500' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {/* Algorithm Switcher */}
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-cyan-500" />
                  Quy trình xuất kho ưu tiên
                </h4>
                <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setDispatchAlgo('FEFO')}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${dispatchAlgo === 'FEFO' ? 'border-cyan-500 bg-white text-cyan-600 font-bold shadow-sm' : 'border-transparent bg-transparent hover:bg-white/50 text-slate-500'}`}
                    >
                      <span className="text-sm">Hạn dùng</span>
                      <span className="text-[9px] font-normal text-slate-400">Xuất trước (FEFO)</span>
                    </button>
                    <button
                      onClick={() => setDispatchAlgo('FIFO')}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${dispatchAlgo === 'FIFO' ? 'border-cyan-500 bg-white text-cyan-600 font-bold shadow-sm' : 'border-transparent bg-transparent hover:bg-white/50 text-slate-500'}`}
                    >
                      <span className="text-sm">Nhập trước</span>
                      <span className="text-[9px] font-normal text-slate-400">Xuất trước (FIFO)</span>
                    </button>
                    <button
                      onClick={() => setDispatchAlgo('LIFO')}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${dispatchAlgo === 'LIFO' ? 'border-cyan-500 bg-white text-cyan-600 font-bold shadow-sm' : 'border-transparent bg-transparent hover:bg-white/50 text-slate-500'}`}
                    >
                      <span className="text-sm">Nhập sau</span>
                      <span className="text-[9px] font-normal text-slate-400">Xuất trước (LIFO)</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed text-center">
                    {dispatchAlgo === 'FEFO' && '✨ Ưu tiên xuất hàng cận date: Hệ thống tự động chọn các lô hàng có hạn sử dụng gần nhất để xuất trước, tránh lãng phí hư hỏng.'}
                    {dispatchAlgo === 'FIFO' && '📦 Theo thứ tự thời gian: Hàng nào nhập kho trước thì ưu tiên xuất trước, đảm bảo luân chuyển kho đều đặn.'}
                    {dispatchAlgo === 'LIFO' && '⏳ Ưu tiên hàng mới về: Phù hợp cho các mặt hàng cồng kềnh xếp chồng, tiện bốc dỡ hàng phía ngoài trước.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-gray-100 text-center">
              <p className="text-xs text-slate-400 font-mono">WMS Core v2.5.0 (Huy - Expiry-Optimized)</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Header
