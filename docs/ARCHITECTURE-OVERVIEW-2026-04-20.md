# Tài liệu Kiến trúc Tổng quan — xproject-homestay

**Ngày:** 2026-04-20
**Branch:** `dev-nhung`
**Tác giả:** Software Engineer Lead (homestay-dev-team)
**Commit mới nhất:** `ec28316` (Delete .gitignore)

---

## 1. Tổng quan dự án

**Nhà Cam Homestay** — Ứng dụng đặt phòng homestay tiếng Việt, gồm:
- **Frontend** (SPA React 19): Trang công khai cho khách + Dashboard quản trị
- **Backend** (Hono + PostgreSQL): REST API `/api/v1`
- **Infra**: Docker Compose + Nginx reverse proxy, CI/CD GitHub Actions

Mục tiêu: Thay thế dần localStorage của frontend bằng REST API thực tế, tạo hệ thống multi-user có quản lý booking, phòng, khách, khuyến mãi, doanh thu và thông báo Telegram.

---

## 2. Cấu trúc thư mục gốc

```
xproject-homestay/
├── frontend/            # React 19 + Vite 7 + TypeScript SPA
├── backend/             # Hono 4 + Drizzle + PostgreSQL REST API
├── docs/                # Tài liệu kỹ thuật (BA, Session Reports, VPS Guide, FE-Customer-API-Guide)
├── docker-compose.yml   # Orchestrate FE + BE + PG
├── scripts/             # Deploy & utility scripts
└── .github/workflows/   # CI/CD auto deploy
```

---

## 3. Frontend — chi tiết

### 3.1 Tech stack
| Hạng mục | Công nghệ |
|---|---|
| Framework | React 19.2 + React Router 7.13 |
| Build | Vite 7.2 + React Compiler (babel-plugin-react-compiler) |
| Ngôn ngữ | TypeScript 5.9 |
| Styling | Tailwind CSS 4.1 + shadcn/ui (New York) + Radix UI |
| Charts | Recharts 3.8 |
| Animation | Framer Motion 12.29, tsparticles |
| Validation | Zod 4.3 |
| Toast | Sonner 2.0 |
| Icon | Lucide React |
| Test | Vitest 4.1 + Testing Library |

### 3.2 Routes (verified từ `src/main.tsx`)

**Public** (layout = Header + Footer):
| Path | Component | Ghi chú |
|---|---|---|
| `/` | `Home` | Hero + gallery |
| `/phong-nghi` | `RestRoomPage` | Danh sách phòng |
| `/phong-nghi/:id` | `RoomDetailRoute` | Chi tiết phòng |
| `/dat-phong` | `BookingPage` | Form đặt phòng |
| `/thu-vien-anh` | `ImageLibraryPage` | Thư viện ảnh |
| `/huong-dan` | `InstructionPage` | Hướng dẫn |
| `/chinh-sach` | `ComingSoonPage` | Chính sách (placeholder) |

**Auth:** `/admin/login` → `LoginPage`

**Admin** (layout = `AdminLayout`, bảo vệ bởi `ProtectedRoute`):
| Path | Component | Quyền |
|---|---|---|
| `/admin` | `RevenueDashboard` | admin |
| `/admin/bookings` | `BookingSchedule` | admin + staff |
| `/admin/customers` | `CustomerList` | admin |
| `/admin/customers/:id` | `CustomerDetailRoute` | admin |
| `/admin/promos` | `PromoManager` | admin |
| `/admin/telegram` | `TelegramConfig` | admin |
| `/admin/settings` | `AdminSettingsPage` | admin |
| `/admin/management` | `RoomManagement` | admin |
| `/admin/branches` | `BranchManagement` | admin (**mới**) |
| `/admin/staff` | `StaffManagement` | admin + RBAC |

### 3.3 Services layer — trạng thái API migration

| Service | LOC | Trạng thái | Ghi chú |
|---|---|---|---|
| `roomService.ts` | 114 | ✅ 100% API | Chuẩn vàng để tham khảo |
| `userService.ts` | 42 | ✅ 100% API | Staff CRUD + RBAC |
| `telegramService.ts` | 171 | ✅ 100% API | Config, templates, test |
| `branchService.ts` | — | ✅ API | Mới bổ sung |
| `customerService.ts` | 203 | ⚠️ 60% API | Lookup theo SĐT + upload CCCD đã qua API, CRUD vẫn localStorage |
| `authService.ts` | — | ⚠️ localStorage | JWT trong localStorage |
| `bookingService.ts` | — | ❌ **localStorage** | Init từ `demoBookings` |
| `promoService.ts` | 192 | ❌ **localStorage** | Init từ `demoPromos` |
| `revenueService.ts` | 321 | ❌ **localStorage** | Đọc bookings + customers từ memory |

