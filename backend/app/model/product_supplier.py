from app.extensions import db

# Bảng trung gian: quan hệ nhiều-nhiều giữa Sản phẩm và Nhà cung cấp
product_suppliers = db.Table(
    'product_suppliers',
    db.Column('product_id', db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), primary_key=True),
    db.Column('supplier_id', db.Integer, db.ForeignKey('suppliers.id', ondelete='CASCADE'), primary_key=True),
)
