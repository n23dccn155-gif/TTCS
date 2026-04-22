import axiosInstance from './axiosInstance';

export const importApi = {
    // Lấy danh sách phiếu nhập
    getAll: () => axiosInstance.get('/imports'),
    
    // Tạo phiếu nhập mới (Gửi kèm Master và Details)
    create: (data) => axiosInstance.post('/imports', data),
};