from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from app.extensions import db
from app.model.user import User

bp = Blueprint('users', __name__)


@bp.route('', methods=['GET'])
def get_all():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users]), 200


@bp.route('/<int:id>', methods=['GET'])
def get_by_id(id):
    user = User.query.get_or_404(id)
    return jsonify(user.to_dict()), 200


@bp.route('', methods=['POST'])
def create():
    data = request.get_json()
    user = User(
        username=data.get('username'),
        password_hash=generate_password_hash(data.get('password', '123456')),
        full_name=data.get('full_name'),
        role=data.get('role', 'staff'),
        status=data.get('status', 'active'),
    )
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@bp.route('/<int:id>', methods=['PUT'])
def update(id):
    user = User.query.get_or_404(id)
    data = request.get_json()
    user.username = data.get('username', user.username)
    user.full_name = data.get('full_name', user.full_name)
    user.role = data.get('role', user.role)
    user.status = data.get('status', user.status)
    if data.get('password'):
        user.password_hash = generate_password_hash(data.get('password'))
    db.session.commit()
    return jsonify(user.to_dict()), 200


@bp.route('/<int:id>', methods=['DELETE'])
def delete(id):
    user = User.query.get_or_404(id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'Xóa ngường dùng thành công'}), 200
