from app.extensions import db
from datetime import datetime


class ExportDetail(db.Model):
    __tablename__ = 'export_details'

    id = db.Column(db.Integer, primary_key=True)
    receipt_id = db.Column(
        db.Integer, db.ForeignKey('export_receipts.id', ondelete='CASCADE'),
        nullable=False, index=True
    )
    product_id = db.Column(
        db.Integer, db.ForeignKey('products.id', ondelete='RESTRICT'),
        nullable=False, index=True
    )
    import_detail_id = db.Column(
        db.Integer, db.ForeignKey('import_details.id', ondelete='RESTRICT'),
        nullable=False, index=True
    )
    quantity = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

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
