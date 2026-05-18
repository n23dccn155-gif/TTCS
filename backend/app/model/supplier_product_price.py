from app.extensions import db
from datetime import datetime

class SupplierProductPrice(db.Model):
    __tablename__ = 'supplier_product_prices'

    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id', ondelete='CASCADE'), primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), primary_key=True)
    contract_price = db.Column(db.Numeric(15, 2), nullable=False, default=0.0)
    lead_time_days = db.Column(db.Integer, nullable=False, default=2)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    supplier = db.relationship('Supplier', backref=db.backref('supplier_product_links', cascade='all, delete-orphan', overlaps="products,suppliers"), overlaps="products,suppliers")
    product = db.relationship('Product', backref=db.backref('supplier_product_links', cascade='all, delete-orphan', overlaps="products,supplier_prices,suppliers"), overlaps="products,supplier_prices,suppliers")

    def to_dict(self):
        return {
            'supplier_id': self.supplier_id,
            'supplier_name': self.supplier.name if self.supplier else None,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'contract_price': float(self.contract_price),
            'lead_time_days': self.lead_time_days,
        }
