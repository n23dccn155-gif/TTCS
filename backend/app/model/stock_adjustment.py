from app.extensions import db
from datetime import datetime
import uuid


def generate_adjustment_code():
    """Tạo mã phiếu kiểm kê tự động dạng ADJ-XXXXXXXX."""
    return f"ADJ-{uuid.uuid4().hex[:8].upper()}"


class StockAdjustment(db.Model):
    """
    Bảng ghi nhận các phiếu kiểm kê/điều chỉnh kho.
    Xử lý chênh lệch giữa tồn kho phần mềm và thực tế (hao hụt, hỏng vỡ, mất mát...).
    adjusted_quantity: Số dương = nhập bù, Số âm = hao hụt/mất mát.
    """
    __tablename__ = 'stock_adjustments'

    id = db.Column(db.Integer, primary_key=True)
    adjustment_code = db.Column(
        db.String(50), unique=True, nullable=False,
        default=generate_adjustment_code, index=True
    )
    adjustment_date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    product_id = db.Column(
        db.Integer, db.ForeignKey('products.id', ondelete='RESTRICT'),
        nullable=False, index=True
    )
    # Số lượng điều chỉnh: dương = bù thêm, âm = trừ đi (hao hụt)
    adjusted_quantity = db.Column(db.Integer, nullable=False)
    # Lý do điều chỉnh: 'DAMAGE' (hư hỏng), 'LOSS' (mất mát), 'COUNT_ERROR' (đếm sai), 'OTHER'
    reason = db.Column(db.String(50), nullable=False, default='OTHER')
    note = db.Column(db.Text)
    created_by = db.Column(
        db.Integer, db.ForeignKey('users.id', ondelete='RESTRICT'),
        nullable=False
    )
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Quan hệ
    product = db.relationship('Product', backref='adjustments', lazy=True)
    creator = db.relationship('User', foreign_keys=[created_by])

    def to_dict(self):
        return {
            'id': self.id,
            'adjustment_code': self.adjustment_code,
            'adjustment_date': self.adjustment_date.isoformat() if self.adjustment_date else None,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'product_code': self.product.product_code if self.product else None,
            'adjusted_quantity': self.adjusted_quantity,
            'reason': self.reason,
            'note': self.note,
            'created_by': self.created_by,
            'creator_name': self.creator.full_name if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
