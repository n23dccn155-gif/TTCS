from flask import Blueprint, request, jsonify
from datetime import datetime
from app.extensions import db
from app.model.export_receipt import ExportReceipt
from app.model.export_detail import ExportDetail
from app.model.product import Product

bp = Blueprint('exports', __name__)


@bp.route('', methods=['GET'])
def get_all():
    receipts = ExportReceipt.query.order_by(ExportReceipt.created_at.desc()).all()
    return jsonify([r.to_dict() for r in receipts]), 200


@bp.route('/<int:id>', methods=['GET'])
def get_by_id(id):
    receipt = ExportReceipt.query.get_or_404(id)
    data = receipt.to_dict()
    data['details'] = [d.to_dict() for d in receipt.details]
    return jsonify(data), 200


@bp.route('', methods=['POST'])
def create():
    data = request.get_json()
    receipt = ExportReceipt(
        code=data.get('code'),
        reason=data.get('reason'),
        date=datetime.strptime(data.get('date'), '%Y-%m-%d').date() if data.get('date') else datetime.utcnow().date(),
        status=data.get('status', 'Hoàn thành'),
    )
    db.session.add(receipt)
    db.session.flush()

    for item in data.get('items', []):
        detail = ExportDetail(
            export_receipt_id=receipt.id,
            product_id=item.get('product_id'),
            quantity=item.get('quantity'),
        )
        db.session.add(detail)

    db.session.commit()
    return jsonify(receipt.to_dict()), 201
