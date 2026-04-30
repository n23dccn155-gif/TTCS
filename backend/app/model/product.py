from app.extensions import db
from datetime import datetime


class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(100))
    unit = db.Column(db.String(50))
    min_stock = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    import_details = db.relationship('ImportDetail', backref='product', lazy=True)
    export_details = db.relationship('ExportDetail', backref='product', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'category': self.category,
            'unit': self.unit,
            'min_stock': self.min_stock,
            'stock': self.current_stock(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def current_stock(self):
        total_import = sum(d.quantity for d in self.import_details)
        total_export = sum(d.quantity for d in self.export_details)
        return total_import - total_export
