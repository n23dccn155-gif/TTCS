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
    # [MỚI] Đơn giá bán ra thực tế — bắt buộc để tính Doanh thu & Lợi nhuận gộp
    # Lợi nhuận gộp = (selling_price - import_detail.unit_price) * quantity
    selling_price = db.Column(db.Numeric(15, 2), nullable=True, default=0)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        cost_price = float(self.import_detail.unit_price) if self.import_detail and self.import_detail.unit_price else 0
        sell_price = float(self.selling_price) if self.selling_price else 0
        return {
            'id': self.id,
            'receipt_id': self.receipt_id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'product_unit': self.product.unit if self.product else None,
            'import_detail_id': self.import_detail_id,
            'batch_code': self.import_detail.batch_code if self.import_detail else None,
            'quantity': self.quantity,
            'selling_price': sell_price,
            'cost_price': cost_price,
            # Lợi nhuận gộp từng dòng xuất
            'gross_profit': round((sell_price - cost_price) * self.quantity, 2),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

