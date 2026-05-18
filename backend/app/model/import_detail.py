from app.extensions import db
from datetime import datetime


class ImportDetail(db.Model):
    __tablename__ = 'import_details'

    id = db.Column(db.Integer, primary_key=True)
    receipt_id = db.Column(
        db.Integer, db.ForeignKey('import_receipts.id', ondelete='CASCADE'),
        nullable=False, index=True
    )
    product_id = db.Column(
        db.Integer, db.ForeignKey('products.id', ondelete='RESTRICT'),
        nullable=False, index=True
    )
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    batch_code = db.Column(db.String(100))
    expiry_date = db.Column(db.Date, index=True)
    # [MỚI] Vị trí kệ thực tế chứa lô hàng này trong kho
    location_id = db.Column(
        db.Integer, db.ForeignKey('locations.id', ondelete='SET NULL'),
        nullable=True, index=True
    )
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    export_details = db.relationship(
        'ExportDetail', backref='import_detail', lazy=True
    )
    # Quan hệ tới vị trí kệ chứa lô hàng này
    lot_location = db.relationship('Location', foreign_keys=[location_id])

    def to_dict(self):
        return {
            'id': self.id,
            'receipt_id': self.receipt_id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'product_code': self.product.product_code if self.product else None,
            'product_unit': self.product.unit if self.product else None,
            'quantity': self.quantity,
            'unit_price': float(self.unit_price) if self.unit_price else 0,
            'batch_code': self.batch_code,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'location_id': self.location_id,
            'location_code': self.lot_location.location_code if self.lot_location else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
