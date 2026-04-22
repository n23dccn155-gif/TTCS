import axiosInstance from './axiosInstance';

export const exportApi = {
    getAll: () => axiosInstance.get('/exports'),
    create: (data) => axiosInstance.post('/exports', data),
};