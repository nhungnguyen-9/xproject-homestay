# Hướng dẫn phát triển — Chốn Cinehome

Tài liệu onboarding dành cho developer mới tham gia dự án.

---

## Mục lục

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Tech Stack](#2-tech-stack)
3. [Yêu cầu môi trường](#3-yêu-cầu-môi-trường)
4. [Cài đặt & Khởi chạy](#4-cài-đặt--khởi-chạy)
5. [Cấu trúc thư mục](#5-cấu-trúc-thư-mục)
6. [Database](#6-database)
7. [API Routes](#7-api-routes)
8. [Xác thực & Phân quyền](#8-xác-thực--phân-quyền)
9. [File Upload](#9-file-upload)
10. [Testing](#10-testing)
11. [Scripts tham khảo](#11-scripts-tham-khảo)
12. [Quy trình phát triển](#12-quy-trình-phát-triển)
13. [Deployment](#13-deployment)
14. [Xử lý sự cố](#14-xử-lý-sự-cố)

---

## 1. Tổng quan dự án

**Chốn Cinehome** là hệ thống quản lý đặt phòng homestay, gồm:

- **Website khách hàng** — Trang chủ, chi nhánh, đặt phòng online, thanh toán VietQR
- **Admin Dashboard** — Lịch phòng, quản lý khách hàng, doanh thu, nhân viên, phân quyền

Cấu trúc monorepo, tách biệt frontend và backend.

---

## 2. Tech Stack

### Frontend

| Thành phần | Công nghệ | Version |
|---|---|---|
| Framework | React | 19.2 |
| Build tool | Vite | 7.2 |
| Routing | React Router | 7.13 |
| Language | TypeScript | 5.9 |
| Styling | Tailwind CSS | 4.1 |
| Component | shadcn/ui + Radix UI | — |
| Animation | Framer Motion | 12 |
| Charts | Recharts | 3.8 |
| Toast | Sonner | 2.0 |
| Validation | Zod | 4.3 |
| Testing | Vitest + jsdom | 4.1 |

### Backend

| Thành phần | Công nghệ | Version |
|---|---|---|
| Runtime | Node.js | 20 |
| Framework | Hono | 4.7 |
| Language | TypeScript | 5.7 |
| ORM | Drizzle ORM | 0.39 |
| Database | PostgreSQL | 15 |
| Auth | JWT (jsonwebtoken) | 9.0 |
| Password | bcryptjs | 2.4 |
| Validation | Zod | 3.24 |
| Testing | Vitest | 4.1 |

---

## 3. Yêu cầu môi trường

- **Node.js** >= 20
- **PostgreSQL** >= 15 (hoặc Docker)
- **Git**
- **npm** >= 10

---

## 4. Cài đặt & Khởi chạy

### Cách 1: Chạy thủ công (local)

#### 1. Clone repo

```bash
git clone <repo-url>
cd xproject-homestay
```

#### 2. Cài đặt Backend

```bash
cd backend
npm install
cp .env.example .env   # chỉnh sửa các giá trị phù hợp
```

Nội dung `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/cinehome
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

Tạo database và chạy migration:

```bash
npm run db:migrate
npm run db:seed-admin   # Tạo tài khoản admin mặc định (an toàn, chạy nhiều lần được)
npm run db:seed         # (Tuỳ chọn) Nạp dữ liệu demo — CẢNH BÁO: xóa toàn bộ data hiện có
```

Khởi động backend:

```bash
npm run dev   # → http://localhost:3001
```

#### 3. Cài đặt Frontend

```bash
cd frontend
npm install
```

Tạo file `.env` (tuỳ chọn, có giá trị mặc định):

```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_BANK_ID=MB
VITE_BANK_ACCOUNT=0123456789
VITE_ACCOUNT_NAME=CHON CINEHOME
```

Khởi động frontend:

```bash
npm run dev   # → http://localhost:5173
```

---

### Cách 2: Docker Compose

```bash
docker compose up --build
```

| Service | Port | Mô tả |
|---|---|---|
| frontend | 8080 | React SPA (Nginx) |
| backend | 3001 | Hono API Server |
| db | 5432 | PostgreSQL 15 |

Sau khi container khởi động, tạo tài khoản admin:

```bash
docker compose exec backend npm run db:seed-admin
```

---

### Tài khoản mặc định

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | Admin (toàn quyền) |
| `staff` | `staff123` | Staff (chỉ lịch phòng) |

> Đổi mật khẩu trước khi deploy production.

---

## 5. Cấu trúc thư mục

```
xproject-homestay/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/                  # Dashboard: booking, customer, staff, revenue...
│   │   │   ├── auth/                   # LoginPage, ProtectedRoute
│   │   │   ├── booking-calendar-form/  # Form đặt phòng đa bước (Step1–3)
│   │   │   ├── layouts/                # AdminLayout, Sidebar, admin-pages
│   │   │   ├── rooms/                  # Room detail, room list
│   │   │   ├── locations/              # Chi nhánh, điểm đến
│   │   │   ├── home/                   # Trang chủ
│   │   │   └── ui/                     # shadcn/ui components
│   │   ├── services/
│   │   │   ├── apiClient.ts            # Fetch wrapper + auto token refresh
│   │   │   ├── authService.ts          # JWT login/logout/refresh/canPerform
│   │   │   ├── bookingService.ts       # Booking CRUD (localStorage fallback)
│   │   │   ├── customerService.ts      # Customer CRUD + API lookup by phone
│   │   │   ├── roomService.ts          # Room images upload/delete/replace
│   │   │   ├── userService.ts          # Staff management
│   │   │   └── ...
│   │   ├── types/
│   │   │   ├── auth.ts                 # User, JwtPayload
│   │   │   ├── customer.ts             # Customer, CustomerLookup
│   │   │   └── schedule.ts             # Booking, Room, BookingFormData
│   │   ├── utils/
│   │   │   └── helpers.ts              # formatPrice, calculateDuration, calculateBookingPrice
│   │   ├── data/                       # Demo/mock data (local fallback)
│   │   └── main.tsx                    # Entry point + React Router config
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts                  # Zod env validation (fail-fast khi thiếu biến)
│   │   │   └── database.ts             # Drizzle + postgres connection
│   │   ├── db/
│   │   │   ├── schema/                 # 10 Drizzle table definitions
│   │   │   ├── migrations/             # 3 SQL migration files
│   │   │   ├── seed.ts                 # Full seed — xóa + nạp lại toàn bộ data demo
│   │   │   └── seed-admin.ts           # Chỉ tạo admin nếu chưa có (idempotent)
│   │   ├── middleware/
│   │   │   ├── auth.ts                 # JWT Bearer token verification
│   │   │   ├── rbac.ts                 # requirePermission, adminOnly
│   │   │   ├── errorHandler.ts         # Global error handler
│   │   │   └── rateLimiter.ts          # Rate limiting
│   │   ├── routes/                     # 11 route modules
│   │   ├── services/                   # Business logic
│   │   ├── validators/                 # Zod request schemas
│   │   └── utils/                      # phone.ts, price.ts, time.ts
│   ├── uploads/
│   │   ├── rooms/                      # Ảnh phòng
│   │   └── customers/                  # Ảnh CCCD theo từng khách ({customerId}/)
│   └── .env.example
│
├── docs/                               # Tài liệu dự án
├── scripts/                            # Shell scripts deployment
└── docker-compose.yml
```

---

## 6. Database

### Bảng chính

#### `users` — Tài khoản admin/staff

| Column | Type | Ghi chú |
|---|---|---|
| id | text (nanoid) | PK |
| username | text UNIQUE | Tên đăng nhập |
| password_hash | text | bcrypt 12 rounds |
| role | text | `admin` \| `staff` |
| display_name | text | Tên hiển thị |
| permissions | jsonb `string[]` | Mảng quyền của staff |
| is_active | boolean | Trạng thái tài khoản |

#### `bookings` — Đặt phòng

| Column | Type | Ghi chú |
|---|---|---|
| id | text | PK |
| room_id | text FK | Phòng |
| customer_id | text FK | Khách hàng (nullable) |
| date | text | YYYY-MM-DD |
| start_time / end_time | text | HH:MM |
| mode | text | `hourly` \| `daily` \| `overnight` |
| status | text | `pending` \| `confirmed` \| `checked-in` \| `checked-out` \| `cancelled` |
| category | text | `guest` \| `internal` |
| food_items | jsonb | Đồ ăn kèm |
| total_price | numeric | Tổng tiền |

#### `customers` — Khách hàng

| Column | Type | Ghi chú |
|---|---|---|
| id | text (nanoid) | PK |
| phone | text UNIQUE | **Khóa định danh duy nhất** |
| name | text | Họ tên |
| note | text | Ghi chú nội bộ |
| id_image_urls | jsonb `string[]` | URL ảnh CCCD đã upload |

#### `rooms` — Phòng

| Column | Type | Ghi chú |
|---|---|---|
| id | text | PK |
| branch_id | text FK | Chi nhánh |
| type | text | `standard` \| `vip` \| `supervip` |
| hourly_rate | numeric | Giá theo giờ |
| daily_rate | numeric | Giá theo ngày |
| overnight_rate | numeric | Giá qua đêm |
| extra_hour_rate | numeric | Phụ thu quá giờ |

### Giá phòng mặc định

| Hạng | Theo giờ | Theo ngày | Qua đêm | Phụ thu/giờ |
|---|---|---|---|---|
| Standard | 169.000đ | 450.000đ | 350.000đ | 40.000đ |
| VIP | 210.000đ | 550.000đ | 450.000đ | 50.000đ |
| Super VIP | 269.000đ | 650.000đ | 550.000đ | 60.000đ |

### Migrations

```bash
npm run db:generate   # Sinh migration từ thay đổi schema
npm run db:migrate    # Áp dụng migration lên DB
npm run db:studio     # Mở Drizzle Studio (UI xem/sửa DB)
```

> **Không dùng `db:push`** khi DB đang có data thật — có thể bị yêu cầu truncate tables.
>
> Nếu migration bị lỗi "relation already exists": chạy `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` thủ công.

---

## 7. API Routes

**Base URL:** `http://localhost:3001/api/v1`
**Static files:** `http://localhost:3001/uploads/*` (public)
**Health check:** `GET /health`

### Auth — `/auth`

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/auth/login` | Đăng nhập → access + refresh token | Public |
| POST | `/auth/refresh` | Làm mới access token | Public |
| POST | `/auth/logout` | Đăng xuất | Required |
| GET | `/auth/me` | Thông tin user hiện tại | Required |

### Bookings — `/bookings`

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/bookings` | Danh sách (lọc: date, roomId, status) | Required |
| GET | `/bookings/check-overlap` | Kiểm tra trùng lịch | Required |
| GET | `/bookings/:id` | Chi tiết | Required |
| POST | `/bookings` | Tạo mới | Required |
| PUT | `/bookings/:id` | Cập nhật | Admin only |
| DELETE | `/bookings/:id` | Hủy | Admin only |
| POST | `/bookings/:id/status` | Đổi trạng thái | Required |

### Customers — `/customers`

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/customers/by-phone/:phone` | Tra cứu theo SĐT (booking form) | **Public** |
| GET | `/customers` | Danh sách (search, pagination, stats) | `customers` |
| GET | `/customers/:id` | Chi tiết | `customers` |
| GET | `/customers/:id/stats` | Thống kê chi tiêu | `customers` |
| POST | `/customers` | Tạo mới | `customers` |
| PUT | `/customers/:id` | Cập nhật | Admin only |
| POST | `/customers/:id/id-images` | Upload ảnh CCCD (multipart, field: `images`) | `customers` |
| DELETE | `/customers/:id/id-images/:filename` | Xóa ảnh CCCD | Admin only |

### Rooms — `/rooms`

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/rooms` | Danh sách | **Public** |
| GET | `/rooms/:id` | Chi tiết | **Public** |
| POST | `/rooms/:id/images` | Upload ảnh phòng | Admin only |
| DELETE | `/rooms/:id/images` | Xóa ảnh phòng | Admin only |
| PUT | `/rooms/:id/images/replace` | Thay thế ảnh | Admin only |

### Users/Staff — `/users`

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/users` | Danh sách staff | Admin only |
| POST | `/users` | Tạo tài khoản | Admin only |
| PUT | `/users/:id` | Cập nhật | Admin only |
| PUT | `/users/:id/toggle-active` | Bật/tắt tài khoản | Admin only |
| DELETE | `/users/:id` | Xóa | Admin only |

### Routes khác

| Prefix | Mô tả |
|---|---|
| `/revenue` | Tổng quan doanh thu, tỷ lệ lấp đầy phòng |
| `/promos` | CRUD mã khuyến mãi + validate/apply |
| `/telegram` | Cấu hình bot Telegram thông báo |
| `/food-items` | Menu đồ ăn/uống |
| `/branches` | Chi nhánh |

---

## 8. Xác thực & Phân quyền

### JWT Flow

```
POST /auth/login
  → access token (15 phút) + refresh token (7 ngày)
        ↓
  Request với: Authorization: Bearer <access_token>
        ↓
  401 "expired" → apiClient.ts tự động gọi /auth/refresh
        ↓
  401 khác → clearAuth() → redirect /admin/login
```

### Roles & Permissions

| Role | Quyền |
|---|---|
| `admin` | Toàn quyền — bypass tất cả permission check |
| `staff` | Chỉ truy cập module được cấp trong `permissions[]` |

**Permission keys:**

| Key | Module admin dashboard |
|---|---|
| `bookings` | Lịch phòng (mặc định cho staff mới) |
| `customers` | Khách hàng |
| `revenue` | Tổng quan doanh thu |
| `promos` | Khuyến mãi |
| `rooms` | Quản lý phòng |
| `telegram` | Cấu hình Telegram |
| `settings` | Cài đặt |

### Dùng trong middleware backend

```typescript
// Yêu cầu đăng nhập
router.use('*', authMiddleware);

// Chỉ admin
router.delete('/:id', adminOnly, handler);

// Cần quyền module cụ thể
router.get('/', requirePermission('customers'), handler);
```

### Kiểm tra quyền trong frontend

```typescript
// authService.ts
canPerform('rooms')   // true nếu admin hoặc có quyền 'rooms'
getRole()             // 'admin' | 'staff'
```

---

## 9. File Upload

### Thư mục lưu trữ

```
backend/uploads/
├── rooms/                          # Ảnh phòng
│   └── {roomId}-{timestamp}-{n}.jpg
└── customers/
    └── {customerId}/               # Ảnh CCCD theo từng khách
        └── {customerId}-{timestamp}-{n}.jpg
```

Tất cả file trong `uploads/` được serve công khai tại `/uploads/*`.

### Giới hạn

| Loại | Max size | Định dạng |
|---|---|---|
| Ảnh phòng | 2 MB | JPEG, PNG, WebP |
| Ảnh CCCD | 5 MB | JPEG, PNG, WebP |

Backend validate bằng **magic bytes** (không chỉ Content-Type header) để chống file giả mạo.

### Upload từ frontend

```typescript
// Ảnh phòng
const form = new FormData();
files.forEach(f => form.append('images', f));
await apiFetch(`/rooms/${roomId}/images`, { method: 'POST', body: form });

// Ảnh CCCD khách hàng
await customerService.uploadIdImages(customerId, files);
```

---

## 10. Testing

### Chạy test

```bash
# Watch mode
npm run test

# Chạy một lần
npm run test:run

# Coverage report
npm run test:coverage   # (frontend only)
```

### Test files hiện có

**Frontend** (`src/`)
- `services/bookingService.test.ts`
- `services/promoService.test.ts`
- `utils/helpers.test.ts`

**Backend** (`src/`)
- `utils/time.test.ts`
- `utils/phone.test.ts`
- `utils/price.test.ts`

### Quy ước

- Đặt file test cạnh file nguồn: `helpers.ts` → `helpers.test.ts`
- Frontend: test service logic và pure utils (không test component)
- Backend: test pure functions — không mock DB, không integration test

---

## 11. Scripts tham khảo

### Frontend

```bash
npm run dev             # Dev server (port 5173)
npm run build           # Build production
npm run preview         # Preview build production
npm run lint            # ESLint check
npm run test            # Vitest watch mode
npm run test:run        # Vitest single run
npm run test:coverage   # Coverage report
```

### Backend

```bash
npm run dev             # Dev server tsx watch (port 3001)
npm run build           # Compile TypeScript → dist/
npm run start           # Chạy bản build production

npm run db:generate     # Sinh migration từ schema thay đổi
npm run db:migrate      # Áp dụng migration lên DB
npm run db:studio       # Drizzle Studio — UI xem/sửa DB
npm run db:seed         # Nạp toàn bộ dữ liệu demo (XÓA data cũ)
npm run db:seed-admin   # Chỉ tạo admin nếu chưa tồn tại (an toàn)

npm run test            # Vitest watch mode
npm run test:run        # Vitest single run
```

---

## 12. Quy trình phát triển

### Thêm API endpoint mới

1. Tạo/cập nhật Zod schema trong `backend/src/validators/`
2. Thêm business logic vào `backend/src/services/`
3. Thêm route handler vào `backend/src/routes/`
4. Đăng ký route trong `backend/src/routes/index.ts`
5. Thêm service call trong `frontend/src/services/`

### Thêm bảng DB mới

1. Tạo schema file trong `backend/src/db/schema/`
2. Export từ `backend/src/db/schema/index.ts`
3. `npm run db:generate` → tạo file migration
4. `npm run db:migrate` → áp dụng lên DB

### Thêm tính năng Admin

1. Tạo component trong `frontend/src/components/admin/`
2. Thêm route trong `frontend/src/main.tsx`
3. Thêm menu item vào `sidebar.tsx` với `permission` key tương ứng
4. Thêm permission key vào `VALID_PERMISSIONS` trong `staff-management.tsx`

### Quy ước code

- **Chú thích:** JSDoc tiếng Việt cho tất cả function và component export
- **Naming:** `camelCase` cho function/variable, `PascalCase` cho component/type/interface
- **Import paths:** absolute (`@/components/...`) cho frontend
- **Error backend:** throw `new AppError(statusCode, 'message')` trong service

### Commit message

```
feat: thêm tính năng X
fix: sửa lỗi Y
ui: cập nhật giao diện Z
refactor: cải thiện logic W
docs: cập nhật tài liệu
```

---

## 13. Deployment

### Docker Compose

```bash
docker compose up --build -d
docker compose logs -f backend
docker compose down
```

### Biến môi trường production

```env
# Backend
JWT_SECRET=<random-32-chars-minimum>
JWT_REFRESH_SECRET=<random-32-chars-minimum>
DATABASE_URL=postgresql://user:pass@db:5432/cinehome
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com

# Frontend (build-time args)
VITE_API_URL=https://api.yourdomain.com/api/v1
VITE_BANK_ACCOUNT=<số tài khoản thật>
VITE_ACCOUNT_NAME=<tên tài khoản thật>
```

### VPS (Ubuntu 22.04)

Xem hướng dẫn đầy đủ: `docs/VPS-DEPLOYMENT-GUIDE.md`

Tóm tắt quy trình:
1. Cài Docker + Docker Compose trên VPS
2. Clone repo, cấu hình `.env` production
3. `docker compose up --build -d`
4. Cấu hình Nginx reverse proxy
5. Cài SSL với Certbot

---

## 14. Xử lý sự cố

### Backend không kết nối được DB

```bash
# Kiểm tra PostgreSQL đang chạy
pg_isready -h localhost -p 5432

# Test kết nối thủ công
psql "$DATABASE_URL" -c "SELECT 1"
```

### Migration lỗi "relation already exists"

DB đã có schema cũ. Không chạy lại migration — thêm cột thủ công:

```sql
ALTER TABLE ten_bang ADD COLUMN IF NOT EXISTS ten_cot text;
```

### Frontend không gọi được API (CORS)

1. Kiểm tra `VITE_API_URL` trong `frontend/.env`
2. `CORS_ORIGIN` trong `backend/.env` phải khớp với origin frontend (bao gồm port)
3. Test backend đang chạy: `curl http://localhost:3001/health`

### Token hết hạn liên tục

`apiClient.ts` tự refresh khi nhận `401 "expired"`. Nếu vẫn bị logout:
- `JWT_SECRET` / `JWT_REFRESH_SECRET` phải cố định giữa các lần restart (không dùng random mỗi lần)
- Kiểm tra đồng hồ hệ thống — lệch giờ khiến JWT verify fail

### Upload ảnh thất bại

```bash
# Kiểm tra thư mục tồn tại và có quyền ghi
ls -la backend/uploads/
mkdir -p backend/uploads/rooms backend/uploads/customers
```

---

*Cập nhật lần cuối: 2026-04-01*
