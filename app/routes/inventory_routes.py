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
from app.models.import_receipt import ImportReceipt
from app.models.import_detail import ImportDetail
from app.models.export_receipt import ExportReceipt
from app.models.export_detail import ExportDetail
from app.models.product import Product

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

    # Validate các trường bắt buộc
    required = ['supplier_id', 'items']
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({'error': f'Missing required fields: {missing}'}), 400

    items = data.get('items', [])
    if not items:
        return jsonify({'error': 'items array cannot be empty'}), 400

    # get_jwt_identity() trả về string (vì login dùng str(user.id))
    # Phải cast sang int vì created_by là Integer FK
    current_user_id = int(get_jwt_identity())

    try:
        # *** TRANSACTION BEGIN ***
        # Dùng with db.session.begin() theo context manager để đảm bảo:
        #   - Nếu mọi thứ OK → tự động COMMIT khi thoát khỏi block
        #   - Nếu có exception bất kỳ → tự động ROLLBACK
        # Điều này quan trọng vì tạo phiếu nhập gồm 2 bước:
        #   1. INSERT import_receipts
        #   2. INSERT N dòng import_details
        # Nếu bước 2 lỗi, bước 1 phải được rollback — không để phiếu nhập trống.
        with db.session.begin():
            # Bước 1: Tạo vỏ phiếu nhập
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
            # flush() để PostgreSQL gán ID cho receipt mà chưa COMMIT.
            # Cần thiết vì import_details cần receipt.id làm foreign key.
            db.session.flush()

            # Bước 2: Lặp qua danh sách sản phẩm, tạo từng dòng chi tiết
            for item in items:
                # Validate từng item
                if not item.get('product_id') or not item.get('quantity'):
                    raise ValueError(f"Item missing product_id or quantity: {item}")
                if int(item['quantity']) <= 0:
                    raise ValueError(f"quantity must be > 0 for product_id={item['product_id']}")

                # Kiểm tra product tồn tại
                product = db.session.get(Product, item['product_id'])
                if not product or not product.is_active:
                    raise ValueError(f"Product id={item['product_id']} not found or inactive")

                # Parse expiry_date nếu có
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
            # Thoát khỏi `with` → auto COMMIT

        return jsonify({
            'message': 'Import receipt created successfully',
            'receipt_code': receipt.receipt_code,
            'receipt_id': receipt.id,
        }), 201

    except ValueError as e:
        # ValueError từ validation logic — lỗi 400 Bad Request
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        # Lỗi không lường trước (DB lỗi, constraint violation...) — lỗi 500
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


