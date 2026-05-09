# app/models/import_receipt.py
# ============================================================
# PHẦN 1 - MODEL 1: PHIẾU NHẬP (ImportReceipt)
# ============================================================
# Bảng `import_receipts` đóng vai trò là "vỏ phiếu" — lưu thông tin
# tổng quát của một lần nhập hàng từ nhà cung cấp.
#
# Tư duy thiết kế Master-Detail (Header-Line):
#   - Master (phiếu nhập) = import_receipts: ai nhập, nhập ngày nào, từ NCC nào
#   - Detail (chi tiết nhập) = import_details: nhập sản phẩm nào, bao nhiêu, giá bao nhiêu
#
# Tách thành 2 bảng thay vì 1 bảng vì 1 phiếu nhập có thể chứa
# nhiều dòng sản phẩm khác nhau (quan hệ 1-N).

from app.extensions import db
from datetime import datetime, timezone
import uuid


def generate_receipt_code():
    """Tạo mã phiếu nhập tự động dạng IMP-XXXXXXXX để dễ tra cứu."""
    return f"IMP-{uuid.uuid4().hex[:8].upper()}"


class ImportReceipt(db.Model):
    __tablename__ = 'import_receipts'

    id = db.Column(db.Integer, primary_key=True)

    # receipt_code: Mã phiếu nhập hiển thị cho người dùng (human-readable).
    # Tách biệt với `id` (internal key) để tránh lộ thông tin về số lượng giao dịch
    # và dễ dàng thay đổi format mà không ảnh hưởng đến foreign key.
    receipt_code = db.Column(
        db.String(50),
        unique=True,
        nullable=False,
        default=generate_receipt_code,
        index=True
    )

    import_date = db.Column(
        db.Date,
        nullable=False,
        default=lambda: datetime.now(timezone.utc).date()
    )

    # supplier_id: Khóa ngoại trỏ về bảng suppliers.
    # Giúp truy vết nguồn gốc hàng hóa theo yêu cầu kiểm toán kho.
    supplier_id = db.Column(
        db.Integer,
        db.ForeignKey('suppliers.id', ondelete='RESTRICT'),
        nullable=False,
        index=True
    )

    note = db.Column(db.Text)

    # created_by: Khóa ngoại trỏ về bảng users.
    # Ghi lại nhân viên nào tạo phiếu — phục vụ audit trail và phân quyền.
    # ondelete='RESTRICT': Không cho phép xóa user nếu họ đã tạo phiếu nhập.
    created_by = db.Column(
        db.Integer,
        db.ForeignKey('users.id', ondelete='RESTRICT'),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    # ----------------------------------------------------------------
    # RELATIONSHIPS — Khai báo đầy đủ để ORM hiểu được quan hệ giữa các bảng
    # ----------------------------------------------------------------

    # Quan hệ với Supplier (N-1): Nhiều phiếu nhập từ 1 nhà cung cấp
    supplier = db.relationship('Supplier', back_populates='import_receipts')

    # Quan hệ với ImportDetail (1-N): 1 phiếu nhập có nhiều dòng chi tiết
    # cascade='all, delete-orphan': Khi xóa phiếu nhập, tự động xóa các dòng chi tiết
    # Tuy nhiên trong thực tế kho, nên hạn chế xóa phiếu (chỉ cho phép hủy/void)
    details = db.relationship(
        'ImportDetail',
        back_populates='receipt',
        cascade='all, delete-orphan',
        lazy='select'
    )

    # Quan hệ với User (N-1): Nhiều phiếu có thể do 1 nhân viên tạo
    creator = db.relationship('User', foreign_keys=[created_by])

    def to_dict(self, include_details=False):
        data = {
            'id': self.id,
            'receipt_code': self.receipt_code,
            'import_date': self.import_date.isoformat() if self.import_date else None,
            'supplier_id': self.supplier_id,
            'supplier_name': self.supplier.name if self.supplier else None,
            'note': self.note,
            'created_by': self.created_by,
            'creator_name': self.creator.username if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_details:
            data['details'] = [d.to_dict() for d in self.details]
        return data
