from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta, date
from sqlalchemy import text
from app.extensions import db

bp = Blueprint('alerts', __name__)


def _query_view(sql: str, params: dict = None) -> list:
    result = db.session.execute(text(sql), params or {})
    return [dict(row) for row in result.mappings()]


def _serialize_dates(rows):
    result = []
    for row in rows:
        serialized = {}
        for k, v in row.items():
            if isinstance(v, (date, datetime)):
                serialized[k] = v.isoformat()
            else:
                serialized[k] = v
        result.append(serialized)
    return result


@bp.route('/low-stock', methods=['GET'])
@jwt_required()
def low_stock():
    rows = _query_view(
        """
        SELECT product_id, product_code, product_name, unit,
               current_stock, min_stock,
               (min_stock - current_stock) AS shortage
        FROM v_stock_balance
        WHERE current_stock < min_stock
        ORDER BY shortage DESC
        """
    )
    return jsonify(_serialize_dates(rows)), 200


@bp.route('/expiry', methods=['GET'])
@jwt_required()
def expiry():
    today = datetime.utcnow().date()
    near_date = today + timedelta(days=30)
    rows = _query_view(
        """
        SELECT lot_id, product_id, product_code, product_name,
               batch_code, expiry_date, current_lot_stock, unit,
               (expiry_date - CURRENT_DATE) AS days_until_expiry
        FROM v_lot_stock
        WHERE expiry_date IS NOT NULL
          AND expiry_date <= :near_date
          AND expiry_date >= CURRENT_DATE
          AND current_lot_stock > 0
        ORDER BY expiry_date ASC
        """,
        {'near_date': near_date}
    )
    return jsonify(_serialize_dates(rows)), 200


@bp.route('/slow-moving', methods=['GET'])
@jwt_required()
def slow_moving():
    threshold = (datetime.utcnow() - timedelta(days=30)).date()
    rows = _query_view(
        """
        SELECT
            vsb.product_id,
            vsb.product_code,
            vsb.product_name,
            vsb.unit,
            vsb.current_stock,
            vsb.total_imported  AS total_import,
            vsb.total_exported  AS total_export,
            MAX(er.export_date) AS last_export_date
        FROM v_stock_balance vsb
        LEFT JOIN export_details ed ON ed.product_id = vsb.product_id
        LEFT JOIN export_receipts er ON er.id = ed.receipt_id
        WHERE vsb.current_stock > 0
        GROUP BY vsb.product_id, vsb.product_code, vsb.product_name,
                 vsb.unit, vsb.current_stock, vsb.total_imported, vsb.total_exported
        HAVING MAX(er.export_date) IS NULL
            OR MAX(er.export_date) < :threshold
        ORDER BY last_export_date ASC NULLS FIRST
        """,
        {'threshold': threshold}
    )
    return jsonify(_serialize_dates(rows)), 200
