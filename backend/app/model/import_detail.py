from app.extensions import db


class ImportDetail(db.Model):
    __tablename__ = 'import_details'

    id = db.Column(db.Integer, primary_key=True)
    import_receipt_id = db.Column(db.Integer, db.ForeignKey('import_receipts.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, default=0)
    expiry_date = db.Column(db.Date)
    batch_code = db.Column(db.String(50)) # Added batch_code as per report

    def to_dict(self):
        return {
            'id': self.id,
            'import_receipt_id': self.import_receipt_id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'quantity': self.quantity,
            'price': self.price,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'batch_code': self.batch_code,
        }
