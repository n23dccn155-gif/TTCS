from app.extensions import db
from datetime import datetime
import uuid


class ImportReceipt(db.Model):
    __tablename__ = 'import_receipts'

    @staticmethod
    def generate_next_code():
        """Tạo mã phiếu nhập tự động tuần tự dạng PN + YYMMDD + STT (3 số)."""
        today_str = datetime.now().strftime("%y%m%d")  # Ví dụ: '260518'
        prefix = f"PN{today_str}"
        try:
            latest = ImportReceipt.query.filter(
                ImportReceipt.receipt_code.like(f"{prefix}%")
            ).order_by(ImportReceipt.receipt_code.desc()).first()
            
            if latest:
                latest_code = latest.receipt_code
                stt = int(latest_code[-3:]) + 1
                return f"{prefix}{stt:03d}"
            else:
                return f"{prefix}001"
        except Exception:
            import uuid
            return f"PN{today_str}{uuid.uuid4().hex[:3].upper()}"

    id = db.Column(db.Integer, primary_key=True)
    receipt_code = db.Column(
        db.String(50), unique=True, nullable=False,
        default=lambda: ImportReceipt.generate_next_code(), index=True
    )
    import_date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    supplier_id = db.Column(
        db.Integer, db.ForeignKey('suppliers.id', ondelete='RESTRICT'),
        nullable=False, index=True
    )
    # [MỚI] Tổng tiền phiếu nhập (đồng bộ với totalAmount Frontend tính sẵn)
    total_amount = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    # [MỚI] Trạng thái phiếu: COMPLETED | CANCELLED
    status = db.Column(db.String(20), nullable=False, default='COMPLETED')
    note = db.Column(db.Text)
    created_by = db.Column(
        db.Integer, db.ForeignKey('users.id', ondelete='RESTRICT'),
        nullable=False
    )
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    details = db.relationship(
        'ImportDetail', backref='import_receipt', lazy=True,
        cascade='all, delete-orphan'
    )
    creator = db.relationship('User', foreign_keys=[created_by])

    def to_dict(self, include_details=False):
        data = {
            'id': self.id,
            'receipt_code': self.receipt_code,
            'import_date': self.import_date.isoformat() if self.import_date else None,
            'supplier_id': self.supplier_id,
            'supplier_name': self.supplier.name if self.supplier else None,
            'total_amount': float(self.total_amount) if self.total_amount else 0,
            'status': self.status,
            'note': self.note,
            'created_by': self.created_by,
            'creator_name': self.creator.full_name if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_details:
            data['details'] = [d.to_dict() for d in self.details]
        return data
