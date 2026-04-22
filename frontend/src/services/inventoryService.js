const mockInventory = [
  // { id: 1, code: 'SP001', name: 'Sữa tươi Vinamilk', category: 'Thực phẩm', unit: 'Hộp', totalImport: 100, totalExport: 88, currentStock: 12 },
  // { id: 2, code: 'SP002', name: 'Mì Hảo Hảo', category: 'Đồ khô', unit: 'Thùng', totalImport: 120, totalExport: 45, currentStock: 75 },
]

const inventoryService = {
  getAll: async () => ({ data: mockInventory }),
}

export default inventoryService