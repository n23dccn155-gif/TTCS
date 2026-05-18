import * as XLSX from 'xlsx'

/**
 * Xuất dữ liệu ra file Excel
 * @param {Array} data - Mảng dữ liệu cần xuất (các object)
 * @param {String} filename - Tên file (không cần đuôi .xlsx)
 * @param {String} sheetName - Tên sheet trong file Excel
 */
export const exportToExcel = (data, filename = 'export', sheetName = 'Sheet1') => {
  // Tạo workbook và worksheet
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  
  // Điều chỉnh chiều rộng cột tự động dựa trên nội dung dài nhất (tùy chọn)
  const maxWidths = []
  data.forEach(row => {
    Object.keys(row).forEach((key, index) => {
      const val = row[key] ? row[key].toString() : ''
      maxWidths[index] = Math.max(maxWidths[index] || key.length, val.length)
    })
  })
  worksheet['!cols'] = maxWidths.map(w => ({ wch: w + 2 }))

  // Lưu file
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}
