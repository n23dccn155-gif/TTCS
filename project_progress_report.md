# BÁO CÁO TIẾN ĐỘ DỰ ÁN QUẢN LÝ KHO (WMS)
**Thời gian cập nhật:** 12/05/2026

---

## 1. TỔNG QUAN TIẾN ĐỘ (OVERALL PROGRESS)
Hiện tại, dự án đã hoàn thành **100% việc tích hợp các module cốt lõi**. Vấn đề xung đột cấu trúc thư mục và chênh lệch cơ sở dữ liệu (giữa phiên bản SQLite cũ và phiên bản PostgreSQL có chứa thuật toán FEFO của Huy) đã được giải quyết triệt để. 

**Các chức năng ĐÃ HOẠT ĐỘNG (Fully Functional):**
- Đăng nhập, Đăng ký và Quản lý người dùng.
- Quản lý danh mục Sản phẩm, Nhà cung cấp.
- Nhập kho (có lưu thông tin lô hàng và hạn sử dụng).
- **Xuất kho tự động theo thuật toán FEFO** (First-Expired, First-Out: Hết hạn trước - Xuất trước).
- Tính toán tồn kho theo thời gian thực (Real-time).
- Bảng điều khiển (Dashboard) và Hệ thống Cảnh báo tự động (Tồn thấp, Sắp hết hạn, Tồn lâu).

---

## 2. CHI TIẾT CÁC FILE & CHỨC NĂNG ĐÃ THỰC THI

### Phần A: Cấu trúc Cơ sở dữ liệu (Backend Models)
Toàn bộ CSDL đã được chuyển đổi sang chuẩn mới nhất để phục vụ cho việc quản lý theo **lô hàng (batch)**.

*   **`backend/app/model/product.py`**: Chuẩn hóa trường `code` thành `product_code`, bổ sung thêm `unit_price`, `description` và cơ chế xóa mềm (`is_active`).
*   **`backend/app/model/user.py`**: Bỏ trường `full_name` dư thừa, sử dụng `email` và `username`.
*   **`backend/app/model/supplier.py`**: Thêm `contact_person` và `email`.
*   **`backend/app/model/import_receipt.py` & `export_receipt.py`**: Thiết lập tính năng tự động sinh mã phiếu (`receipt_code` bằng UUID thu gọn) và lưu trữ ID người tạo (`created_by`).
*   **`backend/app/model/import_detail.py` & `export_detail.py`**: Đây là **trái tim của thuật toán quản lý lô hàng**. 
    *   `import_detail` bổ sung `batch_code` (Mã lô) và `expiry_date` (Ngày hết hạn).
    *   `export_detail` bổ sung khoá ngoại `import_detail_id` để biết chính xác món hàng xuất ra được lấy từ "lô nhập" nào.

### Phần B: Thuật toán FEFO & Xử lý Tồn Kho (Core Logic)
Thay vì dùng code Python quét qua hàng ngàn dòng dữ liệu (rất chậm), nhóm đã chuyển logic tính toán tồn kho thẳng xuống Hệ Quản Trị CSDL (PostgreSQL).

*   **`backend/migrations/create_stock_views.sql`**: Chứa 2 lệnh SQL phức tạp để tạo "View" (Bảng ảo):
    *   `v_stock_balance`: Tính tổng tồn kho hiện tại cho từng sản phẩm = (Tổng nhập - Tổng xuất).
    *   `v_lot_stock`: Theo dõi số lượng còn lại của **từng lô hàng cụ thể** và đếm ngược số ngày tới khi hết hạn.
*   **`backend/create_views_setup.py`**: Script mồi để chạy file SQL bên trên, khởi tạo các Views vào CSDL ngay khi mới thiết lập dự án.
*   **`backend/app/routes/inventory_routes.py`**: Xử lý logic API Xuất kho. Khi có yêu cầu xuất $X$ sản phẩm, hàm sẽ tự động gọi View `v_lot_stock`, sắp xếp các lô hàng theo thứ tự `Ngày hết hạn tăng dần` và tự động trừ hàng từ các lô gần hết hạn nhất.
*   **`backend/app/routes/alerts.py`**: Kết nối vào các View để cung cấp API cảnh báo nhanh chóng mà không cần tính toán thủ công.

### Phần C: API Cấu hình Cơ bản (CRUD Routes)
Các file xử lý tạo/đọc/sửa/xoá thông thường đã được làm gọn nhẹ và nhất quán.

*   **`backend/app/routes/auth.py`**: Xử lý cấp token JWT khi login, chặn tài khoản `is_active = False`.
*   **`backend/app/routes/products.py` & `suppliers.py` & `users.py`**: Chuyển toàn bộ hành vi xoá (DELETE) thành xoá mềm (Chỉ ẩn dữ liệu đi để bảo toàn lịch sử phiếu nhập xuất).

### Phần D: Giao diện Người dùng (React Frontend)
Toàn bộ Frontend đã được gắn với các API mới và sửa lỗi "rỗng dữ liệu" do sai tên cột.

*   **`frontend/src/pages/dashboard/DashboardPage.jsx`**: Đã kết nối với API `/inventory/dashboard` thực. Hiển thị sống động tổng giá trị tồn kho, các phiếu mới nhất, và đếm số lượng cảnh báo.
*   **`frontend/src/pages/inventory/InventoryPage.jsx`**: Cập nhật bảng Tồn kho để gọi thẳng vào `v_stock_balance` giúp dữ liệu trả về tức thời.
*   **`frontend/src/pages/alert/AlertsPage.jsx`**: Ghép 3 cảnh báo (Tồn thấp, Sắp hết hạn, Tồn lâu) vào một giao diện chuyển tab gọn gàng.
*   **Các trang danh sách (`ProductListPage`, `SupplierListPage`, `UserListPage`, `ImportListPage`, `ExportListPage`)**: Cập nhật lại các trường tương ứng (ví dụ: `code` thành `receipt_code` hoặc `product_code`).

---

## 3. CÁC PHẦN ĐÃ LƯỢC BỎ / DỌN DẸP
Trong quá trình làm việc nhóm, một số file bị rác đã được xử lý:
1.  **Thư mục `app/` bị lặp ở root**: Đã xoá do một thành viên push nhầm ra ngoài root thay vì đẩy vào trong thư mục `backend/`.
2.  **Thư mục `backend/app/schemas/`**: Được giữ nguyên vì đang trống, nhóm chưa áp dụng thư viện `marshmallow` nên không cần bận tâm về thư mục này.

---

## 4. BƯỚC TIẾP THEO DÀNH CHO NHÓM (Next Steps)
Dự án đã **sẵn sàng để test và thuyết trình**. Để chạy toàn bộ hệ thống, bạn chỉ cần:

1. Đảm bảo đã cài và chạy **PostgreSQL**. Tạo Database tên là `warehouse_db` với user/pass giống trong file `backend/.env`.
2. Mở terminal tại thư mục `backend`:
   ```bash
   pip install -r requirement.txt
   python app.py
   # Nhấn Ctrl+C để tắt
   python create_views_setup.py
   python app.py # Chạy lại để bắt đầu test
   ```
3. Mở terminal khác tại thư mục `frontend`:
   ```bash
   npm install
   npm run dev
   ```
