import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# Lay DATABASE_URL tu bien moi truong, hoac dung mac dinh
db_url = os.environ.get('DATABASE_URL')
if not db_url:
    print("LOI: Khong tim thay DATABASE_URL trong file .env!")
    exit(1)

try:
    engine = create_engine(db_url)
    sql = open('migrations/create_stock_views.sql', encoding='utf-8').read()
    
    with engine.connect() as conn:
        conn.execute(text(sql))
        conn.commit()
        print('=== THANH CONG ===')
        print('Da tao cac Views (v_stock_balance, v_lot_stock) thanh cong!')
except Exception as e:
    print('=== LOI ===')
    print('Khong the tao Views. Ban da chay "flask db upgrade" va sua file .env chua?')
    print(f'Chi tiet loi: {e}')
