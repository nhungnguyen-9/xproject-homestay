# Hướng dẫn triển khai lên VPS — Nhà Cam Homestay

> Cập nhật: 2026-03-24

---

## Mục lục
1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Chuẩn bị VPS](#2-chuẩn-bị-vps)
3. [Cài đặt PostgreSQL](#3-cài-đặt-postgresql)
4. [Deploy Backend](#4-deploy-backend)
5. [Deploy Frontend](#5-deploy-frontend)
6. [Cấu hình Nginx](#6-cấu-hình-nginx)
7. [SSL/HTTPS](#7-sslhttps)
8. [Process Manager](#8-process-manager)
9. [Checklist trước khi go-live](#9-checklist-trước-khi-go-live)
10. [Lưu ý quan trọng](#10-lưu-ý-quan-trọng)

---

## 1. Yêu cầu hệ thống

| Thành phần | Yêu cầu tối thiểu | Khuyến nghị |
|------------|-------------------|-------------|
| OS | Ubuntu 22.04+ / Debian 12+ | Ubuntu 24.04 LTS |
| RAM | 1 GB | 2 GB+ |
| CPU | 1 vCPU | 2 vCPU |
| Disk | 10 GB SSD | 20 GB SSD |
| Node.js | 20.6+ (cần `--env-file`) | 22 LTS |
| PostgreSQL | 15+ | 16 |
| Nginx | 1.18+ | latest |

---

## 2. Chuẩn bị VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Cài Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Cài build tools
sudo apt install -y build-essential git nginx certbot python3-certbot-nginx

# Cài PM2 (process manager)
sudo npm install -g pm2

# Tạo user cho app (không dùng root)
sudo adduser --disabled-password nhacam
sudo usermod -aG sudo nhacam
```

---

## 3. Cài đặt PostgreSQL

```bash
# Cài PostgreSQL 16
sudo apt install -y postgresql postgresql-contrib

# Tạo database và user
sudo -u postgres psql <<SQL
CREATE USER nhacam_app WITH PASSWORD 'YOUR_STRONG_DB_PASSWORD_HERE';
CREATE DATABASE cinehome OWNER nhacam_app;
GRANT ALL PRIVILEGES ON DATABASE cinehome TO nhacam_app;
\q
SQL
```

**⚠️ LƯU Ý:**
- **KHÔNG** dùng password `postgres` mặc định
- Tạo password mạnh: `openssl rand -base64 32`
- Nếu dùng managed PostgreSQL (Supabase, Railway, Neon), cần thêm SSL config

---

## 4. Deploy Backend

### 4.1 Clone và cài đặt

```bash
# Đăng nhập user nhacam
su - nhacam

# Clone repo
git clone git@github.com:nhungnguyen-9/xproject-homestay.git
cd xproject-homestay/backend

# Cài dependencies
npm ci --production
```

### 4.2 Tạo file `.env` cho production

```bash
cat > .env <<'EOF'
DATABASE_URL=postgres://nhacam_app:YOUR_STRONG_DB_PASSWORD_HERE@localhost:5432/cinehome
JWT_SECRET=THAY_BANG_64_KY_TU_RANDOM_DAU_TIEN
JWT_REFRESH_SECRET=THAY_BANG_64_KY_TU_RANDOM_THU_HAI
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
EOF
```

**Tạo JWT secrets mạnh:**
```bash
openssl rand -base64 64   # Dùng cho JWT_SECRET
openssl rand -base64 64   # Dùng cho JWT_REFRESH_SECRET
```

### 4.3 Build và khởi tạo database

```bash
# Build TypeScript → JavaScript
npm run build

# Chạy migration (tạo bảng)
npm run db:migrate

# Seed dữ liệu mẫu (TÙY CHỌN — chỉ cho demo)
npm run db:seed
```

### 4.4 Test backend

```bash
npm start
# Mở tab khác:
curl http://localhost:3001/health
# Kết quả: {"status":"ok","timestamp":"..."}
```

### 4.5 Nếu dùng SSL cho PostgreSQL (managed DB)

Sửa `src/config/database.ts` trước khi build:
```ts
const queryClient = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
  max_lifetime: 60 * 30,
  ssl: { rejectUnauthorized: false },  // Thêm dòng này
});
```

---

## 5. Deploy Frontend

### 5.1 Build

```bash
cd ~/xproject-homestay/frontend

# Cài dependencies
npm ci

# Tắt sourcemap cho production (tùy chọn)
# Sửa vite.config.ts: sourcemap: false

# Build
npm run build
```

Output tại `frontend/dist/` — đây là static files, Nginx sẽ serve trực tiếp.

### 5.2 Kết nối Frontend → Backend API

**⚠️ QUAN TRỌNG:** Frontend hiện tại dùng **localStorage** cho tất cả services, chưa kết nối API backend. Để kết nối:

1. Tạo file `frontend/.env.production`:
```bash
VITE_API_URL=https://yourdomain.com/api/v1
```

2. Tạo API adapter layer thay thế localStorage services (task riêng, chưa implement)

**Nếu chưa kết nối API:** Frontend vẫn hoạt động bình thường với localStorage (demo mode).

---

## 6. Cấu hình Nginx

### 6.1 Tạo config file

```bash
sudo nano /etc/nginx/sites-available/nhacam
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend — static files
    root /home/nhacam/xproject-homestay/frontend/dist;
    index index.html;

    # SPA fallback — tất cả routes trả về index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API — reverse proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:3001;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Chặn truy cập file ẩn
    location ~ /\. {
        deny all;
    }
}
```

### 6.2 Kích hoạt

```bash
sudo ln -s /etc/nginx/sites-available/nhacam /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default   # Xóa default nếu có
sudo nginx -t                              # Test config
sudo systemctl reload nginx
```

---

## 7. SSL/HTTPS

```bash
# Cài SSL miễn phí với Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renew (certbot tự thêm cron job)
sudo certbot renew --dry-run
```

Sau khi cài SSL, cập nhật `CORS_ORIGIN` trong backend `.env`:
```
CORS_ORIGIN=https://yourdomain.com
```

---

## 8. Process Manager (PM2)

### 8.1 Tạo ecosystem file

```bash
cat > ~/xproject-homestay/ecosystem.config.cjs <<'EOF'
module.exports = {
  apps: [{
    name: 'nhacam-backend',
    cwd: './backend',
    script: 'dist/index.js',
    node_args: '--env-file=.env',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
    },
    max_memory_restart: '300M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    merge_logs: true,
  }],
};
EOF
```

### 8.2 Khởi động và cấu hình auto-start

```bash
cd ~/xproject-homestay

# Tạo thư mục logs
mkdir -p backend/logs

# Start
pm2 start ecosystem.config.cjs

# Xem status
pm2 status
pm2 logs nhacam-backend

# Auto-start khi reboot
pm2 startup
pm2 save
```

### 8.3 Commands thường dùng

```bash
pm2 restart nhacam-backend    # Restart
pm2 reload nhacam-backend     # Zero-downtime reload
pm2 stop nhacam-backend       # Stop
pm2 logs nhacam-backend       # Xem logs
pm2 monit                     # Monitor realtime
```

---

## 9. Checklist trước khi go-live

### Bảo mật (BẮT BUỘC)

- [ ] `JWT_SECRET` — ít nhất 64 ký tự random (`openssl rand -base64 64`)
- [ ] `JWT_REFRESH_SECRET` — ít nhất 64 ký tự random, KHÁC với JWT_SECRET
- [ ] `DATABASE_URL` — password mạnh, KHÔNG dùng `postgres:postgres`
- [ ] `NODE_ENV=production`
- [ ] `CORS_ORIGIN` — đúng domain production (có `https://`)
- [ ] **Đổi password admin/staff** sau khi seed (hoặc sửa seed.ts trước khi chạy)
- [ ] Tắt sourcemap production: `vite.config.ts` → `sourcemap: false` hoặc `'hidden'`
- [ ] Firewall: chỉ mở port 80, 443, 22 (SSH)
- [ ] PostgreSQL: chỉ cho phép kết nối từ localhost

### Database

- [ ] PostgreSQL đã cài và chạy
- [ ] Database `cinehome` đã tạo
- [ ] Migration đã chạy (`npm run db:migrate`)
- [ ] Seed data (nếu cần demo): `npm run db:seed`
- [ ] Backup cron job đã setup

### Infrastructure

- [ ] Nginx config đúng, `nginx -t` pass
- [ ] SSL certificate đã cài (certbot)
- [ ] PM2 đang chạy backend
- [ ] PM2 startup đã save (auto-start on reboot)
- [ ] Domain DNS trỏ về IP VPS

### Kiểm tra

- [ ] `https://yourdomain.com` — hiện trang chủ
- [ ] `https://yourdomain.com/admin` — hiện admin dashboard
- [ ] `https://yourdomain.com/health` — trả về `{"status":"ok"}`
- [ ] `https://yourdomain.com/api/v1/auth/login` — POST hoạt động

---

## 10. Lưu ý quan trọng

### 🔴 Frontend chưa kết nối Backend API

Hiện tại frontend dùng **localStorage** cho tất cả data. Backend API đã viết xong nhưng chưa có API adapter layer ở frontend. Nghĩa là:
- Frontend vẫn chạy bình thường (demo mode)
- Data chỉ lưu trên browser, không đồng bộ giữa các thiết bị
- **Task cần làm:** Viết API adapter thay thế localStorage services bằng `fetch()` calls

### 🔴 Không dùng `npm run dev` trên production

- `dev` script dùng `tsx watch` — chậm, không optimize, reload liên tục
- **Luôn dùng:** `npm run build` rồi `npm start` (hoặc PM2)

### 🟡 Database backup

```bash
# Backup thủ công
pg_dump -U nhacam_app cinehome > backup_$(date +%Y%m%d).sql

# Cron job backup hàng ngày (2h sáng)
crontab -e
# Thêm:
0 2 * * * pg_dump -U nhacam_app cinehome | gzip > /home/nhacam/backups/cinehome_$(date +\%Y\%m\%d).sql.gz
```

### 🟡 Update code

```bash
cd ~/xproject-homestay
git pull origin dev-vu

# Rebuild backend
cd backend && npm ci && npm run build
pm2 restart nhacam-backend

# Rebuild frontend
cd ../frontend && npm ci && npm run build
# Nginx tự serve file mới (không cần restart)
```

### 🟡 Monitoring

```bash
# Kiểm tra backend đang chạy
pm2 status

# Xem logs lỗi
pm2 logs nhacam-backend --err --lines 50

# Kiểm tra Nginx
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log

# Kiểm tra PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Disk usage
df -h
```

### 🟡 Firewall (UFW)

```bash
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable
sudo ufw status
# KHÔNG mở port 3001 hoặc 5432 ra ngoài
```
