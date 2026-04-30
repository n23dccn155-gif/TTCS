from flask import Blueprint, request, jsonify
from app.extensions import db
from app.model.product import Product

bp = Blueprint('products', __name__)


@bp.route('', methods=['GET'])
def get_all():
    products = Product.query.all()
    return jsonify([p.to_dict() for p in products]), 200


@bp.route('/<int:id>', methods=['GET'])
def get_by_id(id):
    product = Product.query.get_or_404(id)
    return jsonify(product.to_dict()), 200


@bp.route('', methods=['POST'])
def create():
    data = request.get_json()
    product = Product(
        code=data.get('code'),
        name=data.get('name'),
        category=data.get('category'),
        unit=data.get('unit'),
        min_stock=data.get('min_stock', 0),
    )
    db.session.add(product)
    db.session.commit()
    return jsonify(product.to_dict()), 201


@bp.route('/<int:id>', methods=['PUT'])
def update(id):
    product = Product.query.get_or_404(id)
    data = request.get_json()
    product.code = data.get('code', product.code)
    product.name = data.get('name', product.name)
    product.category = data.get('category', product.category)
    product.unit = data.get('unit', product.unit)
    product.min_stock = data.get('min_stock', product.min_stock)
    db.session.commit()
    return jsonify(product.to_dict()), 200


@bp.route('/<int:id>', methods=['DELETE'])
def delete(id):
    product = Product.query.get_or_404(id)
    db.session.delete(product)
    db.session.commit()
    return jsonify({'message': 'Xóa sản phẩm thành công'}), 200
