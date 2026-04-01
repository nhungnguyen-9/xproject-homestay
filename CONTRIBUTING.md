# Hướng dẫn đóng góp & Onboarding — XProject Homestay

Tài liệu dành cho developer mới tham gia dự án **Chốn Cinehome** (hệ thống quản lý đặt phòng homestay). Đọc kỹ trước khi bắt đầu code.

---

## 1. Tổng quan dự án

| Thông tin | Chi tiết |
|---|---|
| **Tên sản phẩm** | Chốn Cinehome |
| **Mô tả** | Hệ thống quản lý đặt phòng homestay — trang landing page cho khách, dashboard admin cho nhân viên |
| **Kiến trúc** | Monorepo: `frontend/` + `backend/` |
| **Frontend** | React 19 · React Router 7 · Vite 7 · Tailwind CSS 4 · Radix/shadcn UI |
| **Backend** | Hono 4.7 · @hono/node-server · Drizzle ORM 0.39 · PostgreSQL |
| **Ngôn ngữ** | TypeScript (toàn bộ) |
| **Auth** | JWT (access 15m + refresh 7d) · bcrypt · RBAC (admin / staff) |
| **Testing** | Vitest (jsdom cho FE, node cho BE) |

### Phân quyền (RBAC)

- **admin**: Truy cập toàn bộ dashboard (Tổng quan, Lịch phòng, Khách hàng, Khuyến mãi, Telegram, Cài đặt)
- **staff**: Chỉ truy cập trang **Lịch phòng** (`/admin/bookings`)

---

## 2. Cấu trúc thư mục

```
xproject-homestay/
├── frontend/                      # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/             # Các trang dashboard admin
│   │   │   │   ├── booking-schedule.tsx
│   │   │   │   ├── customer-list.tsx
│   │   │   │   ├── promo-manager.tsx
│   │   │   │   ├── revenue-dashboard.tsx
│   │   │   │   ├── room-management.tsx
│   │   │   │   └── telegram-config.tsx
│   │   │   ├── auth/              # Đăng nhập, bảo vệ route
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── booking-calendar-form/  # Luồng đặt phòng
│   │   │   │   ├── booking-modal/
│   │   │   │   │   ├── Step1.tsx       # Chọn phòng, giờ, ngày
│   │   │   │   │   ├── Step2.tsx       # Thông tin khách, CCCD
│   │   │   │   │   ├── Step3.tsx       # Xác nhận & thanh toán
│   │   │   │   │   ├── PaymentModal.tsx # Modal VietQR
│   │   │   │   │   ├── FoodModal.tsx   # Chọn đồ ăn kèm
│   │   │   │   │   ├── useBookingForm.ts # Logic tính giá
│   │   │   │   │   ├── validation.ts   # Kiểm tra trùng lịch
│   │   │   │   │   └── constants.ts    # Hằng số booking
│   │   │   │   └── booking-modal.tsx
│   │   │   ├── common/            # Shared components (ScrollToTop, ...)
│   │   │   ├── footer/            # Footer landing page
│   │   │   ├── header/            # Header/navbar landing page
│   │   │   ├── hero/              # Hero section
│   │   │   ├── home/              # Trang chủ
│   │   │   ├── layouts/           # AdminLayout, Sidebar, admin-pages
│   │   │   ├── locations/         # Trang chi nhánh
│   │   │   ├── rooms/             # Trang chi tiết phòng, đặt phòng
│   │   │   ├── schedule/          # Lịch phòng
│   │   │   └── ui/                # shadcn/Radix primitive components
│   │   ├── services/              # API client & business services
│   │   │   ├── apiClient.ts       # Fetch wrapper, auto-refresh token
│   │   │   ├── authService.ts     # JWT login/logout/refresh
│   │   │   ├── bookingService.ts  # CRUD booking
│   │   │   ├── customerService.ts
│   │   │   ├── promoService.ts
│   │   │   ├── revenueService.ts
│   │   │   └── telegramService.ts
│   │   ├── types/                 # TypeScript type definitions
│   │   │   ├── auth.ts            # User, AuthTokens, AuthState
│   │   │   ├── schedule.ts        # Booking, Room, PriceConfig, ROOM_PRICES
│   │   │   ├── customer.ts
│   │   │   └── promo.ts
│   │   ├── utils/
│   │   │   └── helpers.ts         # formatPrice, formatDate, calculateDuration
│   │   ├── lib/
│   │   │   └── utils.ts           # cn() helper (clsx + tailwind-merge)
│   │   ├── main.tsx               # Entry point + routing
│   │   ├── App.tsx                # Layout wrapper public pages
│   │   └── index.css              # Tailwind CSS imports + custom styles
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── eslint.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                       # Hono API server
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts             # Zod env validation
│   │   │   └── database.ts        # Drizzle + postgres client
│   │   ├── db/
│   │   │   ├── schema/            # Drizzle table definitions
│   │   │   │   ├── users.ts
│   │   │   │   ├── rooms.ts
│   │   │   │   ├── bookings.ts
│   │   │   │   ├── customers.ts
│   │   │   │   ├── branches.ts
│   │   │   │   ├── promos.ts
│   │   │   │   ├── foodItems.ts
│   │   │   │   ├── telegram.ts
│   │   │   │   ├── notificationLog.ts
│   │   │   │   └── index.ts       # Re-export tất cả schema
│   │   │   ├── migrations/        # Drizzle migration files
│   │   │   └── seed.ts            # Dữ liệu mẫu (2 branches, 6 rooms, 2 users, ...)
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT Bearer verification
│   │   │   ├── rbac.ts            # requireRole(), adminOnly
│   │   │   ├── rateLimiter.ts     # Rate limit login/refresh
│   │   │   └── errorHandler.ts    # AppError class, global handler
│   │   ├── routes/                # Hono route handlers
│   │   │   ├── auth.ts            # POST /login, /refresh, /logout; GET /me
│   │   │   ├── rooms.ts
│   │   │   ├── bookings.ts
│   │   │   ├── customers.ts
│   │   │   ├── promos.ts
│   │   │   ├── telegram.ts
│   │   │   ├── revenue.ts
│   │   │   ├── foodItems.ts
│   │   │   ├── branches.ts
│   │   │   └── index.ts           # Route aggregator → /api/v1/*
│   │   ├── services/              # Business logic layer
│   │   │   ├── authService.ts     # login, refreshAccessToken, getMe
│   │   │   ├── bookingService.ts
│   │   │   ├── roomService.ts
│   │   │   ├── customerService.ts
│   │   │   ├── promoService.ts
│   │   │   ├── revenueService.ts
│   │   │   ├── foodItemService.ts
│   │   │   ├── branchService.ts
│   │   │   └── telegramService.ts
│   │   ├── validators/            # Zod request schemas
│   │   │   ├── auth.ts
│   │   │   ├── booking.ts
│   │   │   ├── customer.ts
│   │   │   ├── promo.ts
│   │   │   └── room.ts
│   │   ├── types/                 # Shared types
│   │   ├── utils/                 # Utility functions
│   │   ├── app.ts                 # Hono app setup (CORS, logger, routes)
│   │   └── index.ts               # Server entry point
│   ├── drizzle.config.ts
│   ├── vitest.config.ts
│   ├── tsconfig.json
│   └── package.json
│
└── docs/                          # Tài liệu dự án
```

