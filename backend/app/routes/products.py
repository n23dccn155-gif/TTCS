from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.model.product import Product
from app.model.supplier import Supplier
from app.model.location import Location
from app.model.stock_adjustment import StockAdjustment
from sqlalchemy import text

bp = Blueprint('products', __name__)


@bp.route('', methods=['GET'])
@jwt_required()
def get_all():
    products = Product.query.filter_by(is_active=True).order_by(Product.product_code).all()
    try:
        balances = db.session.execute(
            text("SELECT product_id, current_stock FROM v_stock_balance")
        ).mappings().all()
        stock_map = {b['product_id']: int(b['current_stock']) for b in balances}
    except Exception:
        stock_map = {}

    result = []
    for p in products:
        d = p.to_dict()
        current_stock = stock_map.get(p.id, 0)
        d['current_stock'] = current_stock
        # Cảnh báo tồn kho thấp / vượt tối đa
        d['is_low_stock'] = current_stock < p.min_stock
        d['is_over_stock'] = current_stock > p.max_stock
        result.append(d)

    return jsonify(result), 200


@bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_by_id(id):
    product = Product.query.get_or_404(id)
    try:
        row = db.session.execute(
            text("SELECT current_stock FROM v_stock_balance WHERE product_id = :pid"),
            {'pid': id}
        ).mappings().first()
        current_stock = int(row['current_stock']) if row else 0
    except Exception:
        current_stock = 0
    d = product.to_dict()
    d['current_stock'] = current_stock
    return jsonify(d), 200


@bp.route('', methods=['POST'])
@jwt_required()
def create():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('product_code'):
        return jsonify({'error': 'Thiếu thông tin bắt buộc: name, product_code'}), 400

    # Kiểm tra trùng mã sản phẩm
    if Product.query.filter_by(product_code=data.get('product_code')).first():
        return jsonify({'error': f"Mã sản phẩm '{data.get('product_code')}' đã tồn tại"}), 409

    location_id = data.get('location_id')
    if location_id == "":
        location_id = None
    elif location_id is not None:
        location_id = int(location_id)

    unit_price = data.get('unit_price')
    if unit_price == "":
        unit_price = None

    product = Product(
        product_code=data.get('product_code'),
        name=data.get('name'),
        category=data.get('category'),
        unit=data.get('unit'),
        description=data.get('description'),
        min_stock=int(data.get('min_stock', 0)),
        max_stock=int(data.get('max_stock', 10000)),
        unit_price=unit_price,
        location_id=location_id,
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

    # Kiểm tra trùng mã nếu có thay đổi
    new_code = data.get('product_code', product.product_code)
    if new_code != product.product_code:
        if Product.query.filter_by(product_code=new_code).first():
            return jsonify({'error': f"Mã sản phẩm '{new_code}' đã tồn tại"}), 409

    location_id = data.get('location_id', product.location_id)
    if location_id == "":
        location_id = None
    elif location_id is not None:
        location_id = int(location_id)

    unit_price = data.get('unit_price', product.unit_price)
    if unit_price == "":
        unit_price = None

    product.product_code = new_code
    product.name = data.get('name', product.name)
    product.category = data.get('category', product.category)
    product.unit = data.get('unit', product.unit)
    product.description = data.get('description', product.description)
    product.min_stock = int(data.get('min_stock', product.min_stock))
    product.max_stock = int(data.get('max_stock', product.max_stock))
    product.unit_price = unit_price
    product.location_id = location_id
    db.session.commit()
    return jsonify(product.to_dict()), 200


@bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete(id):
    product = Product.query.get_or_404(id)
    product.is_active = False  # Soft delete — không xóa lịch sử giao dịch
    db.session.commit()
    return jsonify({'message': 'Ẩn sản phẩm thành công'}), 200
