import axiosClient from './axiosClient'

const exportService = {
  getAll: async () => axiosClient.get('/exports'),
  getById: async (id) => axiosClient.get(`/exports/${id}`),
  create: async (payload) => axiosClient.post('/exports', payload),
}

export default exportService
