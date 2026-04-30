from app.extensions import db
from datetime import datetime


class ExportReceipt(db.Model):
    __tablename__ = 'export_receipts'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    reason = db.Column(db.String(255))
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(50), default='Hoàn thành')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    details = db.relationship('ExportDetail', backref='export_receipt', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'reason': self.reason,
            'date': self.date.isoformat() if self.date else None,
            'status': self.status,
            'totalItems': len(self.details),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
