import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import authService from '../../services/authService'
import PageHeader from '../../components/common/PageHeader'
import { User, Lock, Mail, Edit3, Save } from 'lucide-react'

const ProfilePage = () => {
  const { user, updateUser } = useAuth()
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
  })
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)
  
  const [profileMessage, setProfileMessage] = useState(null)
  const [profileError, setProfileError] = useState(null)
  
  const [passwordMessage, setPasswordMessage] = useState(null)
  const [passwordError, setPasswordError] = useState(null)

  // Sync profileData when user loads or updates
  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        email: user.email || '',
      })
    }
  }, [user])

  const handleProfileChange = (e) => {
    setProfileData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handlePasswordChange = (e) => {
    setPasswordData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setProfileMessage(null)
    setProfileError(null)
    setLoadingProfile(true)

    try {
      const res = await authService.updateProfile({
        full_name: profileData.full_name,
        email: profileData.email,
      })
      setProfileMessage(res.data.message || 'Cập nhật thông tin thành công!')
      updateUser(res.data.user) // Sync context state
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!')
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setPasswordMessage(null)
    setPasswordError(null)

    if (passwordData.new_password !== passwordData.confirm_password) {
      return setPasswordError('Mật khẩu xác nhận không khớp!')
    }

    setLoadingPassword(true)
    try {
      const res = await authService.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      })
      setPasswordMessage(res.data.message || 'Đổi mật khẩu thành công!')
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      })
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!')
    } finally {
      setLoadingPassword(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Hồ sơ cá nhân"
        description="Quản lý thông tin tài khoản và bảo mật của bạn"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info Card */}
        <div className="col-span-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between h-fit">
          <div className="flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-full bg-cyan-500 flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-md">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <h2 className="text-xl font-bold text-slate-800">{user?.full_name}</h2>
            <p className="text-sm text-slate-400 mb-3">@{user?.username}</p>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {user?.role === 'admin' ? 'Quản trị viên (Admin)' : 'Nhân viên Kho (Staff)'}
            </span>
          </div>

          <div className="mt-8 space-y-4 border-t border-slate-100 pt-6">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Trạng thái tài khoản:</span>
              <span className="font-semibold text-emerald-600">Hoạt động</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Mã nhân viên (ID):</span>
              <span className="font-semibold text-slate-700">#00{user?.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Ngày tham gia:</span>
              <span className="font-semibold text-slate-700">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Profile & Password Forms */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Section 1: Update Profile Info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-gray-50 pb-3">
              <Edit3 className="w-5 h-5 text-cyan-500" />
              Thông tin cá nhân
            </h3>

            {profileMessage && (
              <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                {profileMessage}
              </div>
            )}

            {profileError && (
              <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {profileError}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <input
                    type="text"
                    name="full_name"
                    value={profileData.full_name}
                    onChange={handleProfileChange}
                    placeholder="Nhập họ tên thật"
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-12 pr-4 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Địa chỉ Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    placeholder="nhanvien@congty.com"
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-12 pr-4 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loadingProfile}
                  className="rounded-xl bg-cyan-500 px-5 py-2.5 font-semibold text-white shadow-md shadow-cyan-100 hover:bg-cyan-600 transition disabled:opacity-60 flex items-center gap-2"
                >
                  {loadingProfile ? (
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Lưu thông tin
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Change Password */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-gray-50 pb-3">
              <Lock className="w-5 h-5 text-cyan-500" />
              Đổi mật khẩu
            </h3>

            {passwordMessage && (
              <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                {passwordMessage}
              </div>
            )}

            {passwordError && (
              <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {passwordError}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  name="old_password"
                  value={passwordData.old_password}
                  onChange={handlePasswordChange}
                  placeholder="Mật khẩu hiện tại"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu mới</label>
                  <input
                    type="password"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nhập lại mật khẩu mới</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    placeholder="Xác nhận mật khẩu"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loadingPassword}
                  className="rounded-xl bg-slate-800 px-5 py-2.5 font-semibold text-white hover:bg-slate-900 transition disabled:opacity-60 flex items-center gap-2 shadow-sm"
                >
                  {loadingPassword ? (
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : 'Cập nhật mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
