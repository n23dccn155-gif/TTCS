from app.extensions import db


class ExportDetail(db.Model):
    __tablename__ = 'export_details'

    id = db.Column(db.Integer, primary_key=True)
    export_receipt_id = db.Column(db.Integer, db.ForeignKey('export_receipts.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    import_detail_id = db.Column(db.Integer, db.ForeignKey('import_details.id'), nullable=False) # Added import_detail_id
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, default=0) # Added price

    def to_dict(self):
        return {
            'id': self.id,
            'export_receipt_id': self.export_receipt_id,
            'product_id': self.product_id,
            'import_detail_id': self.import_detail_id,
            'product_name': self.product.name if self.product else None,
            'quantity': self.quantity,
            'price': self.price,
        }
