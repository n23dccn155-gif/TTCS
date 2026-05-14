import axiosClient from './axiosClient'

const adjustmentService = {
  getAll: async () => axiosClient.get('/adjustments'),
  getByProduct: async (productId) => axiosClient.get(`/adjustments/product/${productId}`),
  create: async (payload) => axiosClient.post('/adjustments', payload),
}

export default adjustmentService
