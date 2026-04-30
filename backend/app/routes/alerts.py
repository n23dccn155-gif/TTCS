from flask import Blueprint, jsonify
from datetime import datetime, timedelta
from app.model.product import Product
from app.model.import_detail import ImportDetail
from app.model.export_detail import ExportDetail

bp = Blueprint('alerts', __name__)


@bp.route('/low-stock', methods=['GET'])
def low_stock():
    products = Product.query.all()
    result = []
    for p in products:
        stock = sum(d.quantity for d in p.import_details) - sum(d.quantity for d in p.export_details)
        if stock < p.min_stock:
            result.append({
                'id': p.id,
                'code': p.code,
                'name': p.name,
                'category': p.category,
                'currentStock': stock,
                'min_stock': p.min_stock,
            })
    return jsonify(result), 200


@bp.route('/expiry', methods=['GET'])
def expiry():
    today = datetime.utcnow().date()
    near_date = today + timedelta(days=30)
    details = ImportDetail.query.filter(
        ImportDetail.expiry_date != None,
        ImportDetail.expiry_date <= near_date,
        ImportDetail.expiry_date >= today,
    ).all()
    return jsonify([{
        'id': d.id,
        'product_id': d.product_id,
        'product_name': d.product.name if d.product else None,
        'quantity': d.quantity,
        'expiry_date': d.expiry_date.isoformat() if d.expiry_date else None,
    } for d in details]), 200


@bp.route('/slow-moving', methods=['GET'])
def slow_moving():
    products = Product.query.all()
    result = []
    for p in products:
        total_import = sum(d.quantity for d in p.import_details)
        total_export = sum(d.quantity for d in p.export_details)
        stock = total_import - total_export
        if total_import > 0 and total_export < total_import * 0.2 and stock > 10:
            result.append({
                'id': p.id,
                'code': p.code,
                'name': p.name,
                'category': p.category,
                'totalImport': total_import,
                'totalExport': total_export,
                'currentStock': stock,
            })
    return jsonify(result), 200
