import axiosClient from './axiosClient'

const productService = {
  getAll: async () => axiosClient.get('/products'),
  getById: async (id) => axiosClient.get(`/products/${id}`),
  create: async (payload) => axiosClient.post('/products', payload),
  update: async (id, payload) => axiosClient.put(`/products/${id}`, payload),
  delete: async (id) => axiosClient.delete(`/products/${id}`),
}

export default productService
