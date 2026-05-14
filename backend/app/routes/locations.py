from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.model.location import Location

bp = Blueprint('locations', __name__)


@bp.route('', methods=['GET'])
@jwt_required()
def get_all():
    """Lấy danh sách tất cả vị trí kệ kho, kèm thông tin sức chứa còn trống."""
    locations = Location.query.filter_by(is_active=True).order_by(Location.location_code).all()
    return jsonify([loc.to_dict() for loc in locations]), 200


@bp.route('/available', methods=['GET'])
@jwt_required()
def get_available():
    """Chỉ lấy các kệ còn chỗ trống (chưa đầy) — dùng cho dropdown khi nhập kho."""
    locations = Location.query.filter(
        Location.is_active == True,
        Location.current_occupied < Location.max_capacity
    ).order_by(Location.location_code).all()
    return jsonify([loc.to_dict() for loc in locations]), 200


@bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_by_id(id):
    loc = Location.query.get_or_404(id)
    return jsonify(loc.to_dict()), 200


@bp.route('', methods=['POST'])
@jwt_required()
def create():
    data = request.get_json()
    if not data or not data.get('location_code') or not data.get('name'):
        return jsonify({'error': 'Thiếu thông tin bắt buộc: location_code, name'}), 400

    if Location.query.filter_by(location_code=data.get('location_code')).first():
        return jsonify({'error': f"Mã vị trí '{data.get('location_code')}' đã tồn tại"}), 409

    loc = Location(
        location_code=data.get('location_code'),
        name=data.get('name'),
        max_capacity=int(data.get('max_capacity', 1000)),
        description=data.get('description'),
        is_active=True,
    )
    db.session.add(loc)
    db.session.commit()
    return jsonify(loc.to_dict()), 201


@bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update(id):
    loc = Location.query.get_or_404(id)
    data = request.get_json()
    loc.name = data.get('name', loc.name)
    loc.max_capacity = int(data.get('max_capacity', loc.max_capacity))
    loc.description = data.get('description', loc.description)
    db.session.commit()
    return jsonify(loc.to_dict()), 200


@bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete(id):
    loc = Location.query.get_or_404(id)
    # Không xóa kệ đang có hàng
    if loc.current_occupied > 0:
        return jsonify({'error': f'Kệ "{loc.location_code}" đang chứa {loc.current_occupied} đơn vị hàng, không thể xóa'}), 400
    loc.is_active = False
    db.session.commit()
    return jsonify({'message': f'Đã ẩn kệ {loc.location_code}'}), 200
