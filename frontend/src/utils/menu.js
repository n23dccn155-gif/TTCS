import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  ClipboardPlus,
  ClipboardMinus,
  Warehouse,
  Bell,
  Lightbulb,
} from 'lucide-react'

export const menuItems = [
  { label: 'Tổng quan', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Sản phẩm', path: '/products', icon: Package },
  { label: 'Nhà cung cấp', path: '/suppliers', icon: Truck },
  { label: 'Người dùng', path: '/users', icon: Users, adminOnly: true },
  { label: 'Phiếu nhập', path: '/imports', icon: ClipboardPlus },
  { label: 'Phiếu xuất', path: '/exports', icon: ClipboardMinus },
  { label: 'Tồn kho', path: '/inventory', icon: Warehouse },
  { label: 'Cảnh báo', path: '/alerts', icon: Bell, adminOnly: true },
  { label: 'Đề xuất bổ hàng', path: '/replenishments', icon: Lightbulb, adminOnly: true },
]
