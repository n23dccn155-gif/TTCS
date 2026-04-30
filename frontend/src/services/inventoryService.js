import axiosClient from './axiosClient'

const inventoryService = {
  getAll: async () => axiosClient.get('/inventory'),
}

export default inventoryService
