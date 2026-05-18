# app/routes/inventory_routes.py
# ============================================================
# PHẦN 3: API ROUTES — NGHIỆP VỤ KHO
# ============================================================
# Blueprint `inventory_bp` tập trung toàn bộ logic giao dịch kho:
# nhập hàng, xuất hàng FEFO, xem tồn kho, cảnh báo, dashboard.
#
# Nguyên tắc thiết kế:
#   - Mọi thao tác GHI (POST) bắt buộc dùng Transaction (db.session.begin())
#     để đảm bảo tính ACID: hoặc toàn bộ thành công, hoặc rollback hoàn toàn.
#   - Mọi thao tác ĐỌC (GET) truy vấn trực tiếp PostgreSQL View để nhận
#     dữ liệu tồn kho real-time, không có cache trung gian nào có thể lỗi thời.
#   - @jwt_required() bảo vệ tất cả endpoints — không có public API kho.

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
from datetime import datetime, date, timezone, timedelta

from app.extensions import db
from app.model.import_receipt import ImportReceipt
from app.model.import_detail import ImportDetail
from app.model.export_receipt import ExportReceipt
from app.model.export_detail import ExportDetail
from app.model.product import Product

inventory_bp = Blueprint('inventory', __name__, url_prefix='/api/inventory')


# ============================================================
# HELPER: Chạy raw SQL trên View, trả về list of dict
# ============================================================
def query_view(sql: str, params: dict = None) -> list:
    """
    Thực thi raw SQL query (thường là SELECT từ View) và trả về list[dict].
    Dùng text() của SQLAlchemy để hỗ trợ named parameters (:param)
    và ngăn chặn SQL Injection.
    """
    result = db.session.execute(text(sql), params or {})
    # mappings() trả về RowMapping — có thể dùng như dict, tránh index magic number
    return [dict(row) for row in result.mappings()]


