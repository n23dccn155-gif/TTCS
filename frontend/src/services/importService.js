import axiosClient from './axiosClient'

const importService = {
  getAll: async () => axiosClient.get('/imports'),
  getById: async (id) => axiosClient.get(`/imports/${id}`),
  create: async (payload) => axiosClient.post('/imports', payload),
}

export default importService
