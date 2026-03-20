# Admin Dashboard Features — Design Spec

**Date:** 2026-03-20
**Author:** TAV (Lead/Architect)
**Status:** Approved
**Branch:** dev-vu

## Overview

Expand the Nhà Cam Homestay admin dashboard with 5 new modules: booking schedule management, customer management, promotion codes, Telegram notifications, and revenue tracking. All frontend-only with mock data + localStorage, designed for future backend swap via data service layer.

## Architecture

### Data Service Layer

All modules share a common pattern: UI pages call service functions, services persist to localStorage with mock seed data. When backend is ready, only service internals change — no UI modifications needed.

```
UI Pages → services/*Service.ts → localStorage + mock seed
```

**Services:**
- `bookingService` — CRUD bookings (guest + internal), conflict detection
- `customerService` — get/search customers, compute stats from bookings
- `promoService` — CRUD promo codes, validation, auto-expire
- `telegramService` — save config, simulate notifications, log history
- `revenueService` — aggregate revenue by period, compute occupancy
- `authService` — role management (Admin/Staff), permission checks

### File Structure (new files)

```
src/
├── services/
│   ├── bookingService.ts
│   ├── customerService.ts
│   ├── promoService.ts
│   ├── telegramService.ts
│   ├── revenueService.ts
│   └── authService.ts
├── types/
│   ├── customer.ts
│   ├── promo.ts
│   └── auth.ts
├── components/admin/
│   ├── booking-schedule.tsx
│   ├── booking-modal.tsx
│   ├── customer-list.tsx
│   ├── customer-detail.tsx
│   ├── promo-manager.tsx
│   ├── promo-modal.tsx
│   ├── telegram-config.tsx
│   └── revenue-dashboard.tsx
└── data/
    ├── demo-customers.ts
    └── demo-promos.ts
```

### Routes

**Migration:** The existing `/admin/rooms` route (currently a placeholder `AdminRoomsPage`) is **removed** and replaced by `/admin/customers`. The existing `AdminDashboardPage` in `admin-pages.tsx` is **replaced** by the new `revenue-dashboard.tsx` component in `components/admin/`. The placeholder pages `AdminBookingsPage` and `AdminRoomsPage` in `admin-pages.tsx` are deleted.

| Path | Component | Access | Status |
|------|-----------|--------|--------|
| /admin | RevenueDashboard (new, replaces AdminDashboardPage) | Admin | New |
| /admin/bookings | BookingSchedule (new, replaces placeholder) | Admin, Staff | New |
| /admin/customers | CustomerList (new, replaces /admin/rooms) | Admin | New |
| /admin/customers/:id | CustomerDetail | Admin | New |
| /admin/promos | PromoManager | Admin | New |
| /admin/telegram | TelegramConfig | Admin | New |
| /admin/settings | AdminSettingsPage (existing, keep) | Admin | Existing |
| /admin/management | RoomManagement (existing, keep) | Admin | Existing |

### Permissions (2 roles)

| Action | Admin | Staff |
|--------|-------|-------|
| View booking schedule | ✓ | ✓ |
| Add booking (guest + internal) | ✓ | ✓ |
| Edit booking | ✓ | ✗ |
| Delete booking | ✓ | ✗ |
| Change status (confirm, check-in/out) | ✓ | ✓ |
| View customers | ✓ | ✗ |
| View revenue | ✓ | ✗ |
| Manage promo codes | ✓ | ✗ |
| Configure Telegram / Settings | ✓ | ✗ |

`authService` stores current role in localStorage. UI conditionally renders actions and sidebar items based on role. Staff see only: Lịch phòng. Admin see all items.

### Auth Types & Role Toggle UI

```typescript
// types/auth.ts
type UserRole = 'admin' | 'staff';

interface AuthState {
  currentRole: UserRole;
  userName: string;  // display name in header
}
```

