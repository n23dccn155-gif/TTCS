from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.extensions import db
from app.model.import_receipt import ImportReceipt
from app.model.import_detail import ImportDetail
from app.model.product import Product

bp = Blueprint('imports', __name__)


@bp.route('', methods=['GET'])
@jwt_required()
def get_all():
    receipts = ImportReceipt.query.order_by(ImportReceipt.created_at.desc()).all()
    return jsonify([r.to_dict() for r in receipts]), 200


@bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_by_id(id):
    receipt = ImportReceipt.query.get_or_404(id)
    return jsonify(receipt.to_dict(include_details=True)), 200


@bp.route('', methods=['POST'])
@jwt_required()
def create():
    data = request.get_json()
    current_user_id = int(get_jwt_identity())

    import_date_str = data.get('import_date') or data.get('date')
    import_date = (
        datetime.strptime(import_date_str, '%Y-%m-%d').date()
        if import_date_str else datetime.utcnow().date()
    )

    receipt = ImportReceipt(
        supplier_id=data.get('supplier_id'),
        import_date=import_date,
        note=data.get('note'),
        created_by=current_user_id,
    )
    db.session.add(receipt)
    db.session.flush()

    for item in data.get('items', []):
        expiry_str = item.get('expiry_date')
        expiry_date = (
            datetime.strptime(expiry_str, '%Y-%m-%d').date() if expiry_str else None
        )
        detail = ImportDetail(
            receipt_id=receipt.id,
            product_id=item.get('product_id'),
            quantity=item.get('quantity'),
            unit_price=item.get('unit_price', item.get('price', 0)),
            batch_code=item.get('batch_code'),
            expiry_date=expiry_date,
        )
        db.session.add(detail)

    db.session.commit()
    return jsonify(receipt.to_dict()), 201
