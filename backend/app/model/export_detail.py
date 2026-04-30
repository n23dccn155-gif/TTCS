from app.extensions import db


class ExportDetail(db.Model):
    __tablename__ = 'export_details'

    id = db.Column(db.Integer, primary_key=True)
    export_receipt_id = db.Column(db.Integer, db.ForeignKey('export_receipts.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'export_receipt_id': self.export_receipt_id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'quantity': self.quantity,
        }