**Role toggle UI:** Add a dropdown in the admin header (top bar) next to the avatar. Shows current role badge + dropdown to switch between Admin/Staff. This is for development/demo purposes — in production with a real backend, this would be replaced by actual authentication.

---

## Module 1: Booking Schedule

### Grid View
- X-axis: time slots, configurable via existing `startHour`/`endHour` props (default 0–24 to match existing `ScheduleProps`). Admin can see the full 0–24 range. The mockup showed 06:00–22:00 as a typical view.
- Y-axis: rooms (from demoRooms)
- Date picker above grid to select day
- Booking blocks color-coded by status:
  - Green (#22C55E) = confirmed
  - Yellow (#EAB308) = pending
  - Blue (#3B82F6) = checked-in
  - Gray (#94A3B8) = checked-out
  - Red (#EF4444) = cancelled
- Empty slots show "+" button to add booking

### Internal Bookings (admin-only visibility)
4 tag types with diagonal stripe pattern to distinguish from guest bookings:

| Tag | Color | Default Duration | Icon |
|-----|-------|-----------------|------|
| Dọn phòng (cleaning) | Purple (#8B5CF6) | 30 min | 🧹 |
| Bảo trì (maintenance) | Amber (#F59E0B) | Custom | 🔧 |
| Khóa phòng (locked) | Pink (#EC4899) | Custom | 🚫 |
| Tùy chỉnh (custom) | Slate (#94A3B8) | Custom | 📝 |

**Admin view:** Full detail — tag name, note, time, created by.
**User view:** "Không khả dụng" with tooltip "Khung giờ này không thể đặt phòng". No tag details visible.

### Booking Modal (add/edit)
Fields:
- Room (pre-filled from grid click)
- Date (pre-filled from date picker)
- Start time / End time (pre-filled from slot)
- Tab toggle: "Khách hàng" | "Nội bộ"
- Guest tab: guest name, phone, status dropdown, promo code input (maps to existing `voucher` field), note
- Internal tab: tag selector, internal note
- Promo code validation inline (check valid + room type + remaining uses + expiry)

### Quick Actions
- Click empty slot → modal opens with room + time pre-filled
- Click booking block → modal opens with existing data (edit mode, Admin only)
- Check-out → prompt "Thêm 30p dọn phòng?" → 1-click create cleaning block
- Right-click booking → context: "Thêm dọn phòng sau"
- Delete booking → confirmation dialog: "Bạn có chắc muốn xóa booking này?" with Cancel/Xóa buttons

### Validation (Zod)
- End time > start time
- No time overlap with existing bookings in same room on same date
- Phone format validation
- Required: room, date, start time, end time, guest name (for guest bookings)

### Data Model Changes

```typescript
// Extend existing Booking interface in schedule.ts
export type BookingStatus = 'confirmed' | 'pending' | 'checked-in' | 'checked-out' | 'cancelled';

export interface Booking {
  id: string;
  roomId: string;
  date: string;            // NEW — ISO date "YYYY-MM-DD" for filtering by day
  startTime: string;       // "HH:mm"
  endTime: string;         // "HH:mm"
  guestName?: string;
  guestPhone?: string;     // Also used as Customer linkage key (see Module 2)
  status: BookingStatus;
  note?: string;
  adults?: number;
  foodItems?: FoodItem[];
  totalPrice: number;      // CHANGED — required (was optional). For internal bookings: 0.
  voucher?: string;        // Existing field — stores promo code string (e.g., "SUMMER20")
  // New fields:
  category: 'guest' | 'internal';
  internalTag?: 'cleaning' | 'maintenance' | 'locked' | 'custom';
  internalNote?: string;
  createdBy?: string;      // Role/name of who created this booking
}
```

**Key changes from existing `Booking`:**
1. Added `date: string` — required for day-based grid filtering and revenue aggregation
2. `totalPrice` changed from optional to required — revenue calculations depend on it. Internal bookings use `totalPrice: 0`.
3. Added `category` — distinguishes guest vs internal bookings
4. Added `internalTag`, `internalNote`, `createdBy` — metadata for internal bookings
5. Added `'cancelled'` to `BookingStatus` — for cancelled bookings
6. `voucher` field (already exists in `BookingFormData`) — reused for promo code linkage. `promoService` increments `usedCount` when a booking is saved with a valid voucher.

**Existing demo data migration:** The 27 existing bookings in `demo-schedule.ts` will get `date: '2026-03-20'` (today), `category: 'guest'`, and `totalPrice` computed from `ROOM_PRICES`.

---

## Module 2: Customer Management

### Customer-Booking Linkage

Customers are linked to bookings **via phone number** (`guestPhone`). Phone numbers are normalized before comparison: strip spaces, dashes, and leading `+84` → `0`. This means:
- `customerService.getBookings(customerId)` → find customer's phone → query all bookings where `guestPhone` matches
- `totalSpent` = sum of `totalPrice` from matched bookings
- `visitCount` = count of matched bookings with status `checked-out`
- `lastVisit` = most recent `date` from matched bookings

### Customer List (/admin/customers)
- Search bar: filter by name, phone, email (debounce 300ms)
- Sort options: most recent, highest spend, most bookings, A→Z
- Table columns: avatar (initials), name + email, phone, visit count (badge), total spent, last visit date, note/VIP tag
- Pagination: 10 per page
- Click row → navigate to customer detail
- **Empty state:** "Chưa có khách hàng nào. Khách hàng sẽ tự động được tạo khi có booking mới."

### Customer Detail (/admin/customers/:id)
- Header: avatar, name, phone, email, edit note button
- 4 stat cards: total spent, visit count, last visit, note (editable)
- Booking history table: date, room, time, price (show strikethrough if voucher applied), status, promo code used
- "Phòng hay đặt nhất" section: room frequency ranking
- **Empty state for booking history:** "Khách hàng chưa có lịch sử đặt phòng."

### Auto-create
When a booking is created with a `guestPhone` not matching any existing Customer, automatically create a new Customer record with name and phone from the booking.

### Data Model

```typescript
// types/customer.ts
interface Customer {
  id: string;
  name: string;
  phone: string;           // Normalized format, primary linkage key to bookings
  email?: string;
  note?: string;           // VIP notes, preferences
  createdAt: string;       // ISO date
}

// Computed fields (derived by customerService, not stored):
// - totalSpent: number    — sum of booking totalPrice
// - visitCount: number    — count of checked-out bookings
// - lastVisit: string     — most recent booking date
```

---

## Module 3: Promotion Codes

### Promo List (/admin/promos)
- Toolbar: "+ Tạo mã mới" button, filter dropdown (all/active/expired/disabled)
- Summary: count of active + expired
- Table columns: code (monospace badge), discount type + value, applicable room types (chip badges using display labels "Standard"/"VIP"/"SuperVIP" but stored as lowercase `RoomType` values), used/max count, expiry date, status, edit/delete actions
- Expired promos shown with reduced opacity
- Delete with confirmation: "Xóa mã khuyến mãi [CODE]?"
- **Empty state:** "Chưa có mã khuyến mãi. Nhấn '+ Tạo mã mới' để bắt đầu."

### Promo Modal (create/edit)
- Code input: uppercase + numbers only, 3-20 chars, unique validation
- Discount type toggle: "Phần trăm (%)" | "Cố định (VND)"
- Value input (changes unit based on type)
- Max uses input
- Date range: start date + end date
- Room type multi-select: chips for "Tất cả", "Standard", "VIP", "SuperVIP". Display labels are title case; stored values use existing `RoomType` lowercase ('standard' | 'vip' | 'supervip').
- Live preview box: human-readable summary of the promo

### Validation (Zod)
- Code: /^[A-Z0-9]{3,20}$/, unique
- Percent discount: 1–100
- Fixed discount: 1,000–10,000,000
- Max uses: 1–99,999
- End date > start date

### Auto-expire
Status automatically becomes 'expired' when `endDate < now` or `usedCount >= maxUses`.

### Integration with Booking
When a booking is saved with a `voucher` value:
1. `promoService.validate(code, roomType)` → checks: code exists, status active, room type matches, usedCount < maxUses, within date range
2. If valid → compute discount, apply to `totalPrice`, increment `usedCount`
3. If invalid → show inline error message on voucher field

### Data Model

```typescript
// types/promo.ts
interface PromoCode {
  id: string;
  code: string;                          // "SUMMER20", "VIP50K"
  discountType: 'percent' | 'fixed';
  discountValue: number;                 // 20 (%) or 50000 (VND)
  maxUses: number;
  usedCount: number;
  startDate: string;                     // ISO date
  endDate: string;                       // ISO date
  applicableRoomTypes: RoomType[];       // empty array = all room types
  status: 'active' | 'expired' | 'disabled';
  createdAt: string;
}
```

Note: Changed `roomTypes: RoomType[] | 'all'` to `applicableRoomTypes: RoomType[]` where empty array means "all room types". Cleaner for TypeScript than a union with string literal.

---

## Module 4: Telegram Notifications

### Config Page (/admin/telegram)
- Bot Token input (masked display, stored in localStorage)
- Chat ID input
- Connection status indicator (green dot + bot name)
- "Lưu cấu hình" + "Gửi tin test" buttons
- **Empty state (no config):** Form fields empty, status shows "Chưa cấu hình"

### Message Template
- Editable template with variable placeholders
- Available variables: `{{guestName}}`, `{{guestPhone}}`, `{{roomName}}`, `{{startTime}}`, `{{endTime}}`, `{{date}}`, `{{totalPrice}}`, `{{promoCode}}`, `{{status}}`
- Click-to-insert variable chips below editor
- Live preview: Telegram-style dark bubble with real mock data substituted

**Default template (stored in localStorage on first load):**
```
🏠 Booking mới!

👤 Khách: {{guestName}}
📞 SĐT: {{guestPhone}}
🚪 Phòng: {{roomName}}
🕐 Giờ: {{startTime}} – {{endTime}}
📅 Ngày: {{date}}
💰 Giá: {{totalPrice}}
🏷️ Mã KM: {{promoCode}}
```

### Notification Events

| Event | Sends? |
|-------|--------|
| New guest booking | ✓ |
| Booking confirmed | ✓ |
| Guest check-in | ✓ |
| Internal booking (cleaning, maintenance) | ✗ |
| Booking cancelled | ✗ |
| Guest check-out | ✗ |

Note: "Booking cancelled" refers to the new `cancelled` status. Cancellations do not trigger notifications — they are logged in the notification history as "Skipped".

### Notification Log
Table: timestamp, event type, guest + room, send status ("Đã gửi ✓" or "Mô phỏng").
- **Empty state:** "Chưa có thông báo nào."

### Frontend-only Behavior
- No actual Telegram API calls — simulation only
- `bookingService.create()` → calls `telegramService.notify()` → logs to localStorage history
- "Gửi tin test" → shows toast notification + adds log entry
- When backend exists: `telegramService.notify()` → POST to server → server calls Telegram Bot API

---

## Module 5: Revenue Dashboard

Replaces current `AdminDashboardPage` in `admin-pages.tsx`. The new `revenue-dashboard.tsx` lives in `components/admin/` (consistent with other new admin components). The old `AdminDashboardPage` component is deleted. Admin-only access (Staff redirected to `/admin/bookings`).

### Period Selector
Toggle buttons: "Hôm nay" | "Tuần này" | "Tháng này". Compares current period vs previous period for trend arrows.

### Stat Cards (4)
1. **Tổng doanh thu** — sum of all guest booking `totalPrice` in period, ↑/↓ % vs previous
2. **Tổng booking** — count of guest bookings (category='guest'), ↑/↓ count vs previous
3. **Tỷ lệ lấp đầy** — (total booked hours / total available hours) × 100, progress bar. Both guest and internal bookings count as "occupied" hours.
4. **Trung bình / booking** — total revenue / guest booking count

**Empty state (no bookings in period):** Cards show "0" / "0%" with "Không có dữ liệu cho khoảng thời gian này."

### Revenue Trend Chart
- Line chart with area gradient (using `recharts` library)
- X-axis: days in period
- Y-axis: revenue (VND)
- Dots on data points, today highlighted
- **Empty state:** Flat line at 0 with "Chưa có dữ liệu"

### Occupancy by Room
- Horizontal progress bars per room
- Font: room name 15px bold, percentage 15px semi-bold
- Bar height: 12px
- Color by room type: green (#22C55E) for standard, red (#F87171) for VIP, purple (#8B5CF6) for SuperVIP
- Padding: 28px

### Top 5 Customers
- Ranked by total spend in period
- Each row: rank circle (32px), name (15px bold), amount (16px extra-bold rose), visit count (13px)
- #1 gets gold background highlight
- Padding: 28px
- **Empty state:** "Chưa có dữ liệu khách hàng."

### Chart Library
`recharts@2.x` — lightweight, React-compatible. Install via `npm install recharts`. Only used for the line chart. Progress bars are CSS-only.

---

## Sidebar Navigation Update

Replace the existing `NAV_ITEMS` array in `sidebar.tsx`. The old item "Danh sách khách" → `/admin/rooms` is removed and replaced by the new items below.

| Order | Label | Icon (lucide-react) | Path | Visible to |
|-------|-------|---------------------|------|------------|
| 1 | Tổng quan | LayoutDashboard | /admin | Admin |
| 2 | Lịch phòng | CalendarDays | /admin/bookings | Admin, Staff |
| 3 | Khách hàng | Users | /admin/customers | Admin |
| 4 | Khuyến mãi | Tag | /admin/promos | Admin |
| 5 | Telegram | Send | /admin/telegram | Admin |
| 6 | Cài đặt | Settings | /admin/settings | Admin |

Sidebar filters items by `authService.getRole()`. Staff users see only item #2 (Lịch phòng).

---

## New Dependencies

- `recharts@2.x` — line chart for revenue dashboard. Install: `npm install recharts`
- No other new dependencies (all else uses existing shadcn/ui + Tailwind + Zod + lucide-react)

---

## General UX Patterns

### Empty States
Every list/table/chart must handle zero-data gracefully with a centered message and optional action button. Specific messages defined in each module section above.

### Confirmation Dialogs
All destructive actions (delete booking, delete promo code) show a confirmation dialog using shadcn `AlertDialog` with "Hủy" (cancel) and "Xóa" (delete, red) buttons.

### Future Backend Readiness
All service functions are synchronous now (localStorage). When migrating to a backend:
- Service functions become `async` returning `Promise<T>`
- Components add loading skeletons (deferred — not implemented in this phase)
- Error states with retry buttons (deferred — not implemented in this phase)
- The service interface (function signatures) stays the same

---

## Design Tokens (consistent with existing)

- Primary: #F87171 (rose-400)
- Secondary: #334155 (slate-700)
- Surface: #F8FAFC
- Border: #E2E8F0
- Success: #22C55E
- Warning: #EAB308
- Info: #3B82F6
- Error: #EF4444
- Internal/Purple: #8B5CF6
- Font: Inter
- Border radius: 8–12px for cards, 6px for inputs, 20px for badges

## Mockups

Visual mockups saved in `.superpowers/brainstorm/129351-1774014358/`:
- `architecture-overview.html` — architecture diagram + file structure
- `module-booking-schedule-v2.html` — grid view + internal bookings + admin vs user view
- `module-customer.html` — customer list + detail page
- `module-promo.html` — promo list + create/edit modal
- `module-telegram.html` — config + template editor + preview + log
- `module-revenue-v2.html` — stats + chart + occupancy + top customers
