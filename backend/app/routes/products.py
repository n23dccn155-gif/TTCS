from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.model.product import Product
from app.model.supplier import Supplier
from app.model.location import Location
from app.model.stock_adjustment import StockAdjustment
from sqlalchemy import text

bp = Blueprint('products', __name__)


def _sync_suppliers(product, supplier_ids):
    """Helper: đồng bộ danh sách nhà cung cấp cho sản phẩm."""
    if supplier_ids is None:
        return
    # Chuyển về list int
    ids = []
    for sid in supplier_ids:
        try:
            ids.append(int(sid))
        except (ValueError, TypeError):
            pass
    suppliers = Supplier.query.filter(Supplier.id.in_(ids), Supplier.is_active == True).all() if ids else []
    product.suppliers = suppliers


@bp.route('/check-duplicate', methods=['GET'])
@jwt_required()
def check_duplicate():
    """
    API kiểm tra trùng dữ liệu sản phẩm tức thì.
    Query params:
      - product_code: Mã cần check
      - name: Tên cần check
      - exclude_id: ID loại trừ (dùng khi cập nhật sản phẩm)
    """
    product_code = request.args.get('product_code')
    name = request.args.get('name')
    exclude_id = request.args.get('exclude_id', type=int)

    if not product_code and not name:
        return jsonify({'success': True, 'exists': False}), 200

    query = Product.query.filter(Product.is_active == True)
    if exclude_id:
        query = query.filter(Product.id != exclude_id)

    if product_code:
        prod_by_code = query.filter(Product.product_code == product_code.strip()).first()
        if prod_by_code:
            return jsonify({
                'success': True,
                'exists': True,
                'field': 'product_code',
                'message': f'Mã sản phẩm "{product_code}" đã tồn tại trên hệ thống.'
            }), 200

    if name:
        prod_by_name = query.filter(Product.name == name.strip()).first()
        if prod_by_name:
            return jsonify({
                'success': True,
                'exists': True,
                'field': 'name',
                'message': f'Tên sản phẩm "{name}" đã tồn tại trên hệ thống.'
            }), 200

    return jsonify({'success': True, 'exists': False}), 200


@bp.route('', methods=['GET'])
@jwt_required()
def get_all():
    supplier_id = request.args.get('supplier_id', type=int)

    if supplier_id:
        supplier = Supplier.query.get_or_404(supplier_id)
        products = [p for p in supplier.products if p.is_active]
        products.sort(key=lambda p: p.product_code)
    else:
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
    db.session.flush()  # Lấy product.id trước khi gán suppliers

    _sync_suppliers(product, data.get('supplier_ids', []))
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

    if 'supplier_ids' in data:
        _sync_suppliers(product, data['supplier_ids'])

    db.session.commit()
    return jsonify(product.to_dict()), 200


@bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete(id):
    product = Product.query.get_or_404(id)
    product.is_active = False  # Soft delete — không xóa lịch sử giao dịch
    db.session.commit()
    return jsonify({'message': 'Ẩn sản phẩm thành công'}), 200