---

## 3. Cài đặt & Chạy local

### 3.1 Yêu cầu hệ thống

- **Node.js** >= 20 (hỗ trợ `--env-file`)
- **PostgreSQL** >= 15
- **npm** (đi kèm Node.js)

### 3.2 Clone & cài đặt dependencies

```bash
git clone <repo-url> xproject-homestay
cd xproject-homestay

# Cài dependencies cho cả frontend và backend
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

### 3.3 Cấu hình biến môi trường

Tạo file `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/cinehome_db
JWT_SECRET=your-jwt-secret-min-10-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-10-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

Tạo file `frontend/.env` (nếu cần custom thông tin ngân hàng):

```env
VITE_BANK_ID=MB
VITE_BANK_ACCOUNT=0123456789
VITE_ACCOUNT_NAME=CHON CINEHOME
```

> **Lưu ý:** Các biến `VITE_*` được nhúng vào bundle lúc build. Không đặt secret ở đây.

### 3.4 Khởi tạo database

```bash
cd backend

# Tạo database PostgreSQL (nếu chưa có)
createdb cinehome_db

# Chạy migration (tạo bảng)
npm run db:push

# Seed dữ liệu mẫu (2 branches, 6 rooms, 2 users, 5 customers, 30 bookings, ...)
npm run db:seed
```

**Tài khoản mặc định sau khi seed:**

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | admin |
| `staff` | `staff123` | staff |

### 3.5 Chạy development server

```bash
# Terminal 1: Backend (port 3000)
cd backend
npm run dev

# Terminal 2: Frontend (port 5173)
cd frontend
npm run dev
```