# ============================================================
# GET /api/inventory/next-import-code — LẤY MÃ PHIẾU NHẬP TIẾP THEO
# ============================================================
@inventory_bp.route('/next-import-code', methods=['GET'])
@jwt_required()
def get_next_import_code():
    """Tạo sẵn mã phiếu nhập tiếp theo của ngày hôm nay."""
    try:
        next_code = ImportReceipt.generate_next_code()
        return jsonify({'success': True, 'receipt_code': next_code}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================================
# GET /api/inventory/next-export-code — LẤY MÃ PHIẾU XUẤT TIẾP THEO
# ============================================================
@inventory_bp.route('/next-export-code', methods=['GET'])
@jwt_required()
def get_next_export_code():
    """Tạo sẵn mã phiếu xuất tiếp theo của ngày hôm nay."""
    try:
        next_code = ExportReceipt.generate_next_code()
        return jsonify({'success': True, 'receipt_code': next_code}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================================
# POST /api/inventory/imports — TẠO PHIẾU NHẬP
# ============================================================
@inventory_bp.route('/imports', methods=['POST'])
@jwt_required()
def create_import():
    """
    Tạo phiếu nhập kho kèm danh sách chi tiết từng sản phẩm/lô hàng.

    Body JSON:
    {
        "supplier_id": 1,
        "import_date": "2025-06-01",   (tùy chọn, mặc định hôm nay)
        "note": "Nhập hàng tháng 6",
        "items": [
            {
                "product_id": 2,
                "quantity": 100,
                "unit_price": 15000,
                "batch_code": "LOT-20250601-A",
                "expiry_date": "2027-06-01"    (tùy chọn)
            }
        ]
    }
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    required = ['supplier_id', 'items']
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({'error': f'Missing required fields: {missing}'}), 400

    items = data.get('items', [])
    if not items:
        return jsonify({'error': 'items array cannot be empty'}), 400

    current_user_id = int(get_jwt_identity())

    try:
        with db.session.begin():
            import_date = data.get('import_date')
            if import_date:
                import_date = date.fromisoformat(import_date)
            else:
                import_date = datetime.now(timezone.utc).date()

            receipt = ImportReceipt(
                supplier_id=data['supplier_id'],
                import_date=import_date,
                note=data.get('note'),
                created_by=current_user_id,
            )
            db.session.add(receipt)
            db.session.flush()

            for item in items:
                if not item.get('product_id') or not item.get('quantity'):
                    raise ValueError(f"Item missing product_id or quantity: {item}")
                if int(item['quantity']) <= 0:
                    raise ValueError(f"quantity must be > 0 for product_id={item['product_id']}")

                product = db.session.get(Product, item['product_id'])
                if not product or not product.is_active:
                    raise ValueError(f"Product id={item['product_id']} not found or inactive")

                expiry_date = item.get('expiry_date')
                if expiry_date:
                    expiry_date = date.fromisoformat(expiry_date)

                detail = ImportDetail(
                    receipt_id=receipt.id,
                    product_id=item['product_id'],
                    quantity=int(item['quantity']),
                    unit_price=item.get('unit_price', 0),
                    batch_code=item.get('batch_code'),
                    expiry_date=expiry_date,
                )
                db.session.add(detail)

        return jsonify({
            'message': 'Import receipt created successfully',
            'receipt_code': receipt.receipt_code,
            'receipt_id': receipt.id,
        }), 201

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


# ============================================================
# POST /api/inventory/exports — TẠO PHIẾU XUẤT (FEFO)
# ============================================================
@inventory_bp.route('/exports', methods=['POST'])
@jwt_required()
def create_export():
    """
    Tạo phiếu xuất kho sử dụng thuật toán FEFO (First Expired, First Out).

    Body JSON:
    {
        "reason": "SELL",
        "note": "Xuất cho khách hàng A",
        "items": [
            {
                "product_id": 2,       (hoặc "productId")
                "quantity": 150,
                "selling_price": 50000 (hoặc "sellingPrice" — giá bán, tùy chọn)
            }
        ]
    }
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    items = data.get('items', [])
    if not items:
        return jsonify({'error': 'items array cannot be empty'}), 400

    current_user_id = int(get_jwt_identity())

    valid_reasons = ['SELL', 'RETURN', 'INTERNAL', 'DISPOSE']
    reason = data.get('reason', 'SELL').upper()
    if reason not in valid_reasons:
        return jsonify({'error': f'reason must be one of {valid_reasons}'}), 400

    try:
        with db.session.begin():
            export_date = data.get('export_date')
            if export_date:
                export_date = date.fromisoformat(export_date)
            else:
                export_date = datetime.now(timezone.utc).date()

            receipt = ExportReceipt(
                export_date=export_date,
                reason=reason,
                note=data.get('note'),
                customer_name=data.get('customer_name') or data.get('customerName'),
                delivery_address=data.get('delivery_address') or data.get('deliveryAddress'),
                created_by=current_user_id,
                total_amount=0,   # Sẽ tính và cập nhật sau
                status='COMPLETED',
            )
            db.session.add(receipt)
            db.session.flush()

            total_amount = 0

            for item in items:
                # Đồng bộ camelCase (Frontend) và snake_case (API)
                product_id = item.get('product_id') or item.get('productId')
                qty_needed = int(item.get('quantity', 0))
                selling_price = float(
                    item.get('selling_price') or item.get('sellingPrice') or 0
                )

                if not product_id or qty_needed <= 0:
                    raise ValueError(f"Invalid item: {item}")

                # Bước 1: Kiểm tra tổng tồn kho từ View
                stock_rows = query_view(
                    """
                    SELECT current_stock
                    FROM v_stock_balance
                    WHERE product_id = :pid
                    """,
                    {'pid': product_id}
                )

                if not stock_rows:
                    raise ValueError(f"Product id={product_id} not found in stock balance")

                current_stock = stock_rows[0]['current_stock']
                if current_stock < qty_needed:
                    raise ValueError(
                        f"Insufficient stock for product_id={product_id}. "
                        f"Available: {current_stock}, Requested: {qty_needed}"
                    )

                # Bước 2: Lấy danh sách lô theo FEFO
                lots = query_view(
                    """
                    SELECT lot_id, current_lot_stock, expiry_date, batch_code
                    FROM v_lot_stock
                    WHERE product_id = :pid
                      AND current_lot_stock > 0
                    ORDER BY expiry_date ASC NULLS LAST, import_date ASC
                    """,
                    {'pid': product_id}
                )

                # Bước 3: Vòng lặp FEFO phân bổ số lượng vào các lô
                qty_remaining = qty_needed

                for lot in lots:
                    if qty_remaining <= 0:
                        break

                    lot_id = lot['lot_id']
                    lot_available = lot['current_lot_stock']
                    qty_from_this_lot = min(qty_remaining, lot_available)

                    export_detail = ExportDetail(
                        receipt_id=receipt.id,
                        product_id=product_id,
                        import_detail_id=lot_id,
                        quantity=qty_from_this_lot,
                        selling_price=selling_price,
                    )
                    db.session.add(export_detail)
                    qty_remaining -= qty_from_this_lot
                    total_amount += qty_from_this_lot * selling_price

                    # Cập nhật sức chứa kệ kho (nếu lô này có gắn location)
                    from app.model.import_detail import ImportDetail as ID
                    lot_detail = db.session.get(ID, lot_id)
                    if lot_detail and lot_detail.location_id:
                        from app.model.location import Location
                        loc = db.session.get(Location, lot_detail.location_id)
                        if loc:
                            loc.current_occupied = max(0, loc.current_occupied - qty_from_this_lot)

                if qty_remaining > 0:
                    raise ValueError(
                        f"FEFO allocation error: Could not fulfill {qty_remaining} units "
                        f"for product_id={product_id}. Possible data inconsistency."
                    )

            # Cập nhật tổng tiền phiếu xuất
            receipt.total_amount = total_amount

        return jsonify({
            'message': 'Export receipt created successfully (FEFO applied)',
            'receipt_code': receipt.receipt_code,
            'receipt_id': receipt.id,
            'total_amount': total_amount,
        }), 201

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:

        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


# ============================================================
# GET /api/inventory — XEM TỒN KHO REAL-TIME
# ============================================================
@inventory_bp.route('', methods=['GET'])
@jwt_required()
def get_inventory():
    """
    Trả về danh sách tồn kho hiện tại từ v_stock_balance.

    Query params:
        - category: Lọc theo danh mục sản phẩm
        - low_stock_only: "true" để chỉ lấy SP dưới ngưỡng tối thiểu
    """
    category = request.args.get('category')
    low_stock_only = request.args.get('low_stock_only', 'false').lower() == 'true'

    sql = "SELECT * FROM v_stock_balance WHERE 1=1"
    params = {}

    if category:
        sql += " AND category = :category"
        params['category'] = category

    if low_stock_only:
        sql += " AND current_stock < min_stock"

    sql += " ORDER BY product_code"

    rows = query_view(sql, params)

    return jsonify({
        'total': len(rows),
        'inventory': rows
    }), 200


# ============================================================
# GET /api/inventory/alerts — CẢNH BÁO KHO (3 loại)
# ============================================================
@inventory_bp.route('/alerts', methods=['GET'])
@jwt_required()
def get_alerts():
    """
    Trả về 3 loại cảnh báo kho trong 1 request:
      1. low_stock: SP có tồn kho < min_stock
      2. expiring_soon: Lô hàng sắp hết hạn trong 7 ngày
      3. slow_moving: SP chưa có phiếu xuất nào trong 30 ngày
    """
    now = datetime.now(timezone.utc)
    today = now.date()
    expiry_threshold = today + timedelta(days=7)
    slow_moving_threshold = now - timedelta(days=30)

    low_stock = query_view(
        """
        SELECT product_id, product_code, product_name, unit,
               current_stock, min_stock,
               (min_stock - current_stock) AS shortage
        FROM v_stock_balance
        WHERE current_stock < min_stock
        ORDER BY shortage DESC
        """
    )

    expiring_soon = query_view(
        """
        SELECT lot_id, product_id, product_code, product_name,
               batch_code, expiry_date, current_lot_stock, unit,
               (expiry_date - CURRENT_DATE) AS days_until_expiry
        FROM v_lot_stock
        WHERE expiry_date IS NOT NULL
          AND expiry_date <= :threshold
          AND expiry_date >= CURRENT_DATE
          AND current_lot_stock > 0
        ORDER BY expiry_date ASC
        """,
        {'threshold': expiry_threshold}
    )

    slow_moving = query_view(
        """
        SELECT
            vsb.product_id,
            vsb.product_code,
            vsb.product_name,
            vsb.unit,
            vsb.current_stock,
            MAX(er.export_date) AS last_export_date,
            CURRENT_DATE - MAX(er.export_date) AS days_since_last_export
        FROM v_stock_balance vsb
        LEFT JOIN export_details ed ON ed.product_id = vsb.product_id
        LEFT JOIN export_receipts er ON er.id = ed.receipt_id
        WHERE vsb.current_stock > 0
        GROUP BY vsb.product_id, vsb.product_code, vsb.product_name,
                 vsb.unit, vsb.current_stock
        HAVING MAX(er.export_date) IS NULL
            OR MAX(er.export_date) < :threshold
        ORDER BY last_export_date ASC NULLS FIRST
        """,
        {'threshold': slow_moving_threshold.date()}
    )

    def serialize_dates(rows):
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

    return jsonify({
        'generated_at': now.isoformat(),
        'low_stock': serialize_dates(low_stock),
        'expiring_soon': serialize_dates(expiring_soon),
        'slow_moving': serialize_dates(slow_moving),
        'summary': {
            'low_stock_count': len(low_stock),
            'expiring_soon_count': len(expiring_soon),
            'slow_moving_count': len(slow_moving),
        }
    }), 200


# ============================================================
# GET /api/inventory/dashboard — THỐNG KÊ TỔNG QUAN
# ============================================================
@inventory_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    """
    Thống kê tổng quan cho Dashboard:
      - Tổng số loại sản phẩm, tổng nhập/xuất, tổng tồn kho
      - Tổng giá trị tồn kho
      - Số phiếu nhập/xuất trong tháng này
    """
    summary = query_view(
        """
        SELECT
            COUNT(DISTINCT product_id)          AS total_product_types,
            COALESCE(SUM(total_imported), 0)    AS total_imported_qty,
            COALESCE(SUM(total_exported), 0)    AS total_exported_qty,
            COALESCE(SUM(current_stock), 0)     AS total_current_stock
        FROM v_stock_balance
        """
    )

    stock_value = query_view(
        """
        SELECT COALESCE(SUM(current_lot_stock * unit_price), 0) AS total_stock_value
        FROM v_lot_stock
        WHERE current_lot_stock > 0
        """
    )

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    monthly_imports = query_view(
        """
        SELECT COUNT(*) AS count, COALESCE(SUM(quantity), 0) AS qty
        FROM import_receipts ir
        JOIN import_details id ON id.receipt_id = ir.id
        WHERE ir.import_date >= :month_start
        """,
        {'month_start': month_start.date()}
    )

    monthly_exports = query_view(
        """
        SELECT COUNT(DISTINCT receipt_id) AS count, COALESCE(SUM(quantity), 0) AS qty
        FROM export_details ed
        JOIN export_receipts er ON er.id = ed.receipt_id
        WHERE er.export_date >= :month_start
        """,
        {'month_start': month_start.date()}
    )

    result = summary[0] if summary else {}
    value_result = stock_value[0] if stock_value else {}
    imp_result = monthly_imports[0] if monthly_imports else {}
    exp_result = monthly_exports[0] if monthly_exports else {}

    return jsonify({
        'overview': {
            'total_product_types': int(result.get('total_product_types', 0)),
            'total_imported_qty': int(result.get('total_imported_qty', 0)),
            'total_exported_qty': int(result.get('total_exported_qty', 0)),
            'total_current_stock': int(result.get('total_current_stock', 0)),
            'total_stock_value': float(value_result.get('total_stock_value', 0)),
        },
        'this_month': {
            'import_receipts_count': int(imp_result.get('count', 0)),
            'import_qty': int(imp_result.get('qty', 0)),
            'export_receipts_count': int(exp_result.get('count', 0)),
            'export_qty': int(exp_result.get('qty', 0)),
        },
        'generated_at': now.isoformat(),
    }), 200


# ============================================================
# GET /api/inventory/lots/<product_id> — XEM CÁC LÔ CỦA 1 SP
# ============================================================
@inventory_bp.route('/lots/<int:product_id>', methods=['GET'])
@jwt_required()
def get_product_lots(product_id):
    """
    Trả về danh sách các lô hàng của 1 sản phẩm, kèm tồn kho từng lô.
    """
    lots = query_view(
        """
        SELECT lot_id, batch_code, expiry_date, import_date,
               import_qty, exported_qty, current_lot_stock,
               unit_price, receipt_code
        FROM v_lot_stock
        WHERE product_id = :pid
        ORDER BY expiry_date ASC NULLS LAST
        """,
        {'pid': product_id}
    )

    for lot in lots:
        for k in ('expiry_date', 'import_date'):
            if lot.get(k) and isinstance(lot[k], (date, datetime)):
                lot[k] = lot[k].isoformat()
        if lot.get('unit_price'):
            lot['unit_price'] = float(lot['unit_price'])

    return jsonify({'product_id': product_id, 'lots': lots, 'total': len(lots)}), 200


# ============================================================
# GET /api/inventory/bell-notifications — CHUÔNG THÔNG BÁO
# ============================================================
@inventory_bp.route('/bell-notifications', methods=['GET'])
@jwt_required()
def get_bell_notifications():
    """
    API nhẹ dành cho Polling của chuông thông báo.
    Lấy cảnh báo (alert_count) và hoạt động mới nhất (recent_activities).
    """
    now = datetime.now(timezone.utc)
    today = now.date()
    expiry_threshold = today + timedelta(days=7)

    # 1. Đếm cảnh báo (Chỉ đếm, không fetch hết data để nhẹ API)
    low_stock_count = query_view("SELECT COUNT(*) as c FROM v_stock_balance WHERE current_stock < min_stock")[0]['c']
    expiring_soon_count = query_view(
        "SELECT COUNT(*) as c FROM v_lot_stock WHERE expiry_date <= :threshold AND expiry_date >= CURRENT_DATE AND current_lot_stock > 0",
        {'threshold': expiry_threshold}
    )[0]['c']

    total_alerts = low_stock_count + expiring_soon_count
    
    alerts_preview = []
    if low_stock_count > 0:
        alerts_preview.append({"type": "low_stock", "message": f"Cảnh báo: Có {low_stock_count} sản phẩm dưới mức tồn kho tối thiểu."})
    if expiring_soon_count > 0:
        alerts_preview.append({"type": "expiring_soon", "message": f"Cảnh báo: Có {expiring_soon_count} lô hàng sắp hết hạn."})

    # 2. Lấy 5 hoạt động gần nhất (Kết hợp Import và Export)
    recent_imports = query_view(
        """
        SELECT 'import' as type, ir.receipt_code, u.full_name as created_by_name, ir.created_at
        FROM import_receipts ir
        LEFT JOIN users u ON u.id = ir.created_by
        ORDER BY ir.created_at DESC LIMIT 5
        """
    )
    
    recent_exports = query_view(
        """
        SELECT 'export' as type, er.receipt_code, u.full_name as created_by_name, er.created_at
        FROM export_receipts er
        LEFT JOIN users u ON u.id = er.created_by
        ORDER BY er.created_at DESC LIMIT 5
        """
    )
    
    # Merge and sort manually
    recent_activities = recent_imports + recent_exports
    # Convert string dates to datetime for sorting if they are strings, but created_at in DB is usually datetime
    for act in recent_activities:
        if isinstance(act['created_at'], str):
            act['created_at'] = datetime.fromisoformat(act['created_at'])
            
    recent_activities.sort(key=lambda x: x['created_at'], reverse=True)
    recent_activities = recent_activities[:5]
    
    # Format activities to readable messages
    activities_preview = []
    for act in recent_activities:
        action_text = "nhập kho" if act['type'] == 'import' else "xuất kho"
        time_str = act['created_at'].strftime("%H:%M %d/%m/%Y")
        msg = f"{act['created_by_name'] or 'Unknown'} vừa tạo phiếu {action_text} {act['receipt_code']} lúc {time_str}"
        activities_preview.append({"type": act['type'], "message": msg})

    return jsonify({
        "alerts_count": total_alerts,
        "alerts": alerts_preview,
        "activities": activities_preview
    }), 200


# ============================================================
# GET /api/inventory/stats — DỮ LIỆU BIỂU ĐỒ DASHBOARD
# ============================================================
@inventory_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """
    Thống kê cho biểu đồ Dashboard:
      1. Số lượng nhập/xuất 7 ngày qua (biểu đồ cột)
      2. Tồn kho theo danh mục (biểu đồ tròn)
    """
    # 1. Lấy dữ liệu 7 ngày qua
    days = []
    today = date.today()
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        days.append(d)

    stats_7days = []
    for d in days:
        # Nhập: SUM(quantity) của ImportDetails trong ngày d
        imp_res = query_view(
            """
            SELECT COALESCE(SUM(id.quantity), 0) as qty
            FROM import_details id
            JOIN import_receipts ir ON ir.id = id.receipt_id
            WHERE ir.import_date = :d
            """,
            {'d': d}
        )
        
        # Xuất: SUM(quantity) của ExportDetails trong ngày d
        exp_res = query_view(
            """
            SELECT COALESCE(SUM(ed.quantity), 0) as qty
            FROM export_details ed
            JOIN export_receipts er ON er.id = ed.receipt_id
            WHERE er.export_date = :d
            """,
            {'d': d}
        )
        
        stats_7days.append({
            'date': d.strftime('%d/%m'),
            'import': int(imp_res[0]['qty']),
            'export': int(exp_res[0]['qty'])
        })

    # 2. Lấy tồn kho theo danh mục
    category_stock_raw = query_view(
        """
        SELECT 
            COALESCE(category, 'Chưa phân loại') as name,
            COALESCE(SUM(current_stock), 0) as value
        FROM v_stock_balance
        GROUP BY category
        ORDER BY value DESC
        """
    )
    
    category_stock = []
    for row in category_stock_raw:
        category_stock.append({
            'name': row['name'],
            'value': float(row['value'])
        })

    return jsonify({
        'stats_7days': stats_7days,
        'category_stock': category_stock
    }), 200
