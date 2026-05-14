import axiosClient from './axiosClient'

const locationService = {
  getAll: async () => axiosClient.get('/locations'),
  getAvailable: async () => axiosClient.get('/locations/available'),
  getById: async (id) => axiosClient.get(`/locations/${id}`),
  create: async (payload) => axiosClient.post('/locations', payload),
  update: async (id, payload) => axiosClient.put(`/locations/${id}`, payload),
  delete: async (id) => axiosClient.delete(`/locations/${id}`),
}

export default locationService
