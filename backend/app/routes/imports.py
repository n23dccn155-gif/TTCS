from flask import Blueprint, request, jsonify
from datetime import datetime
from app.extensions import db
from app.model.import_receipt import ImportReceipt
from app.model.import_detail import ImportDetail
from app.model.product import Product

bp = Blueprint('imports', __name__)


@bp.route('', methods=['GET'])
def get_all():
    receipts = ImportReceipt.query.order_by(ImportReceipt.created_at.desc()).all()
    return jsonify([r.to_dict() for r in receipts]), 200


@bp.route('/<int:id>', methods=['GET'])
def get_by_id(id):
    receipt = ImportReceipt.query.get_or_404(id)
    data = receipt.to_dict()
    data['details'] = [d.to_dict() for d in receipt.details]
    return jsonify(data), 200


@bp.route('', methods=['POST'])
def create():
    data = request.get_json()
    receipt = ImportReceipt(
        code=data.get('code'),
        supplier_id=data.get('supplier_id'),
        date=datetime.strptime(data.get('date'), '%Y-%m-%d').date() if data.get('date') else datetime.utcnow().date(),
        status=data.get('status', 'Hoàn thành'),
    )
    db.session.add(receipt)
    db.session.flush()

    for item in data.get('items', []):
        detail = ImportDetail(
            import_receipt_id=receipt.id,
            product_id=item.get('product_id'),
            quantity=item.get('quantity'),
            price=item.get('price', 0),
            expiry_date=datetime.strptime(item.get('expiry_date'), '%Y-%m-%d').date() if item.get('expiry_date') else None,
        )
        db.session.add(detail)

    db.session.commit()
    return jsonify(receipt.to_dict()), 201
