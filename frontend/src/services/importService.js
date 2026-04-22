const mockImports = [
  // { id: 1, code: 'PN001', supplier: 'Công ty Sữa Việt', date: '2026-04-20', totalItems: 3, status: 'Hoàn thành' },
  // { id: 2, code: 'PN002', supplier: 'NCC Tiêu Dùng A', date: '2026-04-21', totalItems: 2, status: 'Hoàn thành' },
]

const importService = {
  getAll: async () => ({ data: mockImports }),
  create: async (payload) => ({ data: { message: 'Tạo phiếu nhập thành công', payload } }),
}

export default importService