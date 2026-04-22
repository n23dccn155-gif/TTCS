export const menuItems = [
  { label: 'Tổng quan', path: '/dashboard', icon: '📊' },
  { label: 'Sản phẩm', path: '/products', icon: '📦' },
  { label: 'Nhà cung cấp', path: '/suppliers', icon: '🏢' },
  { label: 'Người dùng', path: '/users', icon: '👤', adminOnly: true },
  { label: 'Phiếu nhập', path: '/imports', icon: '📥' },
  { label: 'Phiếu xuất', path: '/exports', icon: '📤' },
  { label: 'Tồn kho', path: '/inventory', icon: '📚' },
  { label: 'Cảnh báo tồn thấp', path: '/alerts/low-stock', icon: '⚠️', adminOnly: true },
  { label: 'Cảnh báo hết hạn', path: '/alerts/expiry', icon: '⏳', adminOnly: true },
  { label: 'Cảnh báo tồn lâu', path: '/alerts/slow-moving', icon: '🕒', adminOnly: true },
]