# app/models/import_detail.py
# ============================================================
# PHẦN 1 - MODEL 2: CHI TIẾT NHẬP (ImportDetail)
# ============================================================
# Bảng `import_details` lưu từng dòng sản phẩm trong một phiếu nhập.
#
# *** HAI CỘT QUAN TRỌNG NHẤT: `expiry_date` và `batch_code` ***
#
# Lý do thiết kế — Quản lý hàng hóa theo LÔ (Lot Tracking):
#
# Trong quản lý kho dược phẩm, thực phẩm, hóa chất, v.v., cùng một sản phẩm
# được nhập vào nhiều lần khác nhau, mỗi lần từ một lô sản xuất khác nhau
# (khác nhà máy, khác ngày sản xuất, hạn sử dụng khác nhau).
#
# Ví dụ thực tế: Sản phẩm "Paracetamol 500mg":
#   - Lô A nhập 01/01/2025: batch_code="LOT-001", hết hạn 01/01/2027
#   - Lô B nhập 01/06/2025: batch_code="LOT-002", hết hạn 01/06/2027
#
# Nếu không track theo lô, hệ thống không thể:
#   1. Cảnh báo lô hàng sắp hết hạn (API /alerts -> expiring_soon)
#   2. Xuất theo FEFO (First Expired First Out) — bắt buộc với hàng có hạn dùng
#   3. Thu hồi hàng khi nhà sản xuất thông báo lỗi một lô cụ thể
#
# Đây là nền tảng của toàn bộ nghiệp vụ kho thông minh trong hệ thống này.

from app.extensions import db
from datetime import datetime, timezone


class ImportDetail(db.Model):
    __tablename__ = 'import_details'

    id = db.Column(db.Integer, primary_key=True)

    # receipt_id: Khóa ngoại trỏ về phiếu nhập cha (import_receipts)
    receipt_id = db.Column(
        db.Integer,
        db.ForeignKey('import_receipts.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )

    # product_id: Khóa ngoại trỏ về sản phẩm trong danh mục
    product_id = db.Column(
        db.Integer,
        db.ForeignKey('products.id', ondelete='RESTRICT'),
        nullable=False,
        index=True
    )

    # quantity: Số lượng nhập vào của lô này.
    # Đây là dữ liệu GỐC (immutable) — không bao giờ được sửa sau khi nhập.
    # Tồn kho của lô = quantity - SUM(exported từ lô này) — tính bằng View.
    quantity = db.Column(db.Integer, nullable=False)

    # unit_price: Giá nhập tại thời điểm nhập. Lưu tại đây vì giá có thể
    # thay đổi theo từng lần nhập — không dùng giá tham khảo từ bảng products.
    unit_price = db.Column(db.Numeric(15, 2), nullable=False, default=0)

    # *** BATCH_CODE — MÃ LÔ SẢN XUẤT ***
    # Mã lô do nhà sản xuất cấp, in trên bao bì sản phẩm (VD: "LOT-20250115-A").
    # Đây là mã truy xuất nguồn gốc chính thức theo quy định quản lý dược/thực phẩm.
    # Khi có sự cố (thu hồi sản phẩm), chỉ cần query theo batch_code để xác định
    # toàn bộ hàng từ lô đó còn trong kho hay đã xuất đi đâu.
    batch_code = db.Column(db.String(100), nullable=True)

    # *** EXPIRY_DATE — HẠN SỬ DỤNG ***
    # Cột này là "trái tim" của thuật toán FEFO (First Expired, First Out).
    # FEFO là quy tắc bắt buộc trong kho dược: xuất lô nào hết hạn sớm nhất trước
    # để tránh hàng hết hạn nằm tồn kho (thiệt hại kinh tế + vi phạm pháp luật).
    #
    # Khi tạo phiếu xuất, hệ thống sẽ ORDER BY expiry_date ASC để lấy lô
    # gần hết hạn nhất ra trước — logic này nằm trong API POST /exports.
    #
    # nullable=True: Cho phép null vì một số sản phẩm không có hạn sử dụng
    # (vật tư, thiết bị,...). Khi filter expiring_soon, sẽ bỏ qua các lô null.
    expiry_date = db.Column(db.Date, nullable=True, index=True)

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    # ----------------------------------------------------------------
    # RELATIONSHIPS
    # ----------------------------------------------------------------

    # Quan hệ với ImportReceipt (N-1): Nhiều dòng chi tiết thuộc 1 phiếu nhập
    receipt = db.relationship('ImportReceipt', back_populates='details')

    # Quan hệ với Product (N-1): Nhiều dòng chi tiết có thể là cùng 1 sản phẩm
    product = db.relationship('Product', lazy='select')

    # Quan hệ với ExportDetail (1-N): 1 dòng nhập có thể được xuất ra nhiều lần
    # (mỗi lần xuất 1 phần cho đến khi hết lô)
    export_details = db.relationship(
        'ExportDetail',
        back_populates='import_detail',
        lazy='dynamic'  # lazy='dynamic' để có thể thêm filter/aggregate sau
    )

    def to_dict(self):
        return {
            'id': self.id,
            'receipt_id': self.receipt_id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'product_code': self.product.product_code if self.product else None,
            'quantity': self.quantity,
            'unit_price': float(self.unit_price) if self.unit_price else 0,
            'batch_code': self.batch_code,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
