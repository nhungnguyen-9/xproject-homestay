# 🚀 Hướng Dẫn Triển Khai Nhà Cam Homestay lên VPS

Tài liệu này hướng dẫn chi tiết cách deploy dự án Nhà Cam Homestay lên VPS (Ubuntu 22.04) sử dụng Docker và Nginx.

## 🏗️ Kiến Trúc Triển Khai
- **Frontend**: React (Vite) phục vụ bởi Nginx.
- **Backend**: Node.js Express.
- **Database**: PostgreSQL 15.
- **Orchestration**: Docker Compose.
- **Reverse Proxy**: Nginx (Host) + SSL Certbot.

---

## 1. Chuẩn Bị VPS
Kết nối SSH vào VPS của anh và chạy script thiết lập tự động:

```bash
# Clone dự án (nếu chưa có)
git clone https://github.com/nhungnguyen-9/xproject-homestay.git
cd xproject-homestay

# Cấp quyền và chạy script setup
chmod +x scripts/setup-vps.sh
./scripts/setup-vps.sh
```

*Lưu ý: Sau khi chạy xong, hãy logout và login lại để quyền Docker có hiệu lực.*

---

## 2. Cấu Hình Biến Môi Trường
Tạo tệp `.env` tại thư mục gốc của dự án trên VPS:

```bash
nano .env
```

Dán nội dung sau và điều chỉnh thông tin:
```env
# Database
DB_USER=nhacam_admin
DB_PASSWORD=your_strong_password
DB_NAME=nhacam_production

# Backend
JWT_SECRET=your_jwt_secret_key
PORT=3000

# Frontend
VITE_API_URL=https://api.yourdomain.com
```

---

## 3. Khởi Chạy Hệ Thống
Sử dụng Docker Compose để build và chạy toàn bộ container:

```bash
docker-compose up -d --build
```

Kiểm tra trạng thái các container:
```bash
docker-compose ps
```

---

## 4. Cấu Hình Nginx Reverse Proxy
Tạo file cấu hình Nginx để trỏ domain về các container:

```bash
sudo nano /etc/nginx/sites-available/nhacam
```

Nội dung cấu hình (Thay `yourdomain.com` bằng domain của anh):
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8080; # Frontend port
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000; # Backend port
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Kích hoạt cấu hình và restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/nhacam /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 5. Cài Đặt SSL (HTTPS)
Sử dụng Certbot để cài đặt SSL miễn phí từ Let's Encrypt:

```bash
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

---

## 🛠️ Lệnh Vận Hành Thường Dùng

| Lệnh | Mô tả |
| :--- | :--- |
| `docker-compose logs -f` | Xem log thời gian thực của toàn bộ hệ thống |
| `docker-compose restart` | Restart lại toàn bộ dịch vụ |
| `docker-compose down` | Dừng và xóa các container |
| `docker image prune -f` | Dọn dẹp các bản build cũ để tiết kiệm dung lượng |

---

## 🤖 Tự Động Hóa (CI/CD)
Dự án đã có sẵn workflow GitHub Actions tại `.github/workflows/deploy.yml`. Để kích hoạt, anh cần vào **Settings > Secrets and variables > Actions** trên GitHub và thêm các Secrets sau:

1. `DOCKERHUB_USERNAME`: Tên đăng nhập Docker Hub.
2. `DOCKERHUB_TOKEN`: Access Token từ Docker Hub.
3. `VPS_HOST`: IP của VPS.
4. `VPS_USER`: Username đăng nhập (thường là root hoặc ubuntu).
5. `SSH_PRIVATE_KEY`: Private Key để kết nối SSH.
6. `VITE_API_URL`: URL của API (https://api.yourdomain.com).

Chúc anh triển khai thành công! Nếu gặp lỗi, hãy dùng lệnh `docker-compose logs backend` để kiểm tra chi tiết.
