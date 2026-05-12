from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity
)
from app.extensions import db
from app.model.user import User

bp = Blueprint('auth', __name__)


@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Vui lòng nhập đầy đủ thông tin'}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'message': 'Tên đăng nhập hoặc mật khẩu không đúng'}), 401

    if not user.is_active:
        return jsonify({'message': 'Tài khoản đã bị khóa'}), 403

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 200



@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user)
    return jsonify({'access_token': new_access_token}), 200


@bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    data = request.get_json()

    old_password = data.get('old_password')
    new_password = data.get('new_password')

    if not check_password_hash(user.password_hash, old_password):
        return jsonify({'message': 'Mật khẩu cũ không đúng'}), 400

    user.password_hash = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({'message': 'Đổi mật khẩu thành công'}), 200


@bp.route('/update-profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'Không tìm thấy người dùng'}), 404

    data = request.get_json()
    full_name = data.get('full_name')
    email = data.get('email')

    if not full_name:
        return jsonify({'message': 'Họ và tên không được để trống'}), 400

    # Kiểm tra trùng email
    if email:
        existing_user = User.query.filter(User.email == email, User.id != user_id).first()
        if existing_user:
            return jsonify({'message': 'Email đã được sử dụng bởi tài khoản khác'}), 400

    user.full_name = full_name
    user.email = email if email else None
    db.session.commit()

    return jsonify({
        'message': 'Cập nhật thông tin cá nhân thành công',
        'user': user.to_dict()
    }), 200


@bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'Không tìm thấy người dùng'}), 404
    return jsonify(user.to_dict()), 200