Truy cập:
- **Landing page**: http://localhost:5173
- **Admin login**: http://localhost:5173/admin/login
- **API health check**: http://localhost:3000/health

### 3.6 Chạy test

```bash
# Frontend tests (jsdom environment)
cd frontend
npm run test:run

# Backend tests (node environment)
cd backend
npm run test:run

# Chạy test với coverage
npm run test:coverage
```

### 3.7 Build production

```bash
# Frontend
cd frontend
npm run build    # Output: frontend/dist/

# Backend
cd backend
npm run build    # Output: backend/dist/
npm start        # Chạy production server
```

---

## 4. Coding Conventions

### 4.1 Ngôn ngữ & Format

- **TypeScript strict** cho cả frontend và backend
- **ESLint** (FE): `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh` + `typescript-eslint`
- **Path alias**: `@/` → `./src/` (cả FE lẫn BE)
- **Module system**: ESM (`"type": "module"` trong package.json)

### 4.2 Quy tắc comment — JSDoc tiếng Việt

Toàn bộ codebase sử dụng **JSDoc tiếng Việt có dấu**. Tuân thủ 7 quy tắc sau:

```typescript
// ✅ Đúng: JSDoc tiếng Việt, giải thích "tại sao"
/** Chuyển đổi thời gian về timestamp tuyệt đối để so sánh chính xác qua nửa đêm */
function toMs(dateStr: string, timeStr: string): number { ... }

// ❌ Sai: Comment tiếng Anh
// Convert time to absolute timestamp
function toMs(dateStr: string, timeStr: string): number { ... }

// ❌ Sai: Chỉ lặp lại tên hàm
/** Hàm toMs */
function toMs(dateStr: string, timeStr: string): number { ... }
```

**7 quy tắc chi tiết:**

1. **Dùng JSDoc (`/** */`)** — không dùng `//` cho documentation comment
2. **Tiếng Việt có dấu** — viết đầy đủ dấu tiếng Việt, không viết không dấu
3. **Giải thích "tại sao" và "cái gì"** — không lặp lại tên hàm/biến
4. **Ngắn gọn, 1-2 dòng** — không viết đoạn văn dài
5. **Dùng `@param`, `@returns`, `@throws`** khi cần thiết (tên tham số giữ tiếng Anh, mô tả tiếng Việt)
6. **Section comment** dùng `/** --- TÊN SECTION --- */` để chia nhóm code lớn
7. **Không comment code hiển nhiên** — getter/setter đơn giản, import, re-export không cần comment

### 4.3 Đặt tên

| Loại | Convention | Ví dụ |
|---|---|---|
| Component | PascalCase | `LoginPage.tsx`, `BookingSchedule` |
| Hook | camelCase, prefix `use` | `useBookingForm.ts` |
| Service | camelCase + `.ts` | `authService.ts`, `bookingService.ts` |
| Type/Interface | PascalCase | `BookingFormData`, `AuthTokens` |
| Biến/hàm | camelCase | `formatPrice`, `totalPrice` |
| Hằng số | UPPER_SNAKE_CASE | `ROOM_PRICES`, `OVERNIGHT_BASE_HOURS` |
| DB table | camelCase (Drizzle) | `users`, `bookings`, `foodItems` |
| DB column | camelCase | `checkInDate`, `passwordHash` |
| Route path | kebab-case | `/food-items`, `/api/v1/auth` |
| File component | kebab-case hoặc PascalCase | `booking-schedule.tsx` / `LoginPage.tsx` |

### 4.4 Import order

```typescript
// 1. React/framework imports
import React from 'react';
import { useState } from 'react';

// 2. Third-party libraries
import { z } from 'zod';
import { Hono } from 'hono';

// 3. Internal aliases (@/)
import { Button } from '@/components/ui/button';
import type { BookingFormData } from '@/types/schedule';

// 4. Relative imports
import { validateStep1 } from './validation';
```

---

## 5. Conventions theo layer

### 5.1 Frontend — Components

- **UI primitives** (`components/ui/`): Dùng shadcn/Radix, không sửa trực tiếp — tạo wrapper nếu cần custom
- **Layout**: `AdminLayout.tsx` + `Sidebar.tsx` — sidebar responsive, role-based menu filtering
- **State management**: Local state (`useState`/`useReducer`) — chưa dùng global store
- **Form validation**: Zod schemas, validate trước khi submit
- **Toast notification**: `sonner` — dùng `toast.success()`, `toast.error()` (import từ `sonner`)
- **Icons**: `lucide-react` — import từng icon, không import wildcard

