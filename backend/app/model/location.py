from app.extensions import db
from datetime import datetime


class Location(db.Model):
    """
    Bảng quản lý vị trí/khoang/kệ chứa hàng trong kho.
    Mỗi vị trí có sức chứa tối đa và theo dõi số lượng đang chiếm dụng.
    """
    __tablename__ = 'locations'

    id = db.Column(db.Integer, primary_key=True)
    location_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    # Ví dụ: "A1-01", "B2-05", "Kệ C tầng 3"
    name = db.Column(db.String(200), nullable=False)
    # Phân khu lưu trữ: "Thực phẩm tươi sống", "Thực phẩm khô và Nhu yếu phẩm", "Đồ uống và bánh kẹo", "Hóa mỹ phẩm", "Đồ dùng gia đình"
    zone = db.Column(db.String(100), nullable=False, default="Thực phẩm khô và Nhu yếu phẩm")
    # Sức chứa tối đa (tính theo đơn vị sản phẩm/hộp/thùng)
    max_capacity = db.Column(db.Integer, nullable=False, default=1000)
    # Số lượng hiện đang chiếm dụng (cập nhật tự động khi nhập/xuất kho)
    current_occupied = db.Column(db.Integer, nullable=False, default=0)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Quan hệ: Một vị trí có thể chứa nhiều lô hàng (import_details)
    import_details = db.relationship('ImportDetail', backref='location', lazy=True)

    @property
    def available_capacity(self):
        """Sức chứa còn trống = Tối đa - Đang chiếm dụng."""
        return self.max_capacity - self.current_occupied

    @property
    def is_full(self):
        """Kiểm tra kệ đã đầy hay chưa."""
        return self.current_occupied >= self.max_capacity

    def to_dict(self):
        return {
            'id': self.id,
            'location_code': self.location_code,
            'name': self.name,
            'zone': self.zone,
            'max_capacity': self.max_capacity,
            'current_occupied': self.current_occupied,
            'available_capacity': self.available_capacity,
            'is_full': self.is_full,
            'description': self.description,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
