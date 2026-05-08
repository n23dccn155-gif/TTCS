-- ============================================================
-- PHẦN 2: POSTGRESQL VIEWS — TỒN KHO REAL-TIME
-- ============================================================
--
-- *** TẠI SAO DÙNG VIEW THAY VÌ CỘT TĨNH HOẶC TRIGGER? ***
--
-- Phương án 1 — CỘT TĨNH (current_stock trong bảng products):
--   Vấn đề: Race condition khi nhiều transaction đồng thời UPDATE cùng một hàng.
--   Ví dụ: Transaction A và B cùng đọc current_stock=100, cùng trừ 80.
--   Cả hai commit thành công → current_stock = 20 dù thực tế đã xuất 160.
--   Giải pháp naïve: Dùng SELECT FOR UPDATE → tạo bottleneck, giảm throughput.
--
-- Phương án 2 — TRIGGER:
--   Vấn đề: Trigger chạy trong cùng transaction với INSERT, làm tăng độ phức tạp.
--   Khó debug, khó test, logic nghiệp vụ bị phân tán giữa Python và SQL.
--   Nếu trigger fail → cả transaction rollback, UX xấu.
--   Trigger cũng vẫn UPDATE cột tĩnh → vẫn bị race condition nếu không lock đúng.
--
-- Phương án 3 — POSTGRESQL VIEW (phương án đã chọn):
--   Ưu điểm:
--   ✅ KHÔNG có state cần đồng bộ — tồn kho được TÍNH LẠI mỗi lần query.
--   ✅ Tận dụng MVCC của PostgreSQL: Mỗi SELECT trên View luôn thấy snapshot
--      nhất quán tại thời điểm đó — không cần lock, không race condition.
--   ✅ Logic tập trung tại một nơi (file SQL này) — dễ audit, dễ sửa.
--   ✅ Có thể dùng MATERIALIZED VIEW nếu cần cache khi DB scale lớn.
--   ✅ Hoàn toàn idempotent — chạy query bao nhiêu lần kết quả đều đúng.
--
-- MVCC (Multi-Version Concurrency Control):
--   PostgreSQL giữ nhiều phiên bản (version) của cùng một dòng dữ liệu.
--   Mỗi transaction đọc snapshot riêng → readers không block writers và ngược lại.
--   View chỉ đọc (READ) nên luôn hưởng lợi từ MVCC mà không cần lock gì thêm.
-- ============================================================


-- ============================================================
-- VIEW 1: v_stock_balance — TỒN KHO TỔNG THEO SẢN PHẨM
-- ============================================================
-- Mục đích: Trả lời câu hỏi "Hiện tại kho còn bao nhiêu sản phẩm X?"
--
-- Công thức: current_stock = total_imported - total_exported
--
-- Giải thích kỹ thuật:
--   - LEFT JOIN import_details ON products.id: Lấy tất cả sản phẩm, kể cả
--     sản phẩm chưa từng được nhập (total_imported = 0).
--   - LEFT JOIN export_details ON import_details.id: JOIN theo chuỗi
--     product → import_details → export_details để aggregate đúng.
--   - COALESCE(SUM(...), 0): Xử lý trường hợp chưa có giao dịch nhập/xuất
--     nào → SUM trả về NULL, COALESCE chuyển thành 0 để phép trừ hoạt động đúng.
--   - GROUP BY products.id: Gộp tất cả các dòng import/export theo sản phẩm.

CREATE OR REPLACE VIEW v_stock_balance AS
SELECT
    p.id                                            AS product_id,
    p.product_code,
    p.name                                          AS product_name,
    p.unit,
    p.category,
    p.min_stock,
    -- Tổng số lượng đã nhập vào kho của sản phẩm này (qua tất cả các phiếu nhập)
    COALESCE(SUM(id_agg.total_imported), 0)         AS total_imported,
    -- Tổng số lượng đã xuất ra khỏi kho của sản phẩm này (qua tất cả các phiếu xuất)
    COALESCE(SUM(id_agg.total_exported), 0)         AS total_exported,
    -- TỒN KHO HIỆN TẠI = Tổng nhập - Tổng xuất
    -- Đây là giá trị được tính động mỗi lần query, KHÔNG lưu ở đâu cả.
    COALESCE(SUM(id_agg.total_imported), 0)
        - COALESCE(SUM(id_agg.total_exported), 0)  AS current_stock

FROM products p

