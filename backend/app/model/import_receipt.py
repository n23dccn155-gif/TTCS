from app.extensions import db
from datetime import datetime


class ImportReceipt(db.Model):
    __tablename__ = 'import_receipts'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(50), default='Hoàn thành')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    details = db.relationship('ImportDetail', backref='import_receipt', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'supplier': self.supplier.name if self.supplier else None,
            'supplier_id': self.supplier_id,
            'date': self.date.isoformat() if self.date else None,
            'status': self.status,
            'totalItems': len(self.details),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
