import axios from 'axios';

// Khởi tạo axios với Base URL từ biến môi trường
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 10000,
});

// Interceptor Request: Tự động đính kèm Token trước khi gửi
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor Response: Bắt lỗi chung toàn cục
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Nếu backend trả về 401 (Hết hạn token hoặc không hợp lệ)
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login'; // Ép văng ra màn hình đăng nhập
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;