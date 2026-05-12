from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from app.extensions import db
from app.model.user import User
from app.utils.decorators import admin_required

bp = Blueprint('users', __name__)


@bp.route('', methods=['GET'])
@admin_required()
def get_all():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users]), 200


@bp.route('/<int:id>', methods=['GET'])
@admin_required()
def get_by_id(id):
    user = User.query.get_or_404(id)
    return jsonify(user.to_dict()), 200


@bp.route('', methods=['POST'])
@admin_required()
def create():
    data = request.get_json()
    user = User(
        username=data.get('username'),
        full_name=data.get('full_name', data.get('username')),
        email=data.get('email') or None,
        password_hash=generate_password_hash(data.get('password', '123456')),
        role=data.get('role', 'staff'),
        is_active=data.get('is_active', True),
    )
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@bp.route('/<int:id>', methods=['PUT'])
@admin_required()
def update(id):
    user = User.query.get_or_404(id)
    data = request.get_json()
    user.username = data.get('username', user.username)
    user.full_name = data.get('full_name', user.full_name)
    user.email = data.get('email', user.email) or None
    user.role = data.get('role', user.role)
    user.is_active = data.get('is_active', user.is_active)
    if data.get('password'):
        user.password_hash = generate_password_hash(data.get('password'))
    db.session.commit()
    return jsonify(user.to_dict()), 200


@bp.route('/<int:id>', methods=['DELETE'])
@admin_required()
def delete(id):
    user = User.query.get_or_404(id)
    user.is_active = False  # Soft disable
    db.session.commit()
    return jsonify({'message': 'Khóa tài khoản thành công'}), 200
