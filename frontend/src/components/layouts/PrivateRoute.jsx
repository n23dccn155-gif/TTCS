import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

const PrivateRoute = ({ children, requireAdmin = false }) => {
    const { user } = useContext(AuthContext);

    // 1. Chưa đăng nhập -> Đuổi về trang /login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 2. Yêu cầu quyền admin/chủ nhưng user chỉ là nhân viên -> Đuổi về Dashboard
    if (requireAdmin && user.role !== 'admin' && user.role !== 'owner') {
        return <Navigate to="/dashboard" replace />;
    }

    // 3. Hợp lệ -> Render component con
    return children;
};

export default PrivateRoute;