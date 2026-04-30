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
    from app.routes.stocks import bp as stocks_bp
    from app.routes.alerts import bp as alerts_bp
    from app.routes.users import bp as users_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(suppliers_bp, url_prefix='/api/suppliers')
    app.register_blueprint(imports_bp, url_prefix='/api/imports')
    app.register_blueprint(exports_bp, url_prefix='/api/exports')
    app.register_blueprint(stocks_bp, url_prefix='/api/inventory')
    app.register_blueprint(alerts_bp, url_prefix='/api/alerts')
    app.register_blueprint(users_bp, url_prefix='/api/users')

    with app.app_context():
        db.create_all()
        _seed_data()

    return app


def _seed_data():
    from app.model.user import User
    from app.model.product import Product
    from app.model.supplier import Supplier

    if not User.query.first():
        from werkzeug.security import generate_password_hash
        admin = User(
            username='admin',
            password_hash=generate_password_hash('123456'),
            full_name='Chủ đại lý',
            role='admin',
            status='active'
        )
        staff = User(
            username='staff',
            password_hash=generate_password_hash('123456'),
            full_name='Nhân viên kho',
            role='staff',
            status='active'
        )
        db.session.add_all([admin, staff])

    if not Product.query.first():
        products = [
            Product(code='SP001', name='Sữa tươi Vinamilk', category='Thực phẩm', unit='Hộp', min_stock=20),
            Product(code='SP002', name='Mì Hảo Hảo', category='Đồ khô', unit='Thùng', min_stock=50),
            Product(code='SP003', name='Coca Cola', category='Nước uống', unit='Lon', min_stock=30),
        ]
        db.session.add_all(products)

    if not Supplier.query.first():
        suppliers = [
            Supplier(code='NCC001', name='Công ty Sữa Việt', phone='0909123456', address='Quận 1, TP.HCM'),
            Supplier(code='NCC002', name='NCC Tiêu Dùng A', phone='0911222333', address='Thủ Đức, TP.HCM'),
        ]
        db.session.add_all(suppliers)

    db.session.commit()
