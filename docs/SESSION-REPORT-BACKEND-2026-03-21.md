# Phiên làm việc 21/03/2026 — Backend & Database Implementation

## Người thực hiện
- **TAV** (Lead/Architect) + **Claude Opus 4.6** (AI Executioner)
- Branch: `dev-vu`
- Thời gian: ~1 phiên (orchestrated parallel agents)

---

## Bối cảnh

Phiên trước (20-21/03) đã hoàn thành **frontend Admin Dashboard** gồm 5 module (Booking Schedule, Customer Management, Promo Engine, Telegram Notifications, Revenue Dashboard) — tổng cộng 24 files mới, 4,262 dòng code, tất cả dùng localStorage.

Phiên này triển khai **toàn bộ backend API + database** để thay thế localStorage, phục vụ multi-user, persistence, và chuẩn bị tích hợp thật (Telegram Bot API, payment webhook).

---

## Mục tiêu phiên

Implement đầy đủ kế hoạch backend gồm 4 Sprints:
1. **Sprint 1 — Foundation:** Project scaffold, database schema, auth module
2. **Sprint 2 — Core Business:** Rooms, Bookings, Customers, Food Items API
3. **Sprint 3 — Extended:** Promo Codes, Revenue, Branches API
4. **Sprint 4 — Integration:** Telegram API, route assembly, TypeScript verification

---

## Kết quả đạt được

### Tổng quan
- **50 files** tạo mới (47 source + 3 migration/config)
- **TypeScript:** 0 errors
- **Drizzle migration:** Generated thành công (10 tables, 4 FK, 9 indexes, 2 check constraints)
- **npm install:** Thành công, tất cả dependencies đã cài

### Thực thi song song (GEMINI-Architect pattern)
Sử dụng 5 sub-agents parallel cho Sprint 1, sau đó 5 agents parallel cho Sprint 2-4:
```
Sprint 1 (5 agents parallel, worktree isolation):
  Agent 1: Project scaffold + config
  Agent 2: Database schemas (10 Drizzle tables)
  Agent 3: Auth module + middleware
  Agent 4: Validators + utils + types
  Agent 5: Seed script

Sprint 2-4 (5 agents parallel):
  Agent 6: Rooms + Branches APIs
  Agent 7: Bookings API + overlap logic
  Agent 8: Customers + Food Items APIs
  Agent 9: Promos + Revenue APIs
  Agent 10: Telegram API + Bot integration
```

Sau agents: fix 10 TS errors (JWT type casting, Hono context typing, param narrowing), tạo route index, generate migration.

---

## Tech Stack đã chọn

| Layer | Chọn | Lý do |
|-------|------|-------|
| Runtime | Node.js 22+ | Team quen TypeScript |
| Framework | Hono | TypeScript-first, 14KB, tích hợp Zod |
| ORM | Drizzle ORM | SQL-like, nhẹ hơn Prisma, migration tốt |
| Database | PostgreSQL | JSONB, concurrent, free tier available |
| Auth | JWT (access 15m + refresh 7d) | Stateless, phù hợp SPA |
| Password | bcryptjs (salt=12) | Industry standard |
| Validation | Zod 3 | Shared schemas với frontend |
| ID | nanoid | Compact, URL-safe |

---

## Database Schema (10 tables)

```
branches 1──N rooms 1──N bookings N──1 customers
                                  N──1 users (createdBy)
promo_codes (standalone, linked via voucher text)
food_items (standalone, snapshot trong bookings.food_items JSONB)
telegram_config (singleton)
notification_templates + notification_log (standalone)
```

### Chi tiết tables

| Table | Columns | Indexes | FKs | Notes |
|-------|---------|---------|-----|-------|
| branches | 7 | 0 | 0 | Cần Thơ, TP.HCM |
| rooms | 15 | 2 (branch, type) | 1 (→branches) | 6 rooms, giá theo type |
| customers | 7 | 1 (phone unique) | 0 | Phone normalized |
| users | 8 | 0 | 0 | admin + staff |
| bookings | 21 | 4 (room+date, date, customer, status) | 3 (→rooms, →customers, →users) | CHECK status, CHECK category |
| promo_codes | 12 | 1 (code unique) | 0 | Auto-expire logic |
| food_items | 7 | 0 | 0 | 6 items + 3 combos |
| telegram_config | 5 | 0 | 0 | Singleton id='default' |
| notification_templates | 5 | 0 | 0 | 3 event types |
| notification_log | 8 | 1 (timestamp) | 0 | Notification history |

