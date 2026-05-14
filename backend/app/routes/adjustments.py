from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.extensions import db
from app.model.stock_adjustment import StockAdjustment
from app.model.product import Product
from app.utils.decorators import admin_required

bp = Blueprint('adjustments', __name__)


@bp.route('', methods=['GET'])
@jwt_required()
def get_all():
    """Lấy lịch sử tất cả phiếu kiểm kê/điều chỉnh kho."""
    adjustments = StockAdjustment.query.order_by(StockAdjustment.created_at.desc()).all()
    return jsonify([a.to_dict() for a in adjustments]), 200


@bp.route('/product/<int:product_id>', methods=['GET'])
@jwt_required()
def get_by_product(product_id):
    """Lấy lịch sử điều chỉnh của một sản phẩm cụ thể."""
    adjustments = StockAdjustment.query.filter_by(product_id=product_id)\
        .order_by(StockAdjustment.created_at.desc()).all()
    return jsonify([a.to_dict() for a in adjustments]), 200


@bp.route('', methods=['POST'])
@admin_required()
def create():
    """
    Tạo phiếu điều chỉnh kho (chỉ Admin).
    Body: { product_id, adjusted_quantity (âm hoặc dương), reason, note }
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    current_user_id = int(get_jwt_identity())

    product_id = data.get('product_id')
    adjusted_quantity = data.get('adjusted_quantity')
    reason = data.get('reason', 'OTHER')

    if not product_id or adjusted_quantity is None:
        return jsonify({'error': 'Thiếu product_id hoặc adjusted_quantity'}), 400

    valid_reasons = ['DAMAGE', 'LOSS', 'COUNT_ERROR', 'OTHER']
    if reason not in valid_reasons:
        return jsonify({'error': f'reason phải là một trong: {valid_reasons}'}), 400

    product = Product.query.get(product_id)
    if not product or not product.is_active:
        return jsonify({'error': f'Sản phẩm id={product_id} không tồn tại'}), 404

    adjustment_date_str = data.get('adjustment_date')
    try:
        adjustment_date = (
            datetime.strptime(adjustment_date_str, '%Y-%m-%d').date()
            if adjustment_date_str else datetime.utcnow().date()
        )
    except ValueError:
        return jsonify({'error': 'adjustment_date không đúng định dạng YYYY-MM-DD'}), 400

    adj = StockAdjustment(
        adjustment_date=adjustment_date,
        product_id=int(product_id),
        adjusted_quantity=int(adjusted_quantity),
        reason=reason,
        note=data.get('note'),
        created_by=current_user_id,
    )
    db.session.add(adj)
    db.session.commit()

    return jsonify({
        'message': 'Tạo phiếu kiểm kê thành công',
        'adjustment_code': adj.adjustment_code,
        'adjustment_id': adj.id,
    }), 201