```typescript
// ✅ Đúng
import { CreditCard, LogOut } from 'lucide-react';

// ❌ Sai
import * as Icons from 'lucide-react';
```

### 5.2 Frontend — Services

- **`apiClient.ts`**: Fetch wrapper tự động gắn Bearer token, auto-refresh khi nhận 401 + "expired"
- **Các service khác**: Hiện tại dùng `localStorage` làm persistence tạm — sẽ chuyển sang gọi API thật
- **Auth flow**: `authService.login()` → lưu tokens vào localStorage → `apiClient` tự gắn header

```typescript
// Gọi API qua apiClient (tự động xử lý auth)
import { apiClient } from '@/services/apiClient';

const rooms = await apiClient('/rooms');
```

### 5.3 Backend — Routes

Mỗi route file export một Hono router, được mount vào `/api/v1/*` tại `routes/index.ts`.

```typescript
// Cấu trúc route file chuẩn
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { mySchema } from '../validators/myValidator.js';
import * as myService from '../services/myService.js';

const myRoutes = new Hono();

myRoutes.get('/', authMiddleware, async (c) => {
  const data = await myService.getAll();
  return c.json(data);
});

myRoutes.post('/', authMiddleware, requireRole('admin'),
  zValidator('json', mySchema),
  async (c) => {
    const body = c.req.valid('json');
    const result = await myService.create(body);
    return c.json(result, 201);
  }
);

export { myRoutes };
```

### 5.4 Backend — Services

- Business logic thuần, **không truy cập `c` (Hono context)** — nhận input, trả output
- Truy cập DB qua Drizzle: `import { db } from '../config/database.js'`
- Throw `AppError` cho lỗi nghiệp vụ (sẽ bị bắt bởi `errorHandler`)

### 5.5 Backend — Validators

- Mỗi route có file validator riêng trong `validators/`
- Dùng Zod schema → `zValidator('json', schema)` trong route
- Sanitize input: `.trim()`, `.max()` cho string fields

### 5.6 Backend — Middleware

| Middleware | Mô tả |
|---|---|
| `auth.ts` | Xác thực JWT Bearer token, gắn `user` vào context |
| `rbac.ts` | `requireRole('admin')` — kiểm tra quyền sau auth |
| `rateLimiter.ts` | Giới hạn login 10 req/15 phút, refresh 30 req/15 phút per IP |
| `errorHandler.ts` | Bắt `AppError` + lỗi không mong đợi, che thông tin nội bộ ở production |

### 5.7 Database — Schema

- Dùng **Drizzle ORM** với `pgTable` definitions
- ID: `nanoid` (không dùng auto-increment)
- Timestamps: `createdAt` + `updatedAt` (default `now()`)
- Relations: Foreign key qua `references(() => table.id)`
- Migration: `npm run db:generate` → `npm run db:migrate`
- Quick sync (dev only): `npm run db:push`

```typescript
// Ví dụ schema
import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const rooms = pgTable('rooms', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),   // 'standard' | 'vip' | 'deluxe'
  hourlyRate: integer('hourly_rate').notNull(),
  dailyRate: integer('daily_rate').notNull(),
  overnightRate: integer('overnight_rate').notNull(),
  extraHourRate: integer('extra_hour_rate').notNull(),
  branchId: text('branch_id').references(() => branches.id),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## 6. Logic nghiệp vụ quan trọng

### 6.1 Tính giá đặt phòng

Hệ thống hỗ trợ 3 hình thức đặt phòng:

| Hình thức | Cách tính |
|---|---|
| **Theo giờ** (`hourly`) | `Math.ceil(duration) × hourlyRate` |
| **Theo ngày** (`daily`) | `fullDays × dailyRate + extraHours × extraHourRate` |
| **Qua đêm** (`overnight`) | `overnightRate (base 11h) + extraHours × extraHourRate` |

- **`OVERNIGHT_BASE_HOURS = 11`**: Gói qua đêm bao gồm 11 giờ cơ bản
- **Extra hours**: Số giờ vượt quá gói cơ bản, tính theo `extraHourRate`
- Logic nằm tại: `frontend/src/components/booking-calendar-form/booking-modal/useBookingForm.ts`

### 6.2 Kiểm tra trùng lịch (Overlap detection)

Sử dụng **absolute timestamp** để so sánh, hỗ trợ đặt phòng qua nửa đêm:

```
Overlap xảy ra khi: startA < endB && startB < endA
```

- Nếu `endTime <= startTime` (qua nửa đêm) → cộng thêm 24h cho endTime
- Logic nằm tại: `frontend/src/components/booking-calendar-form/booking-modal/validation.ts`

### 6.3 Thanh toán VietQR

- Nội dung chuyển khoản: `DP {tên phòng} {4 số cuối SĐT} {ngày}`
- QR URL: `https://img.vietqr.io/image/{bankId}-{account}-compact2.png?amount=...&addInfo=...`
- Thông tin bank từ biến môi trường `VITE_BANK_*`

