from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.model.supplier import Supplier

bp = Blueprint('suppliers', __name__)


@bp.route('', methods=['GET'])
@jwt_required()
def get_all():
    suppliers = Supplier.query.filter_by(is_active=True).all()
    return jsonify([s.to_dict() for s in suppliers]), 200


@bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_by_id(id):
    supplier = Supplier.query.get_or_404(id)
    return jsonify(supplier.to_dict()), 200


@bp.route('', methods=['POST'])
@jwt_required()
def create():
    data = request.get_json()
    supplier = Supplier(
        name=data.get('name'),
        contact_person=data.get('contact_person'),
        phone=data.get('phone'),
        email=data.get('email'),
        address=data.get('address'),
        is_active=True,
    )
    db.session.add(supplier)
    db.session.commit()
    return jsonify(supplier.to_dict()), 201


@bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update(id):
    supplier = Supplier.query.get_or_404(id)
    data = request.get_json()
    supplier.name = data.get('name', supplier.name)
    supplier.contact_person = data.get('contact_person', supplier.contact_person)
    supplier.phone = data.get('phone', supplier.phone)
    supplier.email = data.get('email', supplier.email)
    supplier.address = data.get('address', supplier.address)
    db.session.commit()
    return jsonify(supplier.to_dict()), 200


@bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete(id):
    supplier = Supplier.query.get_or_404(id)
    supplier.is_active = False  # Soft delete
    db.session.commit()
    return jsonify({'message': 'Ẩn nhà cung cấp thành công'}), 200
