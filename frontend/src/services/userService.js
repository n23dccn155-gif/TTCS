const mockUsers = [
  { id: 1, username: 'admin', full_name: 'Chủ đại lý', role: 'admin', status: 'active' },
  { id: 2, username: 'staff01', full_name: 'Nhân viên kho 1', role: 'staff', status: 'active' },
]

const userService = {
  getAll: async () => ({ data: mockUsers }),
}

export default userService