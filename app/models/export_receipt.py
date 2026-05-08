# app/models/export_receipt.py
# ============================================================
# PHẦN 1 - MODEL 3: PHIẾU XUẤT (ExportReceipt)
# ============================================================
# Bảng `export_receipts` lưu thông tin tổng quát của một lần xuất hàng.
#
# Lý do có cột `reason`: Trong quản lý kho, hàng xuất có nhiều lý do khác nhau:
#   - "SELL": Xuất bán cho khách hàng
#   - "RETURN": Xuất trả lại nhà cung cấp (hàng lỗi, hết hạn sớm)
#   - "INTERNAL": Xuất nội bộ (sử dụng trong công ty)
#   - "DISPOSE": Xuất hủy (hàng hết hạn, không còn dùng được)
#
# Phân loại theo reason giúp thống kê chính xác:
#   - Doanh số bán hàng thực (chỉ tính SELL)
#   - Chi phí hủy hàng (DISPOSE) — báo cáo cho ban quản lý

from app.extensions import db
from datetime import datetime, timezone
import uuid


def generate_export_code():
    """Tạo mã phiếu xuất tự động dạng EXP-XXXXXXXX."""
    return f"EXP-{uuid.uuid4().hex[:8].upper()}"


class ExportReceipt(db.Model):
    __tablename__ = 'export_receipts'

    id = db.Column(db.Integer, primary_key=True)

    receipt_code = db.Column(
        db.String(50),
        unique=True,
        nullable=False,
        default=generate_export_code,
        index=True
    )

    export_date = db.Column(
        db.Date,
        nullable=False,
        default=lambda: datetime.now(timezone.utc).date()
    )

    # reason: Lý do xuất kho — dùng để phân loại và thống kê.
    # Validate ở tầng API, không validate ở DB để linh hoạt mở rộng.
    reason = db.Column(db.String(50), nullable=False, default='SELL')

    note = db.Column(db.Text)

    # created_by: Audit trail — nhân viên nào lập phiếu xuất
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
    # RELATIONSHIPS
    # ----------------------------------------------------------------

    # Quan hệ với ExportDetail (1-N)
    details = db.relationship(
        'ExportDetail',
        back_populates='receipt',
        cascade='all, delete-orphan',
        lazy='select'
    )

    creator = db.relationship('User', foreign_keys=[created_by])

    def to_dict(self, include_details=False):
        data = {
            'id': self.id,
            'receipt_code': self.receipt_code,
            'export_date': self.export_date.isoformat() if self.export_date else None,
            'reason': self.reason,
            'note': self.note,
            'created_by': self.created_by,
            'creator_name': self.creator.username if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_details:
            data['details'] = [d.to_dict() for d in self.details]
        return data
