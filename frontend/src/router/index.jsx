import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import DashboardLayout from '../layouts/DashboardLayout'
import LoginPage from '../pages/auth/LoginPage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import ProductListPage from '../pages/products/ProductListPage'
import SupplierListPage from '../pages/suppliers/SupplierListPage'
import UserListPage from '../pages/users/UserListPage'
import ImportListPage from '../pages/imports/ImportListPage'
import ImportCreatePage from '../pages/imports/ImportCreatePage'
import ExportListPage from '../pages/exports/ExportListPage'
import ExportCreatePage from '../pages/exports/ExportCreatePage'
import InventoryPage from '../pages/inventory/InventoryPage'
import LowStockPage from '../pages/alert/LowStockPage'
import ExpiryAlertPage from '../pages/alert/ExpiryAlertPage'
import SlowMovingPage from '../pages/alert/SlowMovingPage'
import NotFoundPage from '../pages/errors/NotFoundPage'
import ForbiddenPage from '../pages/errors/ForbiddenPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthLayout />,
    children: [{ index: true, element: <LoginPage /> }],
  },
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'products', element: <ProductListPage /> },
      { path: 'suppliers', element: <SupplierListPage /> },
      { path: 'users', element: <UserListPage /> },
      { path: 'imports', element: <ImportListPage /> },
      { path: 'imports/create', element: <ImportCreatePage /> },
      { path: 'exports', element: <ExportListPage /> },
      { path: 'exports/create', element: <ExportCreatePage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'alerts/low-stock', element: <LowStockPage /> },
      { path: 'alerts/expiry', element: <ExpiryAlertPage /> },
      { path: 'alerts/slow-moving', element: <SlowMovingPage /> },
      { path: '403', element: <ForbiddenPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])