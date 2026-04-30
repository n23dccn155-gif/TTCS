import axiosClient from './axiosClient'

const userService = {
  getAll: async () => axiosClient.get('/users'),
  getById: async (id) => axiosClient.get(`/users/${id}`),
  create: async (payload) => axiosClient.post('/users', payload),
  update: async (id, payload) => axiosClient.put(`/users/${id}`, payload),
  delete: async (id) => axiosClient.delete(`/users/${id}`),
}

export default userService
