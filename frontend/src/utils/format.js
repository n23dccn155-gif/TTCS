export const formatDate = (dateString) => {
  if (!dateString) return '---'
  const date = new Date(dateString)
  return date.toLocaleDateString('vi-VN')
}

export const formatRole = (role) => {
  return role === 'admin' ? 'Chủ đại lý' : 'Nhân viên'
}