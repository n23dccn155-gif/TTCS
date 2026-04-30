from flask import Blueprint, jsonify
from app.model.product import Product

bp = Blueprint('stocks', __name__)


@bp.route('', methods=['GET'])
def get_all():
    products = Product.query.all()
    result = []
    for p in products:
        total_import = sum(d.quantity for d in p.import_details)
        total_export = sum(d.quantity for d in p.export_details)
        result.append({
            'id': p.id,
            'code': p.code,
            'name': p.name,
            'category': p.category,
            'unit': p.unit,
            'totalImport': total_import,
            'totalExport': total_export,
            'currentStock': total_import - total_export,
            'min_stock': p.min_stock,
        })
    return jsonify(result), 200
