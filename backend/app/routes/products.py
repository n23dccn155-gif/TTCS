from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.model.product import Product

bp = Blueprint('products', __name__)


from sqlalchemy import text

@bp.route('', methods=['GET'])
@jwt_required()
def get_all():
    products = Product.query.filter_by(is_active=True).all()
    try:
        # Lay thong tin ton kho tu View
        balances = db.session.execute(text("SELECT product_id, current_stock FROM v_stock_balance")).mappings().all()
        stock_map = {b['product_id']: b['current_stock'] for b in balances}
    except Exception:
        # Fallback neu chua chay migrate view
        stock_map = {}

    result = []
    for p in products:
        d = p.to_dict()
        d['current_stock'] = stock_map.get(p.id, 0)
        result.append(d)

    return jsonify(result), 200


@bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_by_id(id):
    product = Product.query.get_or_404(id)
    return jsonify(product.to_dict()), 200


@bp.route('', methods=['POST'])
@jwt_required()
def create():
    data = request.get_json()
    product = Product(
        product_code=data.get('product_code'),
        name=data.get('name'),
        category=data.get('category'),
        unit=data.get('unit'),
        description=data.get('description'),
        min_stock=data.get('min_stock', 0),
        unit_price=data.get('unit_price'),
        is_active=True,
    )
    db.session.add(product)
    db.session.commit()
    return jsonify(product.to_dict()), 201


@bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update(id):
    product = Product.query.get_or_404(id)
    data = request.get_json()
    product.product_code = data.get('product_code', product.product_code)
    product.name = data.get('name', product.name)
    product.category = data.get('category', product.category)
    product.unit = data.get('unit', product.unit)
    product.description = data.get('description', product.description)
    product.min_stock = data.get('min_stock', product.min_stock)
    product.unit_price = data.get('unit_price', product.unit_price)
    db.session.commit()
    return jsonify(product.to_dict()), 200


@bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete(id):
    product = Product.query.get_or_404(id)
    product.is_active = False  # Soft delete
    db.session.commit()
    return jsonify({'message': 'Ẩn sản phẩm thành công'}), 200
