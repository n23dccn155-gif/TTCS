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
    # FK trỏ về vị trí kệ mặc định để cất sản phẩm này
    location_id = db.Column(
        db.Integer, db.ForeignKey('locations.id', ondelete='SET NULL'),
        nullable=True, index=True
    )
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    import_details = db.relationship('ImportDetail', backref='product', lazy=True)
    export_details = db.relationship('ExportDetail', backref='product', lazy=True)
    # Quan hệ tới vị trí kệ mặc định
    default_location = db.relationship('Location', foreign_keys=[location_id])
    
    # Quan hệ nhiều-nhiều với Nhà cung cấp thông qua bảng giá hợp đồng
    suppliers = db.relationship(
        'Supplier',
        secondary=lambda: db.metadata.tables['supplier_product_prices'],
        lazy='subquery',
        backref=db.backref('products', lazy='subquery', overlaps="products,suppliers")
    )
    
    # Quan hệ một-nhiều trực tiếp với bảng giá chi tiết
    supplier_prices = db.relationship(
        'SupplierProductPrice',
        lazy='subquery',
        cascade='all, delete-orphan',
        overlaps="products,suppliers"
    )

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
            'location_id': self.location_id,
            'location_code': self.default_location.location_code if self.default_location else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'supplier_ids': [sp.supplier_id for sp in self.supplier_prices],
            'supplier_names': [sp.supplier.name for sp in self.supplier_prices if sp.supplier],
            'supplier_prices': [sp.to_dict() for sp in self.supplier_prices],
        }