# ============================================================
# POST /api/inventory/exports — TẠO PHIẾU XUẤT (FEFO)
# ============================================================
@inventory_bp.route('/exports', methods=['POST'])
@jwt_required()
def create_export():
    """
    Tạo phiếu xuất kho sử dụng thuật toán FEFO (First Expired, First Out).

    FEFO là quy tắc bắt buộc trong kho có hàng hóa với hạn sử dụng:
    "Lô nào gần hết hạn nhất thì xuất trước" — tránh hàng hết hạn tồn kho.

    Body JSON:
    {
        "reason": "SELL",
        "note": "Xuất cho khách hàng A",
        "items": [
            {"product_id": 2, "quantity": 150}
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

    # Validate reason
    valid_reasons = ['SELL', 'RETURN', 'INTERNAL', 'DISPOSE']
    reason = data.get('reason', 'SELL').upper()
    if reason not in valid_reasons:
        return jsonify({'error': f'reason must be one of {valid_reasons}'}), 400

    try:
        with db.session.begin():
            # Tạo vỏ phiếu xuất trước
            export_date = data.get('export_date')
            if export_date:
                export_date = date.fromisoformat(export_date)
            else:
                export_date = datetime.now(timezone.utc).date()

            receipt = ExportReceipt(
                export_date=export_date,
                reason=reason,
                note=data.get('note'),
                created_by=current_user_id,
            )
            db.session.add(receipt)
            db.session.flush()  # Lấy receipt.id

            # Xử lý từng sản phẩm cần xuất
            for item in items:
                product_id = item.get('product_id')
                qty_needed = int(item.get('quantity', 0))

                if not product_id or qty_needed <= 0:
                    raise ValueError(f"Invalid item: {item}")

                # --------------------------------------------------
                # BƯỚC 1: KIỂM TRA TỒN KHO TỔNG (từ v_stock_balance)
                # --------------------------------------------------
                # Query View thay vì bảng products vì tồn kho không lưu tĩnh.
                # View tính động từ tất cả giao dịch nhập/xuất hiện có.
                # Ưu tiên kiểm tra tổng trước để fail-fast, tránh lãng phí
                # công sức chạy thuật toán FEFO nếu đã biết không đủ hàng.
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

                # --------------------------------------------------
                # BƯỚC 2: LẤY DANH SÁCH CÁC LÔ CÒN HÀNG (từ v_lot_stock)
                # Sắp xếp theo FEFO: expiry_date ASC NULLS LAST
                # --------------------------------------------------
                # ORDER BY expiry_date ASC: Lô gần hết hạn nhất xếp đầu tiên.
                # NULLS LAST: Hàng không có hạn sử dụng xếp sau hàng có hạn
                #             (ưu tiên giải phóng hàng có hạn dùng trước).
                # WHERE current_lot_stock > 0: Chỉ lấy lô còn hàng.
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

                # --------------------------------------------------
                # BƯỚC 3: VÒNG LẶP FEFO — PHÂN BỔ SỐ LƯỢNG XUẤT VÀO CÁC LÔ
                # --------------------------------------------------
                # Mục tiêu: Xuất `qty_needed` đơn vị từ các lô, ưu tiên lô gần hết hạn.
                #
                # Thuật toán "Greedy Lot Allocation":
                #   - qty_remaining: Số lượng còn cần xuất (giảm dần theo vòng lặp)
                #   - Với mỗi lô (đã sắp xếp FEFO):
                #       + Nếu lô này có đủ hàng: lấy hết qty_remaining từ lô này → DONE
                #       + Nếu lô này không đủ: lấy hết lô này, trừ đi, chuyển sang lô tiếp theo
                #   - Tạo 1 dòng export_detail cho mỗi lô được lấy hàng từ đó.
                #
                # Tại sao tạo nhiều export_detail cho 1 sản phẩm trong 1 phiếu xuất?
                #   Vì mỗi dòng export_detail gắn với 1 import_detail_id (1 lô) cụ thể.
                #   Điều này đảm bảo truy vết đầy đủ: "50 cái xuất từ LOT-001, 30 cái từ LOT-002".
                qty_remaining = qty_needed

                for lot in lots:
                    if qty_remaining <= 0:
                        break  # Đã phân bổ đủ số lượng cần xuất

                    lot_id = lot['lot_id']
                    lot_available = lot['current_lot_stock']

                    # Số lượng lấy từ lô này: tối đa là số còn trong lô
                    qty_from_this_lot = min(qty_remaining, lot_available)

                    # Tạo dòng export_detail gắn với lô này
                    # import_detail_id = lot_id: Cầu nối FEFO truy xuất nguồn gốc
                    export_detail = ExportDetail(
                        receipt_id=receipt.id,
                        product_id=product_id,
                        import_detail_id=lot_id,  # ← Trỏ chính xác về lô hàng nguồn
                        quantity=qty_from_this_lot,
                    )
                    db.session.add(export_detail)

                    # Giảm số lượng còn cần xuất
                    qty_remaining -= qty_from_this_lot

                # Kiểm tra sau vòng lặp: nếu vẫn còn qty_remaining > 0,
                # có nghĩa tổng các lô không đủ — lỗi logic (không nên xảy ra
                # nếu Bước 1 kiểm tra đúng, nhưng phòng thủ vẫn cần thiết)
                if qty_remaining > 0:
                    raise ValueError(
                        f"FEFO allocation error: Could not fulfill {qty_remaining} units "
                        f"for product_id={product_id}. Possible data inconsistency."
                    )
            # Thoát `with` → auto COMMIT toàn bộ receipt + tất cả export_details

        return jsonify({
            'message': 'Export receipt created successfully (FEFO applied)',
            'receipt_code': receipt.receipt_code,
            'receipt_id': receipt.id,
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
    Trả về danh sách tồn kho hiện tại của tất cả sản phẩm.
    Dữ liệu lấy từ v_stock_balance — tính động, không cache.

    Query params:
        - category: Lọc theo danh mục sản phẩm
        - low_stock_only: "true" để chỉ lấy SP dưới ngưỡng tối thiểu
    """
    category = request.args.get('category')
    low_stock_only = request.args.get('low_stock_only', 'false').lower() == 'true'

    # Xây dựng câu query động dựa trên filter
    sql = "SELECT * FROM v_stock_balance WHERE 1=1"
    params = {}

    if category:
        sql += " AND category = :category"
        params['category'] = category

    # Lọc SP dưới ngưỡng tối thiểu: current_stock < min_stock
    # Điều kiện này so sánh giá trị tính động (View) với giá trị tĩnh (min_stock trong products)
    if low_stock_only:
        sql += " AND current_stock < min_stock"

    sql += " ORDER BY product_code"

    rows = query_view(sql, params)

    return jsonify({
        'total': len(rows),
        'inventory': rows
    }), 200


