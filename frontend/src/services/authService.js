import axiosClient from './axiosClient'

const authService = {
  login: async (payload) => {
    return axiosClient.post('/auth/login', payload)
  },
  refresh: async (refreshToken) => {
    return axiosClient.post('/auth/refresh', {}, {
      headers: {
        Authorization: `Bearer ${refreshToken}`
      }
    })
  },
  changePassword: async (payload) => {
    return axiosClient.post('/auth/change-password', payload)
  },
  updateProfile: async (payload) => {
    return axiosClient.put('/auth/update-profile', payload)
  },
  getMe: async () => {
    return axiosClient.get('/auth/me')
  },
}

export default authService