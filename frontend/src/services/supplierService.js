const mockSuppliers = [
//   { id: 1, code: 'NCC001', name: 'Công ty Sữa Việt', phone: '0909123456', address: 'Quận 1, TP.HCM' },
//   { id: 2, code: 'NCC002', name: 'NCC Tiêu Dùng A', phone: '0911222333', address: 'Thủ Đức, TP.HCM' },
]

const supplierService = {
  getAll: async () => ({ data: mockSuppliers }),
}

export default supplierService