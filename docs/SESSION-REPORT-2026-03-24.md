# Phiên làm việc 24/03/2026 — Tối ưu hóa dự án theo chuẩn Skills

## Người thực hiện
- **TAV** (Lead/Architect) + **Claude Opus 4.6** (AI Executioner)
- Branch: `dev-vu`
- Chế độ: **Kỹ sư** (GEMINI-Architect framework)
- Thời gian: ~2 giờ (audit + planning + 7 parallel agents)

---

## Mục tiêu phiên

Tối ưu hóa toàn bộ dự án Nhà Cam Homestay theo chuẩn của 5 agent skills:
1. **shadcn** — UI component best practices
2. **tailwind-design-system** — Tailwind CSS v4, OKLCH, CVA patterns
3. **supabase-postgres-best-practices** — PostgreSQL schema, query, security
4. **vitest** — Testing framework setup
5. **vite** — Build optimization

---

## Quy trình thực hiện

### Bước 1: Cài đặt Skills
- Cài 5 skills cả project-level và global (`-y -g`)
- Skills available cho Claude Code, Gemini CLI, Cursor, Codex, và 7 agent khác

### Bước 2: Đọc guidelines từ mỗi skill
- 5 Explore agents song song đọc toàn bộ rule files
- Tổng hợp: ~200 rules/guidelines cần audit

### Bước 3: Audit codebase
- 4 Explore agents song song audit: shadcn violations, tailwind violations, postgres violations, vite/vitest setup
- Phát hiện: **~30 violations trên 40+ files**

### Bước 4: Lập plan & Phê duyệt
- Plan 6 phases, 7 agents, 2 rounds song song
- TAV phê duyệt → bắt đầu thực thi

### Bước 5: Thực thi (2 rounds)
- **Round 1** (4 agents song song): Backend logic + Schema + CSS tokens + Testing
- **Round 2** (3 agents song song): Frontend component standardization (admin, layouts, public)

---

## Kết quả đạt được

### Phase 1: Backend Logic Fixes — 7 bugs fixed
| Fix | File | Chi tiết |
|-----|------|----------|
| Race condition | promoService.ts | `usedCount` → SQL atomic `SET used_count = used_count + 1` |
| Sequential queries | revenueService.ts | 4x sequential → `Promise.all` (latency = max, không phải sum) |
| Connection pool | database.ts | Thêm `max:10, idle_timeout:30, connect_timeout:10, max_lifetime:1800` |
| No pagination | customerService.ts + routes | Thêm `page/limit` params cho `getAll()` và `getAllWithStats()` |
| Dead code | roomService.ts | Xóa `let query` không dùng |
| Redundant read | telegramService.ts | `getConfig()` + update/insert → `onConflictDoUpdate` upsert |
| Write on read | promoService.ts | `refreshStatuses()` mỗi request → debounce 60s |

### Phase 2: Backend Schema — Migration `0001_chunky_loners.sql`
| Thay đổi | Scope | Lý do |
|----------|-------|-------|
| `timestamp` → `timestamptz` | 9 schema files, all created_at/updated_at | Tránh timezone ambiguity |
| Index `bookings.created_by` | bookings table | FK column thiếu index → sequential scan |
| GIN index `promo_codes.applicable_room_types` | promos table | JSONB column queried trong validation |
| CHECK constraints | 5 tables (rooms.type, users.role, bookings.mode, food_items.category, notification_log.status) | Enum text thiếu DB-level validation |

### Phase 3: Frontend Design Token System — index.css rebuilt
| Thay đổi | Chi tiết |
|----------|----------|
| Hex → OKLCH | Tất cả color values trong `:root` và `.dark` chuyển sang OKLCH |
| 50+ semantic tokens mới | Status (success/warning/error/info), Booking (5 statuses), Tags (4 types), Rooms (3 types), Charts (5 colors) |
| `@theme inline` registration | Tất cả tokens registered → Tailwind utility classes available |
| Dark mode tokens | Full dark mode overrides cho tất cả tokens mới |

