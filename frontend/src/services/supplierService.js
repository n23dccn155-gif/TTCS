import axiosClient from './axiosClient'

const supplierService = {
  getAll: async () => axiosClient.get('/suppliers'),
  getById: async (id) => axiosClient.get(`/suppliers/${id}`),
  create: async (payload) => axiosClient.post('/suppliers', payload),
  update: async (id, payload) => axiosClient.put(`/suppliers/${id}`, payload),
  delete: async (id) => axiosClient.delete(`/suppliers/${id}`),
}

export default supplierService