---

## API Routes (`/api/v1`)

### Auth (`/auth`)
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | /login | No | - | Đăng nhập → accessToken + refreshToken + user |
| POST | /refresh | No | - | Refresh access token |
| POST | /logout | No | - | Stateless logout |
| GET | /me | Yes | Any | Thông tin user hiện tại |

### Rooms (`/rooms`)
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | / | Yes | Any | Danh sách phòng (?branchId, ?type) |
| GET | /:id | Yes | Any | Chi tiết phòng |
| POST | / | Yes | Admin | Tạo phòng mới |
| PUT | /:id | Yes | Admin | Sửa phòng |
| DELETE | /:id | Yes | Admin | Soft delete (isActive=false) |

### Bookings (`/bookings`)
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | / | Yes | Any | Danh sách (?date, ?roomId, ?status, ?page, ?limit) |
| GET | /check-overlap | Yes | Any | Kiểm tra xung đột (?roomId, ?date, ?startTime, ?endTime) |
| GET | /:id | Yes | Any | Chi tiết booking |
| POST | / | Yes | Any* | Tạo booking (validate overlap, auto-create customer) |
| PUT | /:id | Yes | Admin | Sửa booking |
| DELETE | /:id | Yes | Admin | Hủy booking (status→cancelled) |
| POST | /:id/status | Yes | Any | Chuyển trạng thái |

*Staff không thể tạo internal bookings

### Customers (`/customers`)
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | / | Yes | Any | Danh sách (?search, ?stats=true) |
| GET | /:id | Yes | Any | Chi tiết khách |
| GET | /:id/stats | Yes | Any | Stats: totalSpent, visitCount, lastVisit |
| POST | / | Yes | Any | Tạo khách (phone normalized) |
| PUT | /:id | Yes | Admin | Sửa khách |

### Promos (`/promos`)
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | / | Yes | Any | Danh sách (?status) — auto-expire |
| POST | /validate | Yes | Any | Kiểm tra mã KM (code + roomType) |
| POST | /apply | Yes | Any | Áp dụng mã KM → discountAmount + finalTotal |
| GET | /:id | Yes | Any | Chi tiết promo |
| POST | / | Yes | Admin | Tạo mã KM |
| PUT | /:id | Yes | Admin | Sửa mã KM |
| DELETE | /:id | Yes | Admin | Xóa mã KM |

### Revenue (`/revenue`) — Admin only
| Method | Path | Description |
|--------|------|-------------|
| GET | /summary | Tổng doanh thu, số booking, occupancy, avg (?startDate, ?endDate) |
| GET | /daily | Doanh thu theo ngày |
| GET | /occupancy | Tỷ lệ lấp đầy theo phòng |
| GET | /top-customers | Top khách theo chi tiêu (?limit) |

### Telegram (`/telegram`)
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /config | Yes | Any | Lấy config |
| PUT | /config | Yes | Admin | Cập nhật config (botToken, chatId, enabled) |
| GET | /templates | Yes | Any | Danh sách template |
| PUT | /templates/:eventType | Yes | Admin | Sửa template |
| POST | /test | Yes | Admin | Gửi test notification |
| GET | /log | Yes | Any | Notification log (?page, ?limit) |

### Food Items (`/food-items`)
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | / | Yes | Any | Danh sách (?category=item\|combo) |
| POST | / | Yes | Admin | Tạo item |
| PUT | /:id | Yes | Admin | Sửa item |
| DELETE | /:id | Yes | Admin | Xóa item |

### Branches (`/branches`)
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | / | Yes | Any | Danh sách chi nhánh |
| GET | /:id | Yes | Any | Chi tiết chi nhánh |
| POST | / | Yes | Admin | Tạo chi nhánh |
| PUT | /:id | Yes | Admin | Sửa chi nhánh |

---

## Business Rules (Backend enforce)

### 1. Booking Overlap Check
```sql
-- Kiểm tra xung đột thời gian cùng phòng + ngày
SELECT count(*) FROM bookings
WHERE room_id = $roomId AND date = $date AND id != $excludeId
  AND status != 'cancelled'
  AND start_time < $endTime AND end_time > $startTime
```

### 2. Status Transitions
```
pending    → confirmed, cancelled
confirmed  → checked-in, cancelled
checked-in → checked-out
checked-out → (terminal)
cancelled   → (terminal)
```

