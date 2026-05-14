from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.extensions import db
from app.model.import_receipt import ImportReceipt
from app.model.import_detail import ImportDetail
from app.model.product import Product
from app.model.supplier import Supplier
from app.model.location import Location

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
    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    current_user_id = int(get_jwt_identity())

    # Validate supplier_id — Frontend có thể gửi dạng ID hoặc chuỗi tên
    supplier_id = data.get('supplier_id') or data.get('supplierId')
    if not supplier_id:
        return jsonify({'error': 'Thiếu nhà cung cấp (supplier_id)'}), 400
    try:
        supplier_id = int(supplier_id)
    except (ValueError, TypeError):
        return jsonify({'error': 'supplier_id không hợp lệ'}), 400

    supplier = Supplier.query.get(supplier_id)
    if not supplier or not supplier.is_active:
        return jsonify({'error': f'Nhà cung cấp id={supplier_id} không tồn tại hoặc đã bị ẩn'}), 404

    items = data.get('items', [])
    if not items:
        return jsonify({'error': 'Danh sách mặt hàng không được để trống'}), 400

    # Parse ngày nhập
    import_date_str = data.get('import_date') or data.get('date')
    try:
        import_date = (
            datetime.strptime(import_date_str, '%Y-%m-%d').date()
            if import_date_str else datetime.utcnow().date()
        )
    except ValueError:
        return jsonify({'error': 'import_date không đúng định dạng YYYY-MM-DD'}), 400

    try:
        # Tính tổng tiền phiếu (Frontend đã tính sẵn totalAmount từng dòng)
        total_amount = 0
        validated_items = []

        for item in items:
            # Đồng bộ cả camelCase (Frontend) và snake_case (Postman/API)
            product_id = item.get('product_id') or item.get('productId')
            quantity = item.get('quantity')
            unit_price = item.get('unit_price') or item.get('price') or 0
            batch_code = item.get('batch_code') or item.get('batchCode')
            expiry_date_str = item.get('expiry_date') or item.get('expiryDate')
            location_id = item.get('location_id') or item.get('locationId')

            # Validate bắt buộc
            if not product_id:
                return jsonify({'error': 'Mỗi mặt hàng phải có product_id'}), 400
            try:
                product_id = int(product_id)
                quantity = int(quantity)
                unit_price = float(unit_price)
            except (ValueError, TypeError):
                return jsonify({'error': f'Dữ liệu không hợp lệ cho product_id={product_id}'}), 400

            if quantity <= 0:
                return jsonify({'error': f'Số lượng phải lớn hơn 0 cho product_id={product_id}'}), 400

            product = Product.query.get(product_id)
            if not product or not product.is_active:
                return jsonify({'error': f'Sản phẩm id={product_id} không tồn tại hoặc đã bị ẩn'}), 404

            # Kiểm tra vượt tồn kho tối đa
            if quantity + 0 > product.max_stock:
                return jsonify({
                    'error': f'Số lượng nhập ({quantity}) vượt tồn kho tối đa ({product.max_stock}) của sản phẩm "{product.name}"'
                }), 400

            # Parse expiry_date
            expiry_date = None
            if expiry_date_str:
                try:
                    expiry_date = datetime.strptime(expiry_date_str, '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({'error': f'expiry_date không đúng định dạng YYYY-MM-DD cho product_id={product_id}'}), 400

            # Kiểm tra location nếu có
            if location_id:
                try:
                    location_id = int(location_id)
                except (ValueError, TypeError):
                    return jsonify({'error': 'location_id không hợp lệ'}), 400
                loc = Location.query.get(location_id)
                if not loc or not loc.is_active:
                    return jsonify({'error': f'Vị trí kệ id={location_id} không tồn tại'}), 404
                if loc.available_capacity < quantity:
                    return jsonify({
                        'error': f'Kệ "{loc.location_code}" không đủ sức chứa. '
                                 f'Còn trống: {loc.available_capacity}, Cần cất: {quantity}'
                    }), 400

            total_amount += quantity * unit_price
            validated_items.append({
                'product_id': product_id,
                'quantity': quantity,
                'unit_price': unit_price,
                'batch_code': batch_code,
                'expiry_date': expiry_date,
                'location_id': location_id,
                'location_obj': Location.query.get(location_id) if location_id else None,
            })

        # Tạo phiếu nhập
        receipt = ImportReceipt(
            supplier_id=supplier_id,
            import_date=import_date,
            total_amount=total_amount,
            status='COMPLETED',
            note=data.get('note'),
            created_by=current_user_id,
        )
        db.session.add(receipt)
        db.session.flush()  # Lấy receipt.id trước khi commit

        # Tạo từng dòng chi tiết và cập nhật sức chứa kệ
        for item_data in validated_items:
            detail = ImportDetail(
                receipt_id=receipt.id,
                product_id=item_data['product_id'],
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                batch_code=item_data['batch_code'],
                expiry_date=item_data['expiry_date'],
                location_id=item_data['location_id'],
            )
            db.session.add(detail)

            # Cập nhật số lượng đang chiếm dụng trong kệ
            if item_data['location_obj']:
                item_data['location_obj'].current_occupied += item_data['quantity']

        db.session.commit()
        return jsonify({
            'message': 'Tạo phiếu nhập thành công',
            'receipt_code': receipt.receipt_code,
            'receipt_id': receipt.id,
            'total_amount': total_amount,
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi hệ thống: {str(e)}'}), 500
