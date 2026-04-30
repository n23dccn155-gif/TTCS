1. Chuẩn bị môi trường
•	Đã cài đặt Python 3.x.
•	Đã cài đặt Node.js (phiên bản 18 trở lên).
2. Cài đặt Backend (Flask)
Mở terminal tại thư mục gốc của dự án:
# Di chuyển vào thư mục server (nếu bạn chia thư mục)
	cd backend

# Tạo môi trường ảo (Khuyên dùng)
	python -m venv venv

# Kích hoạt môi trường ảo
# Windows:
	venv\Scripts\activate
# macOS/Linux:
	source venv/bin/activate

# Cài đặt các thư viện cần thiết từ requirement.txt 
	pip install -r requirement.txt
3. Cài đặt Frontend (React + Vite)
Mở một terminal mới:
# Di chuyển vào thư mục frontend
	cd frontend

# Cài đặt các package Node.js
	npm install
  
# Cài đặt Tailwind CSS và các thư viện hỗ trợ 
	npm install -D tailwindcss postcss autoprefixer  

# Cài đặt thêm icon và tailwind (nếu chưa có trong project)
	npm install lucide-react
 Cách chạy web
Bước 1: Chạy Backend
Tại terminal đã kích hoạt môi trường ảo của Backend:
# Tạo file .env nếu cần (để lưu SECRET_KEY, DATABASE_URL)
# Sau đó chạy server
	python app.py
Mặc định Backend sẽ chạy tại: http://127.0.0.1:5000
Bước 2: Chạy Frontend
Tại terminal của Frontend: 
	npm run dev
Mặc định Frontend sẽ chạy tại: http://localhost:5173 (hoặc cổng hiển thị trên terminal)
