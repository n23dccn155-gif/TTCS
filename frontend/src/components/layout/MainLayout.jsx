import React from 'react';
import Sidebar from './Sidebar';

const MainLayout = ({ children }) => {
    return (
        <div className="flex bg-gray-100 min-h-screen">
            {/* Thanh menu bên trái */}
            <Sidebar />
            
            {/* Phần nội dung chính bên phải */}
            <div className="flex-1 ml-64 p-8 overflow-y-auto">
                {children}
            </div>
        </div>
    );
}; 

export default MainLayout;