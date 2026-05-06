from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from app.model.user import User

def admin_required():
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):
            user_id = int(get_jwt_identity())
            user = User.query.get(user_id)
            if user and user.role == 'admin':
                return fn(*args, **kwargs)
            else:
                return jsonify(message="Quyền truy cập bị từ chối. Chỉ dành cho Admin."), 403
        return decorator
    return wrapper
