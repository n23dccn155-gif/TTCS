from app.extensions import db
from datetime import datetime
import uuid


def generate_export_code():
    """Tạo mã phiếu xuất tự động dạng EXP-XXXXXXXX."""
    return f"EXP-{uuid.uuid4().hex[:8].upper()}"


class ExportReceipt(db.Model):
    __tablename__ = 'export_receipts'

    id = db.Column(db.Integer, primary_key=True)
    receipt_code = db.Column(
        db.String(50), unique=True, nullable=False,
        default=generate_export_code, index=True
    )
    export_date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    reason = db.Column(db.String(50), nullable=False, default='SELL')
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
            'note': self.note,
            'created_by': self.created_by,
            'creator_name': self.creator.username if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_details:
            data['details'] = [d.to_dict() for d in self.details]
        return data
