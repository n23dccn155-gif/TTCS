import axiosInstance from './axiosInstance';

export const alertApi = {
    getLowStock: () => axiosInstance.get('/alerts/low-stock'),
    getExpiring: () => axiosInstance.get('/alerts/expiring'),
    getStaleStock: () => axiosInstance.get('/alerts/stale-stock'),
};