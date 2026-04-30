import axiosClient from './axiosClient'

const authService = {
  login: async (payload) => {
    return axiosClient.post('/auth/login', payload)
  },
  getMe: async () => {
    return axiosClient.get('/auth/me')
  },
}

export default authService