### 3. Auto-create Customer
Khi tạo guest booking với guestPhone:
1. `normalizePhone(guestPhone)` — bỏ khoảng trắng, +84→0
2. Tìm customer theo phone
3. Nếu chưa có → INSERT customer mới
4. Set `booking.customerId`

### 4. Promo Auto-expire
Khi GET /promos hoặc validate:
```sql
UPDATE promo_codes SET status = 'expired'
WHERE status = 'active'
  AND (end_date < today OR used_count >= max_uses)
```

### 5. Customer Stats (computed, không lưu)
```sql
totalSpent = SUM(total_price) WHERE category='guest' AND customer_id=X
visitCount = COUNT(*) WHERE category='guest' AND status='checked-out' AND customer_id=X
lastVisit  = MAX(date) WHERE category='guest' AND customer_id=X
```

### 6. Revenue Occupancy
```
occupancyRate = (tổng phút booked / tổng phút available) × 100
available = số_phòng × 24h × 60 × số_ngày
```

---

## Files tạo mới (50 files)

### Config & Entry (7 files)
```
backend/package.json              — Dependencies: hono, drizzle-orm, postgres, bcryptjs, jsonwebtoken, nanoid, zod
backend/tsconfig.json             — ES2022, ESNext modules, strict, @/* paths
backend/.env.example              — DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, PORT, CORS_ORIGIN
backend/.env                      — Dev config (gitignored)
backend/.gitignore                — node_modules, dist, .env
backend/drizzle.config.ts         — Schema glob, PostgreSQL dialect
backend/src/index.ts              — @hono/node-server entry point
backend/src/app.ts                — Hono app: CORS, logger, health check, /api/v1 routes, error handler
```

### Config Module (2 files)
```
backend/src/config/env.ts         — Zod-validated env vars, crash on invalid
backend/src/config/database.ts    — Drizzle ORM + postgres.js pool
```

### Database Schema (10 files)
```
backend/src/db/schema/branches.ts
backend/src/db/schema/rooms.ts
backend/src/db/schema/customers.ts
backend/src/db/schema/users.ts
backend/src/db/schema/bookings.ts        — 21 columns, 4 indexes, 3 FKs, 2 CHECKs
backend/src/db/schema/promos.ts
backend/src/db/schema/telegram.ts        — telegramConfig + notificationTemplates
backend/src/db/schema/notificationLog.ts
backend/src/db/schema/foodItems.ts
backend/src/db/schema/index.ts           — Barrel export
```

### Migration (auto-generated)
```
backend/src/db/migrations/0000_motionless_molten_man.sql — 144 lines DDL
backend/src/db/migrations/meta/0000_snapshot.json
backend/src/db/migrations/meta/_journal.json
```

### Seed Script (1 file)
```
backend/src/db/seed.ts — 361 lines, seeds:
  - 2 branches (Cần Thơ, HCM)
  - 6 rooms (3 standard, 2 VIP, 1 SuperVIP) với giá chính xác từ frontend
  - 2 users: admin/admin123, staff/staff123 (bcrypt hashed)
  - 5 customers (matching frontend demo data)
  - 30 bookings (27 guest + 3 internal, matching frontend demo-schedule.ts)
  - 3 promo codes (SUMMER20, VIP50K, TETHOLIDAY)
  - 9 food items (6 đơn + 3 combo)
  - 1 telegram config (disabled)
  - 3 notification templates (new_booking, confirmed, checked_in)
```

### Middleware (3 files)
```
backend/src/middleware/auth.ts         — JWT verification, Bearer token extraction
backend/src/middleware/rbac.ts         — requireRole(), adminOnly shorthand
backend/src/middleware/errorHandler.ts — AppError class + global Hono error handler
```

### Routes (10 files)
```
backend/src/routes/index.ts     — Barrel: 9 route groups mounted under /api/v1
backend/src/routes/auth.ts      — POST login/refresh/logout, GET me
backend/src/routes/rooms.ts     — CRUD + soft delete
backend/src/routes/bookings.ts  — CRUD + check-overlap + status transition
backend/src/routes/customers.ts — CRUD + search + stats
backend/src/routes/promos.ts    — CRUD + validate + apply
backend/src/routes/telegram.ts  — Config + templates + test + log
backend/src/routes/revenue.ts   — Summary + daily + occupancy + top customers
backend/src/routes/foodItems.ts — CRUD + category filter
backend/src/routes/branches.ts  — CRUD
```

