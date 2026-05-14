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
            user, product, supplier,
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

    # Seed 5 vị trí kệ kho mẫu nếu chưa có
    if not Location.query.first():
        sample_locations = [
            Location(location_code='A1-01', name='Kệ A1 - Tầng 1', max_capacity=500),
            Location(location_code='A1-02', name='Kệ A1 - Tầng 2', max_capacity=500),
            Location(location_code='B2-01', name='Kệ B2 - Tầng 1', max_capacity=800),
            Location(location_code='B2-02', name='Kệ B2 - Tầng 2', max_capacity=800),
            Location(location_code='C3-01', name='Kệ C3 - Hàng cồng kềnh', max_capacity=200),
        ]
        db.session.add_all(sample_locations)

    db.session.commit()


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

