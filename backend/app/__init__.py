from flask import Flask
from config import Config
from app.extensions import db, jwt, cors


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    from app.routes.auth import bp as auth_bp
    from app.routes.products import bp as products_bp
    from app.routes.suppliers import bp as suppliers_bp
    from app.routes.imports import bp as imports_bp
    from app.routes.exports import bp as exports_bp
    from app.routes.alerts import bp as alerts_bp
    from app.routes.users import bp as users_bp
    from app.routes.inventory_routes import inventory_bp
    from app.routes.locations import bp as locations_bp
    from app.routes.adjustments import bp as adjustments_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(suppliers_bp, url_prefix='/api/suppliers')
    app.register_blueprint(imports_bp, url_prefix='/api/imports')
    app.register_blueprint(exports_bp, url_prefix='/api/exports')
    app.register_blueprint(alerts_bp, url_prefix='/api/alerts')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(inventory_bp)  # url_prefix='/api/inventory' set in blueprint
    app.register_blueprint(locations_bp, url_prefix='/api/locations')
    app.register_blueprint(adjustments_bp, url_prefix='/api/adjustments')

    with app.app_context():
        # Import tất cả model để SQLAlchemy nhận diện đủ 9 bảng
        from app.model import (  # noqa: F401
            user, product, supplier, supplier_product_price,
            import_receipt, import_detail,
            export_receipt, export_detail,
            location, stock_adjustment
        )
        db.create_all()
        _seed_data()
        _create_views()

    return app


def _seed_data():
    """Chèn dữ liệu mẫu tối thiểu nếu CSDL đang trống."""
    from app.model.user import User
    from app.model.location import Location

    try:
        if not User.query.first():
            from werkzeug.security import generate_password_hash
            admin = User(
                username='admin',
                full_name='Quản trị viên',
                email='admin@warehouse.local',
                password_hash=generate_password_hash('123456'),
                role='admin',
                is_active=True
            )
            db.session.add(admin)

            # Seed các vị trí kệ kho mẫu theo đúng sơ đồ phân khu thực tế
        if not Location.query.first():
            sample_locations = [
                # 1. Khu Thực phẩm tươi sống
                Location(location_code='TPTS-A', name='Kệ A - Tươi sống', zone='Thực phẩm tươi sống', max_capacity=500),
                Location(location_code='TPTS-B', name='Kệ B - Tươi sống', zone='Thực phẩm tươi sống', max_capacity=500),
                
                # 2. Khu Thực phẩm khô và Nhu yếu phẩm
                Location(location_code='TPK-NYP-A', name='Kệ A - Thực phẩm khô', zone='Thực phẩm khô và Nhu yếu phẩm', max_capacity=1000),
                Location(location_code='TPK-NYP-B', name='Kệ B - Nhu yếu phẩm', zone='Thực phẩm khô và Nhu yếu phẩm', max_capacity=1000),
                
                # 3. Khu Đồ uống và bánh kẹo
                Location(location_code='DUBK-A', name='Kệ A - Đồ uống & Bánh kẹo', zone='Đồ uống và bánh kẹo', max_capacity=800),
                Location(location_code='DUBK-B', name='Kệ B - Đồ uống & Bánh kẹo', zone='Đồ uống và bánh kẹo', max_capacity=800),
                
                # 4. Khu Hóa mỹ phẩm
                Location(location_code='HMP-A', name='Kệ A - Hóa mỹ phẩm', zone='Hóa mỹ phẩm', max_capacity=600),
                
                # 5. Khu Đồ dùng gia đình
                Location(location_code='DDGD-A', name='Kệ A - Đồ dùng gia đình', zone='Đồ dùng gia đình', max_capacity=700),
            ]
            db.session.add_all(sample_locations)

        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"[WARNING] Could not seed data (this is normal during migrations): {e}")


def _create_views():
    """Tự động tạo các PostgreSQL View tồn kho nếu chưa tồn tại."""
    import os
    from sqlalchemy import text

    # Đường dẫn tới file SQL tạo View
    sql_path = os.path.join(os.path.dirname(__file__), '..', 'migrations', 'create_stock_views.sql')
    sql_path = os.path.normpath(sql_path)

    if not os.path.exists(sql_path):
        print(f"[WARNING] SQL View file not found at: {sql_path}")
        return

    try:
        with open(sql_path, encoding='utf-8') as f:
            sql = f.read()
        db.session.execute(text(sql))
        db.session.commit()
        print("[OK] Created PostgreSQL Views successfully (v_stock_balance, v_lot_stock).")
    except Exception as e:
        print(f"[WARNING] Could not create Views (already exist or SQL error): {e}")

