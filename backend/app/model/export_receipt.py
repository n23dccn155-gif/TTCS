from app.extensions import db
from datetime import datetime
import uuid


class ExportReceipt(db.Model):
    __tablename__ = 'export_receipts'

    @staticmethod
    def generate_next_code():
        """Tạo mã phiếu xuất tự động tuần tự dạng PX + YYMMDD + STT (3 số)."""
        today_str = datetime.now().strftime("%y%m%d")  # Ví dụ: '260518'
        prefix = f"PX{today_str}"
        try:
            latest = ExportReceipt.query.filter(
                ExportReceipt.receipt_code.like(f"{prefix}%")
            ).order_by(ExportReceipt.receipt_code.desc()).first()
            
            if latest:
                latest_code = latest.receipt_code
                stt = int(latest_code[-3:]) + 1
                return f"{prefix}{stt:03d}"
            else:
                return f"{prefix}001"
        except Exception:
            import uuid
            return f"PX{today_str}{uuid.uuid4().hex[:3].upper()}"

    id = db.Column(db.Integer, primary_key=True)
    receipt_code = db.Column(
        db.String(50), unique=True, nullable=False,
        default=lambda: ExportReceipt.generate_next_code(), index=True
    )
    export_date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    reason = db.Column(db.String(50), nullable=False, default='SELL')
    # [MỚI] Tổng giá trị hàng xuất (Số lượng * Giá bán, tính từ export_details)
    total_amount = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    # [MỚI] Trạng thái phiếu: COMPLETED | CANCELLED
    status = db.Column(db.String(20), nullable=False, default='COMPLETED')
    customer_name = db.Column(db.String(255))
    delivery_address = db.Column(db.String(500))
    note = db.Column(db.Text)
    created_by = db.Column(
        db.Integer, db.ForeignKey('users.id', ondelete='RESTRICT'),
        nullable=False
    )
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    details = db.relationship(
        'ExportDetail', backref='export_receipt', lazy=True,
        cascade='all, delete-orphan'
    )
    creator = db.relationship('User', foreign_keys=[created_by])

    def to_dict(self, include_details=False):
        data = {
            'id': self.id,
            'receipt_code': self.receipt_code,
            'export_date': self.export_date.isoformat() if self.export_date else None,
            'reason': self.reason,
            'total_amount': float(self.total_amount) if self.total_amount else 0,
            'status': self.status,
            'customer_name': self.customer_name,
            'delivery_address': self.delivery_address,
            'note': self.note,
            'created_by': self.created_by,
            'creator_name': self.creator.full_name if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_details:
            data['details'] = [d.to_dict() for d in self.details]
        return data