### Services (8 files)
```
backend/src/services/authService.ts      — login, refresh, getMe, hashPassword, verifyPassword
backend/src/services/bookingService.ts   — CRUD, overlap check, auto-create customer, status transition
backend/src/services/customerService.ts  — CRUD, search, stats (SQL aggregation)
backend/src/services/roomService.ts      — CRUD, soft delete, filtering
backend/src/services/promoService.ts     — CRUD, validate, applyDiscount, auto-expire
backend/src/services/revenueService.ts   — Summary, daily, occupancy, top customers (all SQL)
backend/src/services/telegramService.ts  — Config, templates, Bot API call, logging
backend/src/services/branchService.ts    — CRUD
backend/src/services/foodItemService.ts  — CRUD, category filter, sort order
```

### Validators (5 files)
```
backend/src/validators/auth.ts     — loginSchema, refreshSchema
backend/src/validators/booking.ts  — create/update/statusTransition/checkOverlap schemas
backend/src/validators/customer.ts — create/update schemas
backend/src/validators/room.ts     — create/update schemas
backend/src/validators/promo.ts    — create/update/validate/apply schemas
```

### Utilities (4 files)
```
backend/src/utils/id.ts    — generateId() using nanoid
backend/src/utils/phone.ts — normalizePhone() (+84→0, remove spaces/dashes)
backend/src/utils/time.ts  — timeToMinutes(), hasTimeOverlap(), durationHours()
backend/src/utils/price.ts — calculatePrice(mode, start, end, config, food, discount)
```

### Types (1 file)
```
backend/src/types/index.ts — RoomType, BookingStatus, BookingCategory, InternalTag, BookingMode, UserRole, STATUS_TRANSITIONS, PaginatedResponse<T>
```

---

## RBAC Permission Matrix

| Action | Admin | Staff |
|--------|-------|-------|
| Xem booking schedule | ✓ | ✓ |
| Tạo guest booking | ✓ | ✓ |
| Tạo internal booking | ✓ | ✗ |
| Sửa booking | ✓ | ✗ |
| Xóa/hủy booking | ✓ | ✗ |
| Đổi status booking | ✓ | ✓ |
| Xem customers | ✓ | ✓ |
| Sửa customers | ✓ | ✗ |
| Quản lý promo codes | ✓ | ✗ |
| Cấu hình Telegram | ✓ | ✗ |
| Xem revenue dashboard | ✓ | ✗ |
| Quản lý rooms/branches | ✓ | ✗ |
| Quản lý food items | ✓ | ✗ |

---

## Seed Data (khớp frontend demo)

| Entity | Count | Source |
|--------|-------|--------|
| Branches | 2 | frontend/src/data/locations.ts |
| Rooms | 6 | frontend/src/data/demo-schedule.ts |
| Users | 2 | Mới (admin/staff) |
| Customers | 5 | frontend/src/data/demo-customers.ts |
| Bookings | 30 | frontend/src/data/demo-schedule.ts (27 guest + 3 internal) |
| Promo Codes | 3 | frontend/src/data/demo-promos.ts |
| Food Items | 9 | frontend/src/types/schedule.ts (FOOD_ITEMS + COMBO_ITEMS) |
| Telegram Config | 1 | Singleton (disabled) |
| Notification Templates | 3 | new_booking, confirmed, checked_in |

### Default Users
| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | admin |
| staff | staff123 | staff |

---

## Trạng thái hiện tại

| Item | Status |
|------|--------|
| Source code | ✅ 50 files, hoàn chỉnh |
| TypeScript | ✅ 0 errors |
| npm install | ✅ Dependencies installed |
| Migration | ✅ Generated (0000_motionless_molten_man.sql) |
| Database | ❌ Chưa setup PostgreSQL |
| db:push | ❌ Chưa chạy (cần PG chạy trước) |
| db:seed | ❌ Chưa chạy |
| Dev server | ❌ Chưa start (cần PG) |
| Frontend adapter | ❌ Chưa tạo (Phase 2 của migration strategy) |
| Feature flag | ❌ VITE_USE_BACKEND chưa implement |
| Git commit | ❌ Chưa commit (backend/ là untracked) |

---

## Hướng dẫn chạy backend

