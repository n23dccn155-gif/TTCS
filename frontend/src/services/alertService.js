import axiosClient from './axiosClient'

const alertService = {
  getLowStock: async () => axiosClient.get('/alerts/low-stock'),
  getExpiry: async () => axiosClient.get('/alerts/expiry'),
  getSlowMoving: async () => axiosClient.get('/alerts/slow-moving'),
}

export default alertService