---

## 7. Routing

### 7.1 Frontend Routes

| Path | Component | Quyền |
|---|---|---|
| `/` | `Home` | Public |
| `/chi-nhanh` | `LocationPage` | Public |
| `/chi-nhanh/:id` | `DestinationPage` | Public |
| `/hang-phong/:id` | `RoomDetailRoute` | Public |
| `/admin/login` | `LoginPage` | Public |
| `/admin` | `RevenueDashboard` | admin |
| `/admin/bookings` | `BookingSchedule` | admin, staff |
| `/admin/customers` | `CustomerList` | admin |
| `/admin/customers/:id` | `CustomerDetailRoute` | admin |
| `/admin/promos` | `PromoManager` | admin |
| `/admin/telegram` | `TelegramConfig` | admin |
| `/admin/settings` | `AdminSettingsPage` | admin |
| `/admin/management` | `RoomManagement` | admin |

### 7.2 Backend API Endpoints

Base URL: `/api/v1`

| Prefix | Route file | Mô tả |
|---|---|---|
| `/auth` | `auth.ts` | Đăng nhập, refresh token, logout, thông tin user |
| `/rooms` | `rooms.ts` | CRUD phòng |
| `/bookings` | `bookings.ts` | CRUD đặt phòng |
| `/customers` | `customers.ts` | CRUD khách hàng |
| `/promos` | `promos.ts` | Quản lý khuyến mãi |
| `/telegram` | `telegram.ts` | Cấu hình Telegram bot |
| `/revenue` | `revenue.ts` | Thống kê doanh thu |
| `/food-items` | `foodItems.ts` | Quản lý đồ ăn/uống |
| `/branches` | `branches.ts` | Quản lý chi nhánh |

---

## 8. Git Flow

### 8.1 Branch naming

```
feature/ten-tinh-nang      # Tính năng mới
fix/mo-ta-loi               # Sửa lỗi
refactor/mo-ta              # Refactor code
docs/mo-ta                  # Cập nhật tài liệu
```

### 8.2 Commit message

Viết tiếng Anh, format ngắn gọn:

```
feat: add JWT authentication flow
fix: correct VIP room hourly rate from 21000 to 210000
refactor: extract overnight pricing logic
docs: add CONTRIBUTING.md onboarding guide
chore: update dependencies
```

### 8.3 Quy trình làm việc

1. Tạo branch từ `main`
2. Code + viết test
3. Chạy lint: `cd frontend && npm run lint`
4. Chạy test: `npm run test:run` (cả FE và BE)
5. Tạo Pull Request, mô tả rõ thay đổi
6. Code review bởi ít nhất 1 người
7. Merge vào `main` sau khi approve

---

## 9. Checklist cho developer mới

- [ ] Clone repo và cài dependencies (mục 3.2)
- [ ] Tạo file `.env` cho backend (mục 3.3)
- [ ] Khởi tạo database + seed dữ liệu (mục 3.4)
- [ ] Chạy cả frontend + backend dev server (mục 3.5)
- [ ] Đăng nhập admin dashboard bằng `admin/admin123`
- [ ] Chạy test suite, đảm bảo pass hết (mục 3.6)
- [ ] Đọc quy tắc comment JSDoc tiếng Việt (mục 4.2)
- [ ] Đọc logic nghiệp vụ tính giá + overlap (mục 6)
- [ ] Tạo branch feature, thử sửa 1 file nhỏ, tạo PR

---

## 10. Liên hệ & Tài liệu tham khảo

- **Tài liệu dự án**: `docs/` — báo cáo BA, hướng dẫn deploy VPS
- **Drizzle Studio** (xem DB trực quan): `cd backend && npm run db:studio`
- **Tech stack docs**:
  - [React 19](https://react.dev)
  - [Hono](https://hono.dev)
  - [Drizzle ORM](https://orm.drizzle.team)
  - [Tailwind CSS 4](https://tailwindcss.com)
  - [Vitest](https://vitest.dev)
  - [shadcn/ui](https://ui.shadcn.com)