> Xác nhận qua `head frontend/src/services/bookingService.ts` và `revenueService.ts` — đều vẫn dùng `localStorage.setItem/getItem`.

### 3.4 API Client (`services/apiClient.ts`)
- `apiFetch<T>(endpoint, options)` — tự động inject `Bearer token`, refresh khi 401
- `skipAuth: true` cho endpoint công khai
- `ApiError` class có HTTP status
- Base URL: `VITE_API_URL` (mặc định `http://localhost:3001/api/v1`)

---

## 4. Backend — chi tiết

### 4.1 Tech stack
| Hạng mục | Công nghệ |
|---|---|
| Runtime | Node.js 22+ với `tsx` |
| Framework | Hono 4.7 (TypeScript-first, ~14KB) |
| ORM | Drizzle 0.39 + `postgres.js` 3.4 |
| Database | PostgreSQL (`cinehome`, port 5432) |
| Auth | JWT (access 15min + refresh 7d) + bcryptjs (salt=12) |
| Validation | Zod 3.24 + `@hono/zod-validator` |
| ID | nanoid 5.1 |
| Upload | `/uploads/` static served |
| Test | Vitest 4.1 |

### 4.2 API Routes (`backend/src/routes/`)

Base: `/api/v1`, mount tại `app.ts`:

| Module | File (LOC) | Endpoint nổi bật | Auth |
|---|---|---|---|
| `auth` | `auth.ts` (64) | login, refresh, logout, me | public + /me auth |
| `bookings` | `bookings.ts` (78) | CRUD, overlap check, status machine | auth |
| `rooms` | `rooms.ts` (202) | CRUD + image upload/delete/reorder/replace, soft-delete | GET công khai, khác auth |
| `customers` | `customers.ts` (109) | CRUD, phone lookup, CCCD upload, stats | auth |
| `promos` | `promos.ts` (60) | CRUD, validate, apply (atomic `usedCount++`) | auth |
| `revenue` | `revenue.ts` (44) | summary, daily, occupancy, top-customers | admin |
| `telegram` | `telegram.ts` (66) | config, templates, test, log | auth |
| `food-items` | `foodItems.ts` (50) | CRUD (thiếu GET by id) | auth |
| `branches` | `branches.ts` (113) | CRUD (không có delete) | auth |
| `users` | `users.ts` (45) | Staff CRUD + RBAC granular | admin |

Health: `GET /health` (no auth)

### 4.3 Database schema (`backend/src/db/schema/`)
10 bảng: `users`, `branches`, `rooms`, `customers`, `bookings`, `promos`, `foodItems`, `telegram`, `notificationLog`, + liên kết.

Migrations (**5 files, không phải 1 như memory cũ ghi**):
```
0000_motionless_molten_man.sql
0001_chunky_loners.sql
0002_pink_nemesis.sql
0003_smiling_terror.sql
0004_even_clea.sql
```

### 4.4 Middleware & Pattern
- CORS: cấu hình qua `env.CORS_ORIGIN`
- `logger()` toàn cục
- `errorHandler.ts` centralized
- RBAC: admin bypass all, staff check từng permission

### 4.5 Design decisions quan trọng
- **Booking status machine**: `pending → confirmed → checked-in → checked-out` (mọi trạng thái → `cancelled`)
- **Booking delete = soft cancel**, **Room delete = soft `is_active=false`**
- **Auto-create customer** từ SĐT guest khi tạo booking
- **Promo auto-expire** trên mỗi read, `usedCount++` atomic qua SQL UPDATE
- **Telegram**: gọi HTTP Bot API thật (không còn simulate như trước)
- `utils/price.ts` tồn tại nhưng CHƯA dùng (client gửi price)

### 4.6 Default credentials
- `admin / admin123`
- `staff / staff123`
- Script: `backend/src/db/seed-admin.ts`

---

## 5. Infra & Deployment

