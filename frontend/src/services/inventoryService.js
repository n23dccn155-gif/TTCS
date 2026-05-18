import axiosClient from './axiosClient'

const inventoryService = {
  getAll: async () => axiosClient.get('/inventory'),
  getReplenishmentSuggestions: async () => axiosClient.get('/inventory/replenishments/suggestions'),
}

export default inventoryService
