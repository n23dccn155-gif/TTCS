const mockProducts = [
  // { id: 1, code: 'SP001', name: 'Sữa tươi Vinamilk', category: 'Thực phẩm', unit: 'Hộp', stock: 12, minStock: 20 },
  // { id: 2, code: 'SP002', name: 'Mì Hảo Hảo', category: 'Đồ khô', unit: 'Thùng', stock: 75, minStock: 50 },
  // { id: 3, code: 'SP003', name: 'Coca Cola', category: 'Nước uống', unit: 'Lon', stock: 18, minStock: 30 },
]

const productService = {
  getAll: async () => ({ data: mockProducts }),
}

export default productService