### Phase 4: Frontend Component Standardization — 26 files
| Thay đổi | Files | Ví dụ |
|----------|-------|-------|
| Raw colors → semantic tokens | 26 files, 100+ replacements | `bg-green-100 text-green-700` → `bg-status-success-muted text-status-success-foreground` |
| `space-y-*` → `flex flex-col gap-*` | 14+ locations | Layout consistency |
| `w-N h-N` → `size-N` | ~20 locations | Tailwind shorthand |
| `<hr>` → `<Separator />` | footer.tsx, FoodModal.tsx | shadcn component usage |
| Hand-rolled avatar → `<Avatar>` | AdminLayout.tsx | shadcn Avatar + AvatarFallback |
| Dialog a11y | 4 files (Step2, FoodModal, PaymentModal) | Thêm `<DialogHeader><DialogTitle>` |
| Manual z-index removed | sidebar.tsx, header.tsx | DOM stacking thay vì z-index |
| Duplicate useState fixed | booking-schedule.tsx | Pre-existing bug (2 declarations) |

### Phase 5: Testing Infrastructure — 100 tests
| Area | Files | Tests | Coverage |
|------|-------|-------|----------|
| Frontend utils | helpers.test.ts | 21 | formatPrice, formatDate, timeToMinutes, calculateDuration |
| Frontend services | promoService.test.ts | 18 | init, validate, applyDiscount, refreshStatuses |
| Frontend services | bookingService.test.ts | 17 | init, getByDate, create, hasConflict |
| Backend utils | time.test.ts | 17 | timeToMinutes, hasTimeOverlap, durationHours |
| Backend utils | phone.test.ts | 9 | normalizePhone (+84, spaces, dashes) |
| Backend utils | price.test.ts | 18 | calculatePrice (hourly/daily/overnight + food + discount) |
| **Tổng** | **6 test files** | **100** | **All pass** |

### Phase 6: Vite Build Optimization
| Thay đổi | Kết quả |
|----------|---------|
| `manualChunks` splitting | vendor (44KB), ui (127KB), charts (342KB), app (786KB) |
| Sourcemaps enabled | `.map` files cho debugging |

---

## Verification cuối cùng

| Check | Result |
|-------|--------|
| `npm run build` (frontend) | ✅ Built in 6.83s |
| `vitest run` (frontend) | ✅ 56/56 tests pass |
| `tsc --noEmit` (backend) | ✅ 0 errors |
| `vitest run` (backend) | ✅ 44/44 tests pass |
| Dev server | ✅ Vite v7.3.1, ready in 314ms |

---

## Thống kê tổng hợp

| Metric | Giá trị |
|--------|---------|
| Skills cài đặt | 5 (global + project) |
| Violations phát hiện | ~30 |
| Files modified | 30 (frontend) |
| Files created | 8 (tests, configs, separator) |
| Backend fixes | 7 logic + 1 migration (4 schema changes) |
| Frontend token additions | 50+ semantic tokens |
| Color replacements | 100+ |
| Tests written | 100 (56 FE + 44 BE) |
| Agents dispatched | 11 (5 explore + 2 backend + 1 tokens + 3 components) |
| Rounds | 2 parallel groups |

---

## Không thực hiện (deferred)

| Item | Lý do |
|------|-------|
| Text PKs (nanoid) → uuid/bigint | Quá disruptive — cần rewrite tất cả FK, services, routes |
| Text dates/times → native types | Cần rewrite toàn bộ booking/promo services |
| Dark mode toggle UI | Token system ready, UI toggle cần design decision |
| E2E tests (Playwright) | Prioritize unit tests trước |
| Frontend API adapter (localStorage → backend) | Cần PostgreSQL server setup trước |

---

## Files changed summary

```
Modified (30 frontend files):
  frontend/package.json, package-lock.json
  frontend/vite.config.ts
  frontend/src/index.css
  frontend/src/main.tsx
  frontend/src/components/admin/* (8 files)
  frontend/src/components/booking-calendar-form/* (8 files)
  frontend/src/components/layouts/* (3 files)
  frontend/src/components/schedule/* (2 files)
  frontend/src/components/footer/footer.tsx
  frontend/src/components/header/header.tsx
  frontend/src/components/home/home.tsx
  frontend/src/components/locations/destination-page.tsx

Created (8 files):
  frontend/vitest.config.ts
  frontend/src/test/setup.ts
  frontend/src/utils/helpers.test.ts
  frontend/src/services/promoService.test.ts
  frontend/src/services/bookingService.test.ts
  frontend/src/components/ui/separator.tsx
  backend/vitest.config.ts
  backend/src/utils/{time,phone,price}.test.ts

Backend modified (12 files):
  backend/src/config/database.ts
  backend/src/services/{promoService,revenueService,roomService,customerService,telegramService}.ts
  backend/src/routes/customers.ts
  backend/src/db/schema/{bookings,branches,customers,rooms,promos,users,telegram,notificationLog,foodItems}.ts
  backend/src/db/migrations/0001_chunky_loners.sql
```
