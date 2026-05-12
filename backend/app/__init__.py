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

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(suppliers_bp, url_prefix='/api/suppliers')
    app.register_blueprint(imports_bp, url_prefix='/api/imports')
    app.register_blueprint(exports_bp, url_prefix='/api/exports')
    app.register_blueprint(alerts_bp, url_prefix='/api/alerts')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(inventory_bp)  # url_prefix='/api/inventory' set in blueprint

    with app.app_context():
        db.create_all()
        _seed_data()

    return app


def _seed_data():
    from app.model.user import User

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

    db.session.commit()
