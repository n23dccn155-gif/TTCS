import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import DashboardLayout from '../layouts/DashboardLayout'
import LoginPage from '../pages/auth/LoginPage'
import ProfilePage from '../pages/auth/ProfilePage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import ProductListPage from '../pages/products/ProductListPage'
import SupplierListPage from '../pages/suppliers/SupplierListPage'
import UserListPage from '../pages/users/UserListPage'
import ImportListPage from '../pages/imports/ImportListPage'
import ImportCreatePage from '../pages/imports/ImportCreatePage'
import ImportDetailPage from '../pages/imports/ImportDetailPage'
import ExportListPage from '../pages/exports/ExportListPage'
import ExportCreatePage from '../pages/exports/ExportCreatePage'
import ExportDetailPage from '../pages/exports/ExportDetailPage'
import InventoryPage from '../pages/inventory/InventoryPage'
import AlertsPage from '../pages/alert/AlertsPage'
import NotFoundPage from '../pages/errors/NotFoundPage'
import ForbiddenPage from '../pages/errors/ForbiddenPage'

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
    ],
  },
  {
    path: '/login',
    element: <Navigate to="/auth/login" replace />,
  },
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'products', element: <ProductListPage /> },
      { path: 'suppliers', element: <SupplierListPage /> },
      { path: 'users', element: <UserListPage /> },
      { path: 'imports', element: <ImportListPage /> },
      { path: 'imports/create', element: <ImportCreatePage /> },
      { path: 'imports/:id', element: <ImportDetailPage /> },
      { path: 'exports', element: <ExportListPage /> },
      { path: 'exports/create', element: <ExportCreatePage /> },
      { path: 'exports/:id', element: <ExportDetailPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'alerts', element: <AlertsPage /> },
      { path: '403', element: <ForbiddenPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])