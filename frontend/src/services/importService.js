import axiosClient from './axiosClient'

const importService = {
  getAll: async () => axiosClient.get('/imports'),
  getById: async (id) => axiosClient.get(`/imports/${id}`),
  create: async (payload) => axiosClient.post('/imports', payload),
  getNextImportCode: async () => axiosClient.get('/inventory/next-import-code'),
}

export default importService
