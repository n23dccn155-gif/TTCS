import axiosClient from './axiosClient'

const exportService = {
  getAll: async () => axiosClient.get('/exports'),
  getById: async (id) => axiosClient.get(`/exports/${id}`),
  create: async (payload) => axiosClient.post('/inventory/exports', payload),
  getNextExportCode: async () => axiosClient.get('/inventory/next-export-code'),
}

export default exportService
