from flask import Blueprint, request, jsonify
from app.extensions import db
from app.model.supplier import Supplier

bp = Blueprint('suppliers', __name__)


@bp.route('', methods=['GET'])
def get_all():
    suppliers = Supplier.query.all()
    return jsonify([s.to_dict() for s in suppliers]), 200


@bp.route('/<int:id>', methods=['GET'])
def get_by_id(id):
    supplier = Supplier.query.get_or_404(id)
    return jsonify(supplier.to_dict()), 200


@bp.route('', methods=['POST'])
def create():
    data = request.get_json()
    supplier = Supplier(
        code=data.get('code'),
        name=data.get('name'),
        phone=data.get('phone'),
        address=data.get('address'),
    )
    db.session.add(supplier)
    db.session.commit()
    return jsonify(supplier.to_dict()), 201


@bp.route('/<int:id>', methods=['PUT'])
def update(id):
    supplier = Supplier.query.get_or_404(id)
    data = request.get_json()
    supplier.code = data.get('code', supplier.code)
    supplier.name = data.get('name', supplier.name)
    supplier.phone = data.get('phone', supplier.phone)
    supplier.address = data.get('address', supplier.address)
    db.session.commit()
    return jsonify(supplier.to_dict()), 200


@bp.route('/<int:id>', methods=['DELETE'])
def delete(id):
    supplier = Supplier.query.get_or_404(id)
    db.session.delete(supplier)
    db.session.commit()
    return jsonify({'message': 'Xóa nhà cung cấp thành công'}), 200
