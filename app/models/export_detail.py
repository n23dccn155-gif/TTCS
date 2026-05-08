# app/models/export_detail.py
# ============================================================
# PHẦN 1 - MODEL 4: CHI TIẾT XUẤT (ExportDetail)
# ============================================================
# Bảng `export_details` lưu từng dòng sản phẩm trong một phiếu xuất.
#
# *** KHÓA NGOẠI QUAN TRỌNG NHẤT: `import_detail_id` ***
#
# Đây là cột then chốt hoàn thiện thuật toán FEFO và truy xuất nguồn gốc:
#
# Vấn đề kỹ thuật cần giải quyết:
#   Khi xuất 50 đơn vị "Paracetamol", hệ thống cần biết chính xác:
#   "50 đơn vị này được lấy từ LÔ NÀO?" chứ không chỉ "từ sản phẩm nào".
#
# Tại sao cần biết từ lô nào?
#   1. FEFO TRACKING: Xác nhận rằng hệ thống đã xuất đúng lô (hết hạn trước)
#      thay vì chọn ngẫu nhiên — kiểm chứng được thuật toán FEFO đang chạy đúng.
#   2. LOT STOCK CALCULATION: View `v_lot_stock` tính tồn kho từng lô bằng:
#      lot_stock = import_detail.quantity - SUM(export_detail.quantity WHERE import_detail_id = lot_id)
#      → Nếu không có FK này, View không thể biết đã xuất bao nhiêu từ lô cụ thể.
#   3. PRODUCT RECALL: Khi nhà sản xuất thu hồi batch "LOT-001", query:
#      SELECT * FROM export_details WHERE import_detail_id IN (
#          SELECT id FROM import_details WHERE batch_code = 'LOT-001'
#      )
#      → Biết ngay đã xuất lô đó đi đâu, bao nhiêu — truy tìm khách hàng để thu hồi.
#
# Kết luận: `import_detail_id` là cầu nối thiết yếu giữa "xuất ra" và "nhập từ đâu",
# biến hệ thống từ quản lý kho đơn giản thành hệ thống truy xuất nguồn gốc đầy đủ.

from app.extensions import db
from datetime import datetime, timezone


class ExportDetail(db.Model):
    __tablename__ = 'export_details'

    id = db.Column(db.Integer, primary_key=True)

    # receipt_id: Khóa ngoại trỏ về phiếu xuất cha
    receipt_id = db.Column(
        db.Integer,
        db.ForeignKey('export_receipts.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )

    # product_id: Khóa ngoại trỏ về sản phẩm.
    # Dư thừa (redundant) so với import_detail_id nhưng cần thiết để:
    #   - Query nhanh tất cả giao dịch của 1 sản phẩm mà không cần JOIN import_details
    #   - Đảm bảo tính nhất quán — product_id ở đây phải = product_id trong import_detail
    product_id = db.Column(
        db.Integer,
        db.ForeignKey('products.id', ondelete='RESTRICT'),
        nullable=False,
        index=True
    )

    # *** import_detail_id — KHÓA NGOẠI TRUY XUẤT LÔ HÀNG ***
    # Trỏ chính xác về DÒ NÀO trong bảng import_details cung cấp hàng cho lần xuất này.
    # Đây là cột bắt buộc — không cho phép NULL vì mọi xuất kho đều phải rõ nguồn gốc.
    # ondelete='RESTRICT': Không cho phép xóa dòng import_detail nếu đã có xuất từ đó.
    import_detail_id = db.Column(
        db.Integer,
        db.ForeignKey('import_details.id', ondelete='RESTRICT'),
        nullable=False,
        index=True
    )

    # quantity: Số lượng xuất từ lô cụ thể này.
    # Ràng buộc: quantity <= (import_detail.quantity - tổng đã xuất từ lô này)
    # → Ràng buộc này được kiểm tra ở tầng API (thuật toán FEFO), không ở DB.
    quantity = db.Column(db.Integer, nullable=False)

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    # ----------------------------------------------------------------
    # RELATIONSHIPS — Khai báo đầy đủ để ORM điều hướng đúng
    # ----------------------------------------------------------------

    # Quan hệ với ExportReceipt (N-1): Nhiều dòng chi tiết thuộc 1 phiếu xuất
    receipt = db.relationship('ExportReceipt', back_populates='details')

    # Quan hệ với Product (N-1): Dùng để lấy thông tin sản phẩm nhanh
    product = db.relationship('Product', lazy='select')

    # *** Quan hệ với ImportDetail (N-1) — QUAN TRỌNG NHẤT ***
    # Mỗi dòng xuất trỏ về đúng 1 dòng nhập (lô hàng).
    # Cùng với FK `import_detail_id`, relationship này cho phép ORM:
    #   - Từ ExportDetail → biết ngay thông tin lô (batch_code, expiry_date)
    #   - Từ ImportDetail → biết tất cả lần xuất từ lô đó (import_detail.export_details)
    import_detail = db.relationship('ImportDetail', back_populates='export_details')

    def to_dict(self):
        return {
            'id': self.id,
            'receipt_id': self.receipt_id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'import_detail_id': self.import_detail_id,
            'batch_code': self.import_detail.batch_code if self.import_detail else None,
            'quantity': self.quantity,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
