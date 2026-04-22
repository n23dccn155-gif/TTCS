const mockExports = [
  // { id: 1, code: 'PX001', reason: 'Bán lẻ', date: '2026-04-20', totalItems: 2, status: 'Hoàn thành' },
  // { id: 2, code: 'PX002', reason: 'Bán sỉ', date: '2026-04-21', totalItems: 4, status: 'Hoàn thành' },
]

const exportService = {
  getAll: async () => ({ data: mockExports }),
  create: async (payload) => ({ data: { message: 'Tạo phiếu xuất thành công', payload } }),
}

export default exportService