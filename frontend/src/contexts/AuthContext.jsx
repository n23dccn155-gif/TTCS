import React, { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    id: 1,
    full_name: 'Admin User',
    username: 'admin',
    role: 'admin',
  })
  const [token, setToken] = useState('demo-token')

  const login = async ({ username, password }) => {
    const role = username === 'admin' ? 'admin' : 'staff'
    setUser({
      id: 1,
      full_name: role === 'admin' ? 'Chủ đại lý' : 'Nhân viên kho',
      username,
      role,
    })
    setToken('demo-token')
    return { success: true }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
  }

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      login,
      logout,
    }),
    [user, token]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)