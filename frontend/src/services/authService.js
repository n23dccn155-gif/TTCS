const authService = {
  login: async (payload) => {
    return {
      data: {
        token: 'demo-token',
        user: {
          id: 1,
          username: payload.username,
          full_name: payload.username === 'admin' ? 'Chủ đại lý' : 'Nhân viên kho',
          role: payload.username === 'admin' ? 'admin' : 'staff',
        },
      },
    }
  },
}

export default authService