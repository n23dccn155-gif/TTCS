from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.model.export_receipt import ExportReceipt
from app.model.export_detail import ExportDetail
from app.model.location import Location

bp = Blueprint('exports', __name__)


@bp.route('', methods=['GET'])
@jwt_required()
def get_all():
    receipts = ExportReceipt.query.order_by(ExportReceipt.created_at.desc()).all()
    return jsonify([r.to_dict() for r in receipts]), 200


@bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_by_id(id):
    receipt = ExportReceipt.query.get_or_404(id)
    return jsonify(receipt.to_dict(include_details=True)), 200

# Lưu ý: API tạo phiếu xuất (POST) dùng thuật toán FEFO
# nằm tại /api/inventory/exports (file inventory_routes.py)
# để đảm bảo logic FEFO được áp dụng đồng nhất.