# ============================================================
# GET /api/inventory/alerts — CẢNH BÁO KHO
# ============================================================
@inventory_bp.route('/alerts', methods=['GET'])
@jwt_required()
def get_alerts():
    """
    Trả về 3 loại cảnh báo kho:
      1. low_stock: SP có tồn kho < ngưỡng tối thiểu (min_stock)
      2. expiring_soon: Lô hàng sắp hết hạn trong 7 ngày tới
      3. slow_moving: SP chưa có phiếu xuất nào trong 30 ngày qua

    Tại sao gom vào 1 API?
    Frontend Dashboard chỉ cần 1 request để render toàn bộ widget cảnh báo.
    Tránh waterfall requests (3 request liên tiếp chờ nhau).
    """
    now = datetime.now(timezone.utc)
    today = now.date()
    expiry_threshold = today + timedelta(days=7)
    slow_moving_threshold = now - timedelta(days=30)

    # ---- CẢNH BÁO 1: TỒN KHO THẤP ----
    # So sánh current_stock (tính từ View) với min_stock (cột tĩnh của sản phẩm).
    # Đây là lý do min_stock lưu trong bảng products là hợp lý: nó là chính sách,
    # không phải dữ liệu giao dịch — không bị race condition.
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

    # ---- CẢNH BÁO 2: LÔ HÀNG SẮP HẾT HẠN (trong 7 ngày) ----
    # Query v_lot_stock thay vì import_details để biết lô còn hàng hay không.
    # Chỉ cảnh báo lô CÒN HÀNG (current_lot_stock > 0) — lô hết hàng không cần lo.
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

    # ---- CẢNH BÁO 3: HÀNG TỒN LÂU (slow_moving) ----
    # Định nghĩa "tồn lâu": Sản phẩm còn tồn kho nhưng chưa có phiếu xuất nào
    # trong 30 ngày qua — có thể do nhu cầu giảm, hàng lỗi thời, hoặc lỗi nhập liệu.
    #
    # Kỹ thuật: LEFT JOIN export_receipts để tìm phiếu xuất gần nhất.
    # Điều kiện OR last_export_date IS NULL: Bao gồm cả SP chưa bao giờ được xuất.
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

    # Chuyển đổi date objects sang string để JSON serializable
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
    Thống kê tổng quan cho trang chủ Dashboard:
      - Tổng số loại sản phẩm đang hoạt động
      - Tổng số lượng đã nhập kho (all time)
      - Tổng số lượng đã xuất kho (all time)
      - Tổng tồn kho hiện tại
      - Tổng giá trị tồn kho (quantity * unit_price tại thời điểm nhập)
      - Số phiếu nhập / xuất trong tháng này
    """
    # Thống kê tổng hợp từ View — 1 query duy nhất
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

    # Tổng giá trị tồn kho: Tính từ v_lot_stock vì chỉ ở đó có unit_price theo lô
    stock_value = query_view(
        """
        SELECT COALESCE(SUM(current_lot_stock * unit_price), 0) AS total_stock_value
        FROM v_lot_stock
        WHERE current_lot_stock > 0
        """
    )

    # Thống kê giao dịch trong tháng hiện tại
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
    Hữu ích để nhân viên kho kiểm tra chi tiết trước khi xuất hàng.
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

    # Serialize date fields
    for lot in lots:
        for k in ('expiry_date', 'import_date'):
            if lot.get(k) and isinstance(lot[k], (date, datetime)):
                lot[k] = lot[k].isoformat()
        if lot.get('unit_price'):
            lot['unit_price'] = float(lot['unit_price'])

    return jsonify({'product_id': product_id, 'lots': lots, 'total': len(lots)}), 200