- **docker-compose.yml** tại root — orchestrate FE + BE + PG
- **Dockerfile** ở cả frontend và backend
- **Nginx** reverse proxy: `frontend/nginx.conf`
- **CI/CD**: `.github/workflows/deploy.yml` — SSH-based auto deploy
- **VPS guide**: `docs/VPS-DEPLOYMENT-GUIDE.md`

---

## 6. Đánh giá trạng thái hoàn thành

### Ước lượng tổng thể: **~75%**

| Tầng | % hoàn thành | Ghi chú |
|---|---|---|
| Backend API | **95%** | 10 module routes + 11 services, schema + migrations đủ. Thiếu: token blacklist, price server-side, food-items GET by id |
| Database schema | **100%** | 10 bảng, 5 migrations, FK/indexes/constraints đầy đủ |
| Frontend Public UI | **85%** | Đủ trang chính, còn `/chinh-sach` placeholder |
| Frontend Admin UI | **90%** | Đủ 10 module admin, có RBAC, có branch management |
| **FE↔BE integration** | **~55%** | `rooms`, `users`, `telegram`, `branches`, customer-partial đã API. `bookings`, `promos`, `revenue`, `auth persist`, `customer CRUD` còn localStorage |
| Infra & Deploy | **90%** | Docker + CI/CD + VPS guide xong, chưa run db:push/db:seed trên VPS |
| Testing | **~20%** | Có `bookingService.test.ts`, `promoService.test.ts` ở FE; BE có `vitest.config.ts` nhưng chưa thấy test file |

### Công việc còn thiếu (ưu tiên cao → thấp)

1. **[FE] Migrate `bookingService`** → POST/PUT/DELETE `/api/v1/bookings`
2. **[FE] Migrate `promoService.validate`** → `/api/v1/promos/validate`
3. **[FE] Migrate `customerService` CRUD** hoàn chỉnh (getAll, getById, create, update)
4. **[FE] Connect `revenueService`** → `GET /api/v1/revenue/summary`
5. **[FE] Kết nối BookingModal** công khai với API (hiện vẫn tạo booking trong localStorage)
6. **[FE] Xoá** `demoBookings` / `demoCustomers` / `demoPromos` khỏi init
7. **[BE] Wire Telegram notify()** vào booking status transitions
8. **[BE] Food-items** thêm `GET /:id`
9. **[BE] Token blacklist / revocation** (logout hiện chỉ client-side)
10. **[BE] Server-side price** (dùng `utils/price.ts`)
11. **[Infra] Chạy db:push + db:seed** trên VPS production
12. **[Test] Viết test backend** (vitest config đã có nhưng chưa có file)

---

## 7. Rủi ro & khuyến nghị kiến trúc

| Rủi ro | Mức | Khuyến nghị |
|---|---|---|
| **localStorage drift** giữa máy user — dữ liệu booking/promo không đồng bộ | 🔴 Cao | Ưu tiên migrate `bookingService` và `promoService` trước mọi việc khác |
| **Token không revoke** — nhân viên nghỉ việc vẫn login được đến khi token hết hạn | 🟡 Trung | Thêm bảng `token_blacklist` hoặc chuyển sang session store |
| **Price client-side** — khách hàng có thể sửa request bypass promo | 🔴 Cao | Bật `utils/price.ts` ở server, bỏ `totalPrice` từ client |
| **Chưa có integration test backend** | 🟡 Trung | Viết test cho `bookingService` (overlap logic) và `promoService` (atomic increment) |
| **Memory drift** — memory file project đã 26 ngày, routes đã thay đổi | 🟢 Thấp | Cập nhật memory sau session này |

---

## 8. Kết luận

Dự án ở trạng thái **beta sẵn sàng**: backend hoàn chỉnh về mặt code, frontend có đầy đủ UI. Bottleneck chính hiện tại là **migration layer từ localStorage sang API** cho các service `booking`, `promo`, `revenue`, và phần còn lại của `customer`. Sau khi hoàn tất, hệ thống có thể lên production.

**Khuyến nghị tiếp theo** cho team-lead: phân công song song
- `senior-frontend`: migrate `bookingService` + kết nối `BookingModal` công khai
- `senior-backend`: wire Telegram notify + server-side price + food-items GET by id
- `senior-database`: chạy db:push + db:seed trên staging/VPS, chuẩn bị backup plan
