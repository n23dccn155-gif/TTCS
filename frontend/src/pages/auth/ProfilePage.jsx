import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import authService from '../../services/authService'
import PageHeader from '../../components/common/PageHeader'

const ProfilePage = () => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)
    setError(null)

    if (formData.new_password !== formData.confirm_password) {
      return setError('Mật khẩu xác nhận không khớp!')
    }

    setLoading(true)
    try {
      const res = await authService.changePassword({
        old_password: formData.old_password,
        new_password: formData.new_password,
      })
      setMessage(res.data.message || 'Đổi mật khẩu thành công!')
      setFormData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Hồ sơ cá nhân"
        description="Quản lý thông tin tài khoản và bảo mật"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Info Card */}
        <div className="col-span-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 text-3xl font-bold mb-4">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-slate-800">{user?.full_name}</h2>
            <p className="text-sm text-slate-500 mb-4">@{user?.username}</p>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên kho'}
            </span>
          </div>

          <div className="mt-8 space-y-4 border-t border-slate-100 pt-6">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Trạng thái:</span>
              <span className="font-semibold text-emerald-600">Hoạt động</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Ngày tham gia:</span>
              <span className="font-semibold text-slate-700">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="col-span-1 md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            Đổi mật khẩu
          </h3>

          {message && (
            <div className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu hiện tại</label>
              <input
                type="password"
                name="old_password"
                value={formData.old_password}
                onChange={handleChange}
                placeholder="Nhập mật khẩu hiện tại"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu mới</label>
              <input
                type="password"
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                placeholder="Nhập mật khẩu mới"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                 <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : 'Cập nhật mật khẩu'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
