from app.extensions import db
from datetime import datetime


class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    product_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    unit = db.Column(db.String(30))
    category = db.Column(db.String(100))
    description = db.Column(db.Text)
    min_stock = db.Column(db.Integer, nullable=False, default=0)
    unit_price = db.Column(db.Numeric(15, 2))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    import_details = db.relationship('ImportDetail', backref='product', lazy=True)
    export_details = db.relationship('ExportDetail', backref='product', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'product_code': self.product_code,
            'name': self.name,
            'unit': self.unit,
            'category': self.category,
            'description': self.description,
            'min_stock': self.min_stock,
            'unit_price': float(self.unit_price) if self.unit_price else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
