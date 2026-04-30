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
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const menuItems = [
  { label: 'Hồ sơ user', action: 'profile', icon: User },
  { label: 'Thay đổi mật khẩu', action: 'password', icon: Lock },
  { label: 'Cài đặt', action: 'settings', icon: Settings },
  { label: 'Đăng xuất', action: 'logout', icon: LogOut },
]

const Header = ({ onToggleSidebar }) => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMenuClick = (action) => {
    setOpen(false)
    if (action === 'logout') {
      setConfirmLogout(true)
      return
    }
    // TODO: handle profile, password, settings navigation
  }

  const handleConfirmLogout = () => {
    setConfirmLogout(false)
    logout()
    navigate('/login')
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

            <button
              className="relative rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
              title="Thông báo"
            >
              <Bell className="h-5 w-5" strokeWidth={2} />
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">
                3
              </span>
            </button>

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
                  {menuItems.map((item) => {
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
          <div className="w-full max-w-sm transform rounded-3xl bg-white p-8 shadow-2xl transition-all">
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
    </>
  )
}

export default Header