-- Subquery aggregate per import_detail để tránh "fan-out" khi JOIN hai bảng N-N.
-- Nếu JOIN thẳng import_details và export_details rồi GROUP BY product,
-- PostgreSQL sẽ nhân bản dòng (Cartesian product) → SUM bị sai.
-- Dùng subquery aggregate trước → JOIN sau là pattern an toàn hơn.
LEFT JOIN (
    SELECT
        id_inner.product_id,
        id_inner.id                             AS import_detail_id,
        id_inner.quantity                       AS total_imported,
        COALESCE(SUM(ed.quantity), 0)           AS total_exported
    FROM import_details id_inner
    LEFT JOIN export_details ed ON ed.import_detail_id = id_inner.id
    GROUP BY id_inner.id, id_inner.product_id, id_inner.quantity
) AS id_agg ON id_agg.product_id = p.id

WHERE p.is_active = TRUE

GROUP BY p.id, p.product_code, p.name, p.unit, p.category, p.min_stock

ORDER BY p.product_code;


-- ============================================================
-- VIEW 2: v_lot_stock — TỒN KHO CHI TIẾT THEO TỪNG LÔ
-- ============================================================
-- Mục đích: Trả lời câu hỏi "Lô hàng X (batch_code Y, hết hạn Z) còn bao nhiêu?"
--
-- Đây là View phục vụ trực tiếp thuật toán FEFO trong API POST /exports:
--   1. Query v_lot_stock WHERE product_id = ? AND current_lot_stock > 0
--   2. ORDER BY expiry_date ASC NULLS LAST
--   → Lô hết hạn sớm nhất nằm đầu → xuất lô đó trước (FEFO)
--
-- Giải thích kỹ thuật:
--   - Mỗi dòng trong v_lot_stock = 1 dòng trong import_details (1 lô hàng).
--   - current_lot_stock = quantity (nhập vào lô) - SUM(exported từ lô này)
--   - JOIN với import_receipts để lấy ngày nhập (dùng cho slow_moving detection)
--   - NULLS LAST trong ứng dụng: Hàng không có hạn sử dụng xếp sau
--     (xuất sau hàng có hạn sử dụng — tránh ưu tiên hàng không hết hạn).

CREATE OR REPLACE VIEW v_lot_stock AS
SELECT
    -- ID của lô hàng (chính là ID của dòng trong import_details)
    -- Đây là giá trị dùng làm import_detail_id khi tạo export_details
    id_lot.id                                           AS lot_id,

    id_lot.product_id,
    p.product_code,
    p.name                                              AS product_name,
    p.unit,

    -- Thông tin phiếu nhập cha (để biết lô này nhập ngày nào, từ NCC nào)
    ir.id                                               AS receipt_id,
    ir.receipt_code,
    ir.import_date,
    ir.supplier_id,

    -- Thông tin đặc trưng của lô — trái tim của lot tracking
    id_lot.batch_code,
    id_lot.expiry_date,
    id_lot.unit_price,

    -- Số lượng NHẬP VÀO của lô này (immutable — không bao giờ thay đổi)
    id_lot.quantity                                     AS import_qty,

    -- Số lượng ĐÃ XUẤT từ lô này = SUM tất cả export_details trỏ về lô này
    -- COALESCE xử lý trường hợp lô chưa xuất lần nào (SUM = NULL → 0)
    COALESCE(SUM(ed.quantity), 0)                       AS exported_qty,

    -- TỒN KHO LÔ HIỆN TẠI = Nhập - Đã xuất
    -- Khi current_lot_stock = 0: lô đã hết, không được chọn để xuất nữa
    -- Khi current_lot_stock < 0: BUG nghiêm trọng — có thể detect qua monitoring
    id_lot.quantity - COALESCE(SUM(ed.quantity), 0)    AS current_lot_stock

FROM import_details id_lot

-- JOIN để lấy thông tin sản phẩm (tên, đơn vị, ...)
INNER JOIN products p ON p.id = id_lot.product_id

-- JOIN để lấy thông tin phiếu nhập cha (ngày nhập, NCC)
INNER JOIN import_receipts ir ON ir.id = id_lot.receipt_id

-- LEFT JOIN export_details: Lô chưa xuất lần nào vẫn xuất hiện (với exported_qty=0)
LEFT JOIN export_details ed ON ed.import_detail_id = id_lot.id

-- Chỉ hiển thị sản phẩm đang hoạt động
WHERE p.is_active = TRUE

-- GROUP BY theo từng lô — mỗi lô (import_detail) là 1 dòng kết quả
GROUP BY
    id_lot.id,
    id_lot.product_id,
    p.product_code,
    p.name,
    p.unit,
    ir.id,
    ir.receipt_code,
    ir.import_date,
    ir.supplier_id,
    id_lot.batch_code,
    id_lot.expiry_date,
    id_lot.unit_price,
    id_lot.quantity

-- Mặc định sắp xếp theo expiry_date để tiện dùng cho FEFO
-- NULLS LAST: Hàng không có hạn sử dụng xếp sau hàng có hạn
ORDER BY id_lot.expiry_date ASC NULLS LAST, ir.import_date ASC;