### Bước 1: Setup PostgreSQL
```bash
# Option A: Docker
docker run -d --name cinehome-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=cinehome \
  -p 5432:5432 postgres:16

# Option B: Neon/Supabase free tier
# Copy connection string vào .env
```

### Bước 2: Configure & Run
```bash
cd backend
cp .env.example .env
# Sửa DATABASE_URL nếu cần

npm run db:push        # Tạo tables
npm run db:seed        # Seed demo data
npm run dev            # Start server (tsx watch)
```

### Bước 3: Verify
```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}'

# Lấy bookings (dùng token từ login response)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/bookings?date=2026-03-20

# Health check
curl http://localhost:3000/health
```

---

## Migration Strategy (localStorage → Backend)

| Phase | Mô tả | Status |
|-------|-------|--------|
| Phase 1 | Backend standalone + seed demo data | ✅ Done |
| Phase 2 | Tạo `frontend/src/api/` adapter — cùng function signatures, gọi fetch() | ❌ TODO |
| Phase 3 | Feature flag `VITE_USE_BACKEND=true` → swap services | ❌ TODO |
| Phase 4 | Script migrate real localStorage data → PostgreSQL | ❌ TODO |

### Phase 2 chi tiết (frontend adapter)
Cần tạo `frontend/src/api/` với cùng function signatures như `frontend/src/services/`:
```
api/client.ts          — fetch wrapper với Authorization header
api/bookingApi.ts      — getAll, getByDate, create, update, remove, hasConflict
api/customerApi.ts     — getAll, search, getWithStats, ensureCustomerExists
api/promoApi.ts        — getAll, validate, applyDiscount
api/revenueApi.ts      — getRevenueByPeriod, getOccupancyByRoom, etc.
api/telegramApi.ts     — getConfig, saveConfig, notify, sendTest
api/authApi.ts         — login, refresh, getMe
```

### Phase 3: Feature flag
```ts
// frontend/src/services/index.ts
const useBackend = import.meta.env.VITE_USE_BACKEND === 'true';
export const bookingService = useBackend ? bookingApi : localBookingService;
```

---

## Deployment Options

| Option | Chi phí | Phù hợp |
|--------|---------|---------|
| **Railway** (recommended) | $0-5/mo | Free tier đủ cho early stage, PG included |
| Fly.io | $0-5/mo | Good alternative |
| VPS (Hetzner Singapore) | ~$4/mo | Best latency cho VN |
| Supabase (DB) + Vercel (API) | Free tier | Tách DB và API |

---

## Ghi chú kỹ thuật quan trọng

### 1. Schema imports không dùng .js extension
Trong `src/db/schema/*.ts`, imports giữa các schema files **không dùng `.js` extension** vì drizzle-kit CJS loader không resolve được. Phần còn lại của codebase vẫn dùng `.js` extension (tsx xử lý tự động).

### 2. Hono context typing
Hono generic context không biết về custom vars (`c.get('user')`). Dùng `(c as any).get('user') as JwtPayload` trong routes. Có thể cải thiện sau bằng Hono's `Variables` generic.

### 3. JWT expiresIn type
jsonwebtoken v9 types yêu cầu `expiresIn` phải là `number | StringValue`, không chấp nhận plain string. Dùng type assertion: `as string & jwt.SignOptions['expiresIn']`.

### 4. Revenue occupancy tính bằng PostgreSQL time arithmetic
```sql
EXTRACT(HOUR FROM (end_time::time - start_time::time)) * 60 +
EXTRACT(MINUTE FROM (end_time::time - start_time::time))
```

### 5. Promo validation: client gọi validate, server verify lại khi apply
Tránh race condition: `POST /promos/apply` re-validate + increment `usedCount` atomically.

---

## Tiếp theo (gợi ý ưu tiên)

1. [ ] **Setup PostgreSQL** (Docker hoặc cloud) → db:push → db:seed → dev server
2. [ ] **Manual API test** — Login → tạo booking → check overlap → verify customer auto-create
3. [ ] **Git commit** backend code (50 files)
4. [ ] **Frontend API adapter** (Phase 2) — tạo fetch wrappers matching service signatures
5. [ ] **Feature flag swap** (Phase 3) — VITE_USE_BACKEND env var
6. [ ] **Vite proxy config** — proxy `/api` → localhost:3000
7. [ ] **End-to-end test** — Frontend + Backend integration
8. [ ] **Push dev-vu** → tạo PR
