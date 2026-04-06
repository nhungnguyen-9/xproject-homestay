# Admin Dashboard Features — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 5 admin dashboard modules (booking schedule, customer management, promo codes, Telegram notifications, revenue dashboard) with data service layer and role-based permissions.

**Architecture:** Data Service Layer pattern — all UI components call service functions that abstract localStorage persistence with mock seed data. Services are synchronous now, designed for future async API swap. Two roles (Admin/Staff) control UI visibility and action permissions.

**Tech Stack:** React 19 · TypeScript 5.9 · Tailwind CSS 4 · shadcn/ui · Zod 4 · Recharts 2.x · Lucide React · Sonner (toasts) · React Router 7

**Spec:** `docs/superpowers/specs/2026-03-20-admin-dashboard-features-design.md`

**Codebase conventions:**
- Named exports for all components (no default exports except App)
- Path alias: `@/` → `./src/`
- Tailwind inline classes, design tokens: Primary #F87171, Surface #F8FAFC, Border #E2E8F0
- shadcn/ui components in `src/components/ui/` (already installed: button, dialog, input, label, select, dropdown-menu, badge, avatar, checkbox, textarea, radio-group)
- Lucide React for icons — use `LucideIcon` type for icon props (not `typeof SpecificIcon`)
- Sonner for toast notifications
- `cn()` utility from `@/lib/utils`
- Tables: use native `<table>` elements with Tailwind classes (no shadcn Table component)
- **Zod 4 syntax:** Use `z.object()` for schemas (Zod 4 keeps this API). Zod 4 changes: `z.string().min(3)` still works, `safeParse` returns `{ success, data, error }`. When in doubt, check `node_modules/zod/lib/types.d.ts`.

**Cross-service dependency strategy:**
Services must NOT import each other's modules to avoid circular dependencies. Instead, each service reads/writes localStorage directly using well-known storage keys:
- `nhacam_bookings` — booking data
- `nhacam_customers` — customer data
- `nhacam_promos` — promo code data
- `nhacam_telegram_config`, `nhacam_telegram_template`, `nhacam_telegram_log` — telegram data
- `nhacam_auth` — auth state

Cross-service side effects (e.g., auto-create customer when booking is created) are wired in **Task 17** at the UI layer (component event handlers), NOT inside service modules. This keeps services independent and avoids circular imports.

---

## Chunk 1: Foundation — Types, Services, Mock Data

### Task 1: Install recharts dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install recharts**

```bash
cd /home/tav/Documents/xproject-homestay/frontend
npm install recharts
```

- [ ] **Step 2: Verify installation**

```bash
npm ls recharts
```

Expected: `recharts@2.x.x`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add recharts dependency for revenue dashboard charts"
```

---

### Task 2: Add new type definitions

**Files:**
- Modify: `src/types/schedule.ts` — extend Booking interface, add `cancelled` status
- Create: `src/types/customer.ts`
- Create: `src/types/promo.ts`
- Create: `src/types/auth.ts`

- [ ] **Step 1: Update schedule.ts — extend BookingStatus and Booking interface**

In `src/types/schedule.ts`, make these changes:

1. Add `'cancelled'` to `BookingStatus`:
```typescript
export type BookingStatus = 'confirmed' | 'pending' | 'checked-in' | 'checked-out' | 'cancelled';
```

2. Add new fields to `Booking` interface:
```typescript
export interface Booking {
  id: string;
  roomId: string;
  date: string;              // ISO date "YYYY-MM-DD"
  startTime: string;         // "HH:mm"
  endTime: string;           // "HH:mm"
  guestName?: string;
  guestPhone?: string;
  status: BookingStatus;
  note?: string;
  adults?: number;
  foodItems?: FoodItem[];
  totalPrice: number;        // Required (was optional). Internal bookings: 0.
  voucher?: string;          // Promo code string
  category: 'guest' | 'internal';
  internalTag?: 'cleaning' | 'maintenance' | 'locked' | 'custom';
  internalNote?: string;
  createdBy?: string;
}
```

3. Add internal tag type:
```typescript
export type InternalTag = 'cleaning' | 'maintenance' | 'locked' | 'custom';
export type BookingCategory = 'guest' | 'internal';
```

- [ ] **Step 2: Create src/types/auth.ts**

```typescript
export type UserRole = 'admin' | 'staff';

export interface AuthState {
  currentRole: UserRole;
  userName: string;
}
```

- [ ] **Step 3: Create src/types/customer.ts**

```typescript
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  note?: string;
  createdAt: string;
}

export interface CustomerWithStats extends Customer {
  totalSpent: number;
  visitCount: number;
  lastVisit: string;
}
```

- [ ] **Step 4: Create src/types/promo.ts**

```typescript
import type { RoomType } from './schedule';

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  maxUses: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  applicableRoomTypes: RoomType[];
  status: 'active' | 'expired' | 'disabled';
  createdAt: string;
}
```

- [ ] **Step 5: Fix any TypeScript compilation errors**

```bash
cd /home/tav/Documents/xproject-homestay/frontend
npx tsc --noEmit 2>&1 | head -50
```

The existing `demoBookings` in `demo-schedule.ts` will have errors because they lack the new required fields (`date`, `category`, `totalPrice` as required). This is expected — we fix it in Task 3.

- [ ] **Step 6: Commit**

```bash
git add src/types/
git commit -m "feat: add type definitions for auth, customer, promo and extend Booking"
```

---

### Task 3: Update demo data with new required fields

**Files:**
- Modify: `src/data/demo-schedule.ts` — add `date`, `category`, `totalPrice` to all 27 bookings
- Create: `src/data/demo-customers.ts`
- Create: `src/data/demo-promos.ts`

- [ ] **Step 1: Update demo-schedule.ts**

Add to every existing booking object:
- `date: '2026-03-20'`
- `category: 'guest' as const`
- `totalPrice: <computed>` — use the booking's duration × hourly rate from `ROOM_PRICES`

Helper to compute: find room type from `demoRooms`, get `hourlyRate`, multiply by hours between `startTime` and `endTime`.

Also add 3 internal booking examples:
```typescript
{ id: '28', roomId: 'g01', date: '2026-03-20', startTime: '08:00', endTime: '08:30',
  status: 'confirmed', totalPrice: 0, category: 'internal',
  internalTag: 'cleaning', internalNote: 'Dọn phòng sau check-out', createdBy: 'Admin' },
{ id: '29', roomId: 'p102', date: '2026-03-20', startTime: '13:00', endTime: '15:00',
  status: 'confirmed', totalPrice: 0, category: 'internal',
  internalTag: 'maintenance', internalNote: 'Sửa điều hòa', createdBy: 'Admin' },
{ id: '30', roomId: 'p104', date: '2026-03-21', startTime: '00:00', endTime: '23:59',
  status: 'confirmed', totalPrice: 0, category: 'internal',
  internalTag: 'locked', internalNote: 'Đang trang trí lại', createdBy: 'Admin' },
```

- [ ] **Step 2: Create src/data/demo-customers.ts**

```typescript
import type { Customer } from '@/types/customer';

export const demoCustomers: Customer[] = [
  { id: 'c1', name: 'Nguyễn Văn A', phone: '0901234567', email: 'nguyenvana@gmail.com', note: 'VIP — Thích phòng yên tĩnh', createdAt: '2026-01-15' },
  { id: 'c2', name: 'Trần Thị B', phone: '0912345678', email: 'tranthib@yahoo.com', createdAt: '2026-02-01' },
  { id: 'c3', name: 'Lê Văn C', phone: '0987654321', email: 'levanc@gmail.com', note: 'VIP', createdAt: '2026-01-20' },
  { id: 'c4', name: 'Phạm Thị D', phone: '0976543210', createdAt: '2026-02-10' },
  { id: 'c5', name: 'Hoàng E', phone: '0965432109', email: 'hoange@gmail.com', createdAt: '2026-03-01' },
];
```

- [ ] **Step 3: Create src/data/demo-promos.ts**

```typescript
import type { PromoCode } from '@/types/promo';

export const demoPromos: PromoCode[] = [
  {
    id: 'pr1', code: 'SUMMER20', discountType: 'percent', discountValue: 20,
    maxUses: 50, usedCount: 5, startDate: '2026-03-01', endDate: '2026-03-31',
    applicableRoomTypes: [], status: 'active', createdAt: '2026-03-01',
  },
  {
    id: 'pr2', code: 'VIP50K', discountType: 'fixed', discountValue: 50000,
    maxUses: 20, usedCount: 12, startDate: '2026-03-01', endDate: '2026-04-15',
    applicableRoomTypes: ['vip', 'supervip'], status: 'active', createdAt: '2026-03-01',
  },
  {
    id: 'pr3', code: 'TETHOLIDAY', discountType: 'percent', discountValue: 15,
    maxUses: 50, usedCount: 50, startDate: '2026-01-15', endDate: '2026-02-28',
    applicableRoomTypes: [], status: 'expired', createdAt: '2026-01-15',
  },
];
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors (or only unrelated warnings).

- [ ] **Step 5: Commit**

```bash
git add src/data/
git commit -m "feat: update demo data with new booking fields, add customer and promo seeds"
```

---

### Task 4: Create service layer

**Files:**
- Create: `src/services/authService.ts`
- Create: `src/services/bookingService.ts`
- Create: `src/services/customerService.ts`
- Create: `src/services/promoService.ts`
- Create: `src/services/telegramService.ts`
- Create: `src/services/revenueService.ts`

Each service follows the same pattern:
1. Define a `STORAGE_KEY` constant
2. `init()` function seeds localStorage with demo data if empty
3. CRUD functions that read/write localStorage
4. Export individual functions (not a class)

- [ ] **Step 1: Create src/services/authService.ts**

```typescript
import type { UserRole, AuthState } from '@/types/auth';

const STORAGE_KEY = 'nhacam_auth';

const DEFAULT_STATE: AuthState = {
  currentRole: 'admin',
  userName: 'Admin',
};

export function getAuth(): AuthState {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATE));
    return DEFAULT_STATE;
  }
  return JSON.parse(stored);
}

export function getRole(): UserRole {
  return getAuth().currentRole;
}

export function setRole(role: UserRole): void {
  const state = getAuth();
  state.currentRole = role;
  state.userName = role === 'admin' ? 'Admin' : 'Staff';
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function isAdmin(): boolean {
  return getRole() === 'admin';
}

export function canPerform(action: string): boolean {
  const role = getRole();
  const staffAllowed = ['view_bookings', 'add_booking', 'change_status'];
  if (role === 'admin') return true;
  return staffAllowed.includes(action);
}
```

- [ ] **Step 2: Create src/services/bookingService.ts**

Key functions:
- `getAll(): Booking[]` — returns all bookings from localStorage
- `getByDate(date: string): Booking[]` — filter by date
- `getByRoom(roomId: string, date: string): Booking[]`
- `getById(id: string): Booking | undefined`
- `create(booking: Omit<Booking, 'id'>): Booking` — generates ID, saves, returns
- `update(id: string, data: Partial<Booking>): Booking`
- `remove(id: string): void`
- `hasConflict(roomId: string, date: string, startTime: string, endTime: string, excludeId?: string): boolean`
- `init(): void` — seed from demoBookings if localStorage empty

**Important:** Do NOT import or call other services (customerService, telegramService) from within bookingService. Cross-service side effects are wired at the component layer in Task 17. This avoids circular dependencies.

Full implementation: ~80 lines. Stores in localStorage key `nhacam_bookings`.

- [ ] **Step 3: Create src/services/customerService.ts**

Key functions:
- `getAll(): Customer[]`
- `getById(id: string): Customer | undefined`
- `search(query: string): Customer[]` — search by name, phone, email
- `getWithStats(customer: Customer): CustomerWithStats` — compute totalSpent, visitCount, lastVisit by reading `nhacam_bookings` from localStorage directly (NOT by importing bookingService)
- `getAllWithStats(): CustomerWithStats[]`
- `ensureCustomerExists(name: string, phone: string): Customer` — create if not exists
- `update(id: string, data: Partial<Customer>): Customer`
- `normalizePhone(phone: string): string` — strip spaces, dashes, +84→0
- `init(): void`

Stores in localStorage key `nhacam_customers`.

- [ ] **Step 4: Create src/services/promoService.ts**

Key functions:
- `getAll(): PromoCode[]`
- `getById(id: string): PromoCode | undefined`
- `getByCode(code: string): PromoCode | undefined`
- `create(promo: Omit<PromoCode, 'id' | 'usedCount' | 'createdAt'>): PromoCode`
- `update(id: string, data: Partial<PromoCode>): PromoCode`
- `remove(id: string): void`
- `validate(code: string, roomType: RoomType): { valid: boolean; error?: string; promo?: PromoCode }`
- `applyDiscount(promoId: string, originalPrice: number): number` — compute discounted price, increment usedCount
- `refreshStatuses(): void` — auto-expire promos past endDate or maxUses
- `init(): void`

Stores in localStorage key `nhacam_promos`.

- [ ] **Step 5: Create src/services/telegramService.ts**

Key functions:
- `getConfig(): TelegramConfig | null`
- `saveConfig(config: TelegramConfig): void`
- `getTemplate(): string` — returns stored or default template
- `saveTemplate(template: string): void`
- `notify(booking: Booking, event: string, roomName: string): void` — renders template, adds to log
- `getLog(): NotificationLogEntry[]`
- `sendTest(): void` — add test entry to log, show toast
- `init(): void`

Types (defined in the service file, not a separate type file since they're only used here):
```typescript
interface TelegramConfig {
  botToken: string;
  chatId: string;
}
interface NotificationLogEntry {
  id: string;
  timestamp: string;
  event: string;
  guestName: string;
  roomName: string;
  status: 'sent' | 'simulated' | 'skipped';
}
```

Stores in localStorage keys: `nhacam_telegram_config`, `nhacam_telegram_template`, `nhacam_telegram_log`.

- [ ] **Step 6: Create src/services/revenueService.ts**

Key functions:
- `getRevenueByPeriod(period: 'today' | 'week' | 'month'): RevenueSummary`
- `getOccupancyByRoom(period: 'today' | 'week' | 'month'): RoomOccupancy[]`
- `getTopCustomers(period: 'today' | 'week' | 'month', limit: number): TopCustomer[]`
- `getDailyRevenue(startDate: string, endDate: string): DailyRevenue[]`

Types (defined in the service file):
```typescript
interface RevenueSummary {
  totalRevenue: number;
  totalBookings: number;
  occupancyRate: number;
  avgPerBooking: number;
  revenueDelta: number;    // % change vs previous period
  bookingsDelta: number;   // count change vs previous period
}
interface RoomOccupancy {
  roomId: string;
  roomName: string;
  roomType: RoomType;
  occupancyPercent: number;
}
interface TopCustomer {
  name: string;
  totalSpent: number;
  visitCount: number;
}
interface DailyRevenue {
  date: string;
  revenue: number;
}
```

This service reads booking data directly from localStorage key `nhacam_bookings` and customer data from `nhacam_customers` — does NOT import bookingService or customerService to avoid circular dependencies. No own localStorage key.

- [ ] **Step 7: Verify all services compile**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 8: Commit**

```bash
git add src/services/
git commit -m "feat: add data service layer (auth, booking, customer, promo, telegram, revenue)"
```

---

## Chunk 2: Navigation & Routing

### Task 5: Install shadcn AlertDialog and Tabs components

**Files:**
- Create: `src/components/ui/alert-dialog.tsx` (via shadcn CLI)
- Create: `src/components/ui/tabs.tsx` (via shadcn CLI)

- [ ] **Step 1: Add AlertDialog and Tabs**

```bash
cd /home/tav/Documents/xproject-homestay/frontend
npx shadcn@latest add alert-dialog tabs
```

If the CLI doesn't work, manually create the files using the shadcn/ui source. Also install Radix dependencies if needed:
```bash
npm install @radix-ui/react-alert-dialog @radix-ui/react-tabs
```

Tabs are needed for BookingModal (Task 10) — two tabs: "Khách hàng" | "Nội bộ".

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/alert-dialog.tsx src/components/ui/tabs.tsx package.json package-lock.json
git commit -m "chore: add shadcn AlertDialog and Tabs components"
```

---

### Task 6: Update sidebar with new navigation items and role filtering

**Files:**
- Modify: `src/components/layouts/sidebar.tsx`

- [ ] **Step 1: Update NAV_ITEMS and add role filtering**

Replace the `NAV_ITEMS` array and add role-based filtering:

```typescript
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Tag,
  Send,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import * as authService from "@/services/authService"
import type { UserRole } from "@/types/auth"

const NAV_ITEMS: { label: string; icon: LucideIcon; to: string; roles: UserRole[] }[] = [
  { label: "Tổng quan", icon: LayoutDashboard, to: "/admin", roles: ['admin'] },
  { label: "Lịch phòng", icon: CalendarDays, to: "/admin/bookings", roles: ['admin', 'staff'] },
  { label: "Khách hàng", icon: Users, to: "/admin/customers", roles: ['admin'] },
  { label: "Khuyến mãi", icon: Tag, to: "/admin/promos", roles: ['admin'] },
  { label: "Telegram", icon: Send, to: "/admin/telegram", roles: ['admin'] },
  { label: "Cài đặt", icon: Settings, to: "/admin/settings", roles: ['admin'] },
]
```

In the render, filter by current role:
```typescript
const currentRole = authService.getRole()
const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(currentRole))
```

Then map `visibleItems` instead of `NAV_ITEMS`.

- [ ] **Step 2: Verify sidebar renders correctly**

```bash
npm run dev
```

Open browser → `/admin` → verify sidebar shows 6 items for Admin role.

- [ ] **Step 3: Commit**

```bash
git add src/components/layouts/sidebar.tsx
git commit -m "feat: update sidebar with new nav items and role-based filtering"
```

---

### Task 7: Update AdminLayout with role toggle dropdown

**Files:**
- Modify: `src/components/layouts/AdminLayout.tsx`

- [ ] **Step 1: Add role toggle to header bar**

In the header area (next to the avatar), add a dropdown using shadcn `DropdownMenu`:

```tsx
import * as authService from "@/services/authService"
import { useState } from "react"

// Inside the component:
const [role, setRole] = useState(authService.getRole())

const handleRoleChange = (newRole: UserRole) => {
  authService.setRole(newRole)
  setRole(newRole)
  window.location.reload() // Simple reload to reflect role change everywhere
}
```

Add dropdown next to avatar showing current role as badge + options to switch.

- [ ] **Step 2: Verify toggle works**

Open browser → click role dropdown → switch to Staff → sidebar should show only "Lịch phòng" → switch back to Admin → all items visible.

- [ ] **Step 3: Commit**

```bash
git add src/components/layouts/AdminLayout.tsx
git commit -m "feat: add role toggle dropdown to admin header"
```

---

### Task 8: Update routes in main.tsx

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: Add new route imports and route definitions**

Remove imports of placeholder pages (`AdminBookingsPage`, `AdminRoomsPage`). Keep `AdminSettingsPage`.

Add new imports:
```typescript
import { BookingSchedule } from '@/components/admin/booking-schedule'
import { CustomerList } from '@/components/admin/customer-list'
import { CustomerDetail } from '@/components/admin/customer-detail'
import { PromoManager } from '@/components/admin/promo-manager'
import { TelegramConfig } from '@/components/admin/telegram-config'
import { RevenueDashboard } from '@/components/admin/revenue-dashboard'
```

Update admin routes:
```tsx
<Route path="/admin" element={<AdminLayout />}>
  <Route index element={<RevenueDashboard />} />
  <Route path="bookings" element={<BookingSchedule />} />
  <Route path="customers" element={<CustomerList />} />
  <Route path="customers/:id" element={<CustomerDetail />} />
  <Route path="promos" element={<PromoManager />} />
  <Route path="telegram" element={<TelegramConfig />} />
  <Route path="settings" element={<AdminSettingsPage />} />
  <Route path="management" element={<RoomManagement />} />
</Route>
```

- [ ] **Step 2: Create placeholder components so routes don't break**

Create minimal placeholder for each new component (just renders the component name). These will be replaced in subsequent tasks. Each file:

```typescript
export function ComponentName() {
  return <div className="p-6"><h2 className="text-lg font-semibold">Component Name</h2><p className="text-slate-500">Coming soon...</p></div>
}
```

Create files:
- `src/components/admin/booking-schedule.tsx`
- `src/components/admin/booking-modal.tsx`
- `src/components/admin/customer-list.tsx`
- `src/components/admin/customer-detail.tsx`
- `src/components/admin/promo-manager.tsx`
- `src/components/admin/promo-modal.tsx`
- `src/components/admin/telegram-config.tsx`
- `src/components/admin/revenue-dashboard.tsx`

- [ ] **Step 3: Remove AdminDashboardPage, AdminBookingsPage, AdminRoomsPage from admin-pages.tsx**

Keep only `AdminSettingsPage` (and update its link to `/admin/management`). Delete the other three exported components. Also update the `AdminSettingsPage` content to remove references to old routes.

- [ ] **Step 4: Verify all routes work**

```bash
npm run dev
```

Navigate to each route: `/admin`, `/admin/bookings`, `/admin/customers`, `/admin/promos`, `/admin/telegram`, `/admin/settings`. Each should show placeholder text.

- [ ] **Step 5: Commit**

```bash
git add src/main.tsx src/components/admin/ src/components/layouts/admin-pages.tsx
git commit -m "feat: wire up new admin routes with placeholder components"
```

---

## Chunk 3: Module 1 — Booking Schedule

### Task 9: Implement BookingSchedule grid component

**Files:**
- Modify: `src/components/admin/booking-schedule.tsx` — replace placeholder with full grid

- [ ] **Step 1: Implement the booking schedule page**

The component should:
1. Import `bookingService`, `authService`, `demoRooms`
2. State: `selectedDate` (Date), `bookings` (Booking[]), `selectedBooking` (Booking | null), `showModal` (boolean), `modalMode` ('create' | 'edit'), `prefillData` (room + time)
3. On mount: call `bookingService.init()`, load bookings for today
4. Render:
   - Date picker at top
   - Grid table: rooms (Y) × time slots (X, 0-24 in 2h increments)
   - Booking blocks color-coded by status, internal blocks with diagonal stripe CSS
   - Empty cells with "+" button
   - Click booking → open modal (edit mode, Admin only)
   - Click "+" → open modal (create mode, pre-fill room + time)
5. On status change to `checked-out` → show confirm dialog "Thêm 30p dọn phòng?"
6. Color mapping:
   - confirmed → `bg-green-100 border-l-green-500`
   - pending → `bg-yellow-100 border-l-yellow-500`
   - checked-in → `bg-blue-100 border-l-blue-500`
   - checked-out → `bg-slate-100 border-l-slate-400`
   - cancelled → `bg-red-100 border-l-red-500`
   - internal → stripe pattern + tag-specific color

6. **Staff view for internal bookings:** If `authService.getRole() === 'staff'`, render internal booking blocks as plain gray "Không khả dụng" text (no tag, no note, no icon). Admin sees full detail (tag name, note, icon, createdBy).
7. **Right-click context menu:** On right-click of a guest booking block, show a context menu (use shadcn `DropdownMenu` triggered by `onContextMenu`) with option "Thêm dọn phòng sau" → creates a 30min cleaning block immediately after the booking's endTime.

This is a large component (~250-350 lines). Keep grid rendering logic inline — don't extract sub-components yet.

- [ ] **Step 2: Verify grid renders with demo data**

```bash
npm run dev
```

Navigate to `/admin/bookings` → should see grid with rooms and booking blocks for today's date.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/booking-schedule.tsx
git commit -m "feat: implement booking schedule grid with status colors and internal blocks"
```

---

### Task 10: Implement BookingModal (create/edit)

**Files:**
- Modify: `src/components/admin/booking-modal.tsx` — replace placeholder

- [ ] **Step 1: Implement the booking modal**

Uses shadcn `Dialog` component for the modal wrapper and shadcn `Tabs` (installed in Task 5) for the two tabs: "Khách hàng" | "Nội bộ".

Props:
```typescript
interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  booking?: Booking;           // existing booking for edit mode
  prefillRoomId?: string;
  prefillDate?: string;
  prefillStartTime?: string;
  prefillEndTime?: string;
  onSave: (booking: Omit<Booking, 'id'> | Booking) => void;
  onDelete?: (id: string) => void;
}
```

Guest tab fields: room (select), date, start time, end time, guest name, phone, status, voucher, note.
Internal tab fields: room, date, start time, end time, tag selector (4 options with icons), internal note.

Validation with Zod:
- endTime > startTime
- guestName required for guest bookings
- Phone format validation
- Conflict check via `bookingService.hasConflict()`
- Voucher validation via `promoService.validate()` (inline error/success)

Delete button visible only in edit mode + Admin role.

- [ ] **Step 2: Wire modal to BookingSchedule**

In `booking-schedule.tsx`, add `<BookingModal>` and connect all handlers:
- `onSave` → calls `bookingService.create()` or `bookingService.update()`, refreshes grid
- `onDelete` → shows AlertDialog confirmation, then `bookingService.remove()`

- [ ] **Step 3: Test full CRUD flow**

Verify: create booking → appears on grid → click to edit → change fields → save → reflected → delete → gone.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/booking-modal.tsx src/components/admin/booking-schedule.tsx
git commit -m "feat: add booking modal with CRUD, validation, promo integration"
```

---

## Chunk 4: Module 2 — Customer Management

### Task 11: Implement CustomerList page

**Files:**
- Modify: `src/components/admin/customer-list.tsx` — replace placeholder

- [ ] **Step 1: Implement the customer list page**

Features:
1. Search bar with debounce (300ms) — filter by name, phone, email
2. Sort dropdown: "Gần nhất" | "Chi tiêu cao nhất" | "Đặt nhiều nhất" | "A→Z"
3. Table with columns: avatar (initials, colored circle), name + email, phone, visit count (badge), total spent, last visit, note/VIP tag
4. Pagination (10 per page)
5. Click row → `navigate('/admin/customers/' + id)`
6. Empty state: centered message "Chưa có khách hàng nào..."

Data source: `customerService.getAllWithStats()` — returns `CustomerWithStats[]` with computed fields.

Use `formatPrice()` from `@/utils/helpers` for VND formatting.

Avatar initials: take first letter of each word in name (max 2 letters).

- [ ] **Step 2: Verify list renders with demo data**

Navigate to `/admin/customers` → should see 5 customers with stats.

- [ ] **Step 3: Test search and sort**

Type in search → results filter. Change sort → order changes.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/customer-list.tsx
git commit -m "feat: implement customer list with search, sort, and pagination"
```

---

### Task 12: Implement CustomerDetail page

**Files:**
- Modify: `src/components/admin/customer-detail.tsx` — replace placeholder

- [ ] **Step 1: Implement the customer detail page**

Uses `useParams()` to get `:id` from route.

Sections:
1. Header: avatar (large), name, phone, email, "Sửa ghi chú" button
2. 4 stat cards: total spent (rose), visit count, last visit date, note (editable)
3. Booking history table: date, room (with VIP badge), time, price (strikethrough if voucher), status badge, promo code
4. "Phòng hay đặt nhất" — count bookings per room, display top 3

Data: `customerService.getById(id)` → then `customerService.getWithStats(customer)`.
Booking history: `bookingService.getAll()` filtered by `guestPhone` matching customer phone.

Edit note: click button → inline textarea appears → save calls `customerService.update()`.

Empty state for no bookings: "Khách hàng chưa có lịch sử đặt phòng."

- [ ] **Step 2: Verify detail page**

Click a customer in list → detail page loads with stats and booking history.

- [ ] **Step 3: Test note editing**

Click "Sửa ghi chú" → type → save → verify persisted after page refresh.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/customer-detail.tsx
git commit -m "feat: implement customer detail page with stats and booking history"
```

---

## Chunk 5: Module 3 — Promotion Codes

### Task 13: Implement PromoManager page

**Files:**
- Modify: `src/components/admin/promo-manager.tsx` — replace placeholder

- [ ] **Step 1: Implement the promo list page**

Features:
1. Toolbar: "+ Tạo mã mới" button (opens modal), filter dropdown (Tất cả / Hoạt động / Hết hạn / Vô hiệu)
2. Summary line: "Hoạt động: N · Hết hạn: M"
3. Table: code (monospace badge), discount type+value, room types (chip badges), used/max, expiry date, status badge, edit/delete actions
4. Expired rows: `opacity-50`
5. Delete: AlertDialog confirmation "Xóa mã khuyến mãi [CODE]?"
6. Empty state: "Chưa có mã khuyến mãi..."
7. On mount: call `promoService.refreshStatuses()` to auto-expire

Room type display mapping: `standard` → "Standard", `vip` → "VIP", `supervip` → "SuperVIP". Empty array → "Tất cả".

- [ ] **Step 2: Verify list renders**

Navigate to `/admin/promos` → 3 demo promos visible, TETHOLIDAY shown faded.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/promo-manager.tsx
git commit -m "feat: implement promo code list with filter and auto-expire"
```

---

### Task 14: Implement PromoModal (create/edit)

**Files:**
- Modify: `src/components/admin/promo-modal.tsx` — replace placeholder

- [ ] **Step 1: Implement the promo modal**

Props:
```typescript
interface PromoModalProps {
  open: boolean;
  onClose: () => void;
  promo?: PromoCode;         // undefined = create mode
  onSave: (data: Omit<PromoCode, 'id' | 'usedCount' | 'createdAt'>) => void;
}
```

Fields:
1. Code input (uppercase, validated: `/^[A-Z0-9]{3,20}$/`, unique check)
2. Discount type toggle: % | VND (segmented button)
3. Value input (label changes: "%" or "VND")
4. Max uses input (number)
5. Start date / end date (date inputs)
6. Room type chips: "Tất cả" (selected = empty array), "Standard", "VIP", "SuperVIP" (multi-select toggle)
7. Live preview box: "Mã SUMMER20 giảm 20% cho tất cả phòng. Hiệu lực 01/03 – 31/03. Còn 45/50 lần."

Validation (Zod): code pattern, percent 1-100, fixed 1000-10000000, maxUses 1-99999, endDate > startDate.

- [ ] **Step 2: Wire modal to PromoManager**

Add create/edit handlers. On save: `promoService.create()` or `promoService.update()`, refresh list.

- [ ] **Step 3: Test full CRUD**

Create new promo → appears in list → edit → change values → save → reflected → delete → gone.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/promo-modal.tsx src/components/admin/promo-manager.tsx
git commit -m "feat: add promo modal with validation, preview, and room type selection"
```

---

## Chunk 6: Module 4 — Telegram Notifications

### Task 15: Implement TelegramConfig page

**Files:**
- Modify: `src/components/admin/telegram-config.tsx` — replace placeholder

- [ ] **Step 1: Implement the full Telegram config page**

Three sections side by side or stacked:

**Section 1: Bot Configuration**
- Connection status indicator (green/gray dot + text)
- Bot Token input (type=password for masking, toggle show/hide)
- Chat ID input
- "Lưu cấu hình" button → `telegramService.saveConfig()` → toast "Đã lưu!"
- "Gửi tin test" button → `telegramService.sendTest()` → toast "Đã gửi tin test!"

**Section 2: Message Template (left) + Preview (right)**
- Left: `<textarea>` with template text, variable chips below (click to insert at cursor)
- Right: Telegram-style dark bubble preview with mock data substituted
- Variables: `{{guestName}}`, `{{guestPhone}}`, `{{roomName}}`, `{{startTime}}`, `{{endTime}}`, `{{date}}`, `{{totalPrice}}`, `{{promoCode}}`, `{{status}}`
- Save template button → `telegramService.saveTemplate()`

**Section 3: Notification events + Log**
- Two info boxes: "Tự động gửi khi..." and "Không gửi khi..."
- Table: timestamp, event, guest+room, status badge
- Data: `telegramService.getLog()`
- Empty state: "Chưa có thông báo nào."

- [ ] **Step 2: Verify config page**

Navigate to `/admin/telegram` → fill in token + chat ID → save → reload → values persisted. Type in template → preview updates live.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/telegram-config.tsx
git commit -m "feat: implement Telegram config with template editor, preview, and notification log"
```

---

## Chunk 7: Module 5 — Revenue Dashboard

### Task 16: Implement RevenueDashboard page

**Files:**
- Modify: `src/components/admin/revenue-dashboard.tsx` — replace placeholder

- [ ] **Step 1: Implement the revenue dashboard**

Sections (uses `revenueService`):

**Period Selector:**
```tsx
const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week')
```
Three toggle buttons. On change → all sections refresh.

**4 Stat Cards:**
Grid of 4 colored cards. Each shows: label, large number, delta indicator (↑/↓ + % or count).
Colors: rose (revenue), green (bookings), blue (occupancy), purple (avg).

**Revenue Trend Chart (recharts):**
```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
```
Use `AreaChart` with gradient fill. Data from `revenueService.getDailyRevenue()`.

**Occupancy by Room:**
Horizontal bars per room. Data from `revenueService.getOccupancyByRoom()`.
Colors: green for standard, rose for vip, purple for supervip.
Font sizes per spec: room name 15px bold, percentage 15px semi-bold, bar 12px height.

**Top 5 Customers:**
Ranked list. Data from `revenueService.getTopCustomers()`.
#1 row: gold background (#FFFBEB). Font sizes per spec: name 15px bold, amount 16px extra-bold rose.

Empty states for each section when no data.

**Staff redirect:** If `authService.getRole() === 'staff'`, use `<Navigate to="/admin/bookings" />`.

- [ ] **Step 2: Verify dashboard renders**

Navigate to `/admin` → stats, chart, occupancy bars, top customers all visible with demo data. Toggle periods → data changes.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/revenue-dashboard.tsx
git commit -m "feat: implement revenue dashboard with stats, chart, occupancy, and top customers"
```

---

## Chunk 8: Integration & Polish

### Task 17: Wire up cross-module integrations

**Files:**
- Modify: `src/components/admin/booking-schedule.tsx` — wire cross-service side effects in component handlers

**Important:** All cross-service calls happen in component event handlers, NOT inside service modules. This respects the circular dependency strategy defined in the plan header.

- [ ] **Step 1: Wire side effects in BookingSchedule component handlers**

In `booking-schedule.tsx`, update the `onSave` handler (called when BookingModal saves):

```typescript
import * as customerService from '@/services/customerService'
import * as telegramService from '@/services/telegramService'

const handleBookingSave = (bookingData: ...) => {
  const saved = mode === 'create'
    ? bookingService.create(bookingData)
    : bookingService.update(bookingData.id, bookingData)

  // Cross-service side effects (at component layer, not service layer):
  if (saved.category === 'guest') {
    // Auto-create customer if phone doesn't exist
    if (saved.guestPhone && saved.guestName) {
      customerService.ensureCustomerExists(saved.guestName, saved.guestPhone)
    }
    // Telegram notification for new guest bookings
    if (mode === 'create') {
      const room = demoRooms.find(r => r.id === saved.roomId)
      telegramService.notify(saved, 'new_booking', room?.name || saved.roomId)
    }
  }

  // Status change notifications
  if (mode === 'edit' && saved.category === 'guest') {
    if (saved.status === 'confirmed') {
      telegramService.notify(saved, 'confirmed', ...)
    } else if (saved.status === 'checked-in') {
      telegramService.notify(saved, 'checked_in', ...)
    }
  }

  refreshBookings()
}
```

- [ ] **Step 2: Add cleaning prompt after checkout**

When a booking status is changed to `checked-out` in the save handler:
1. Show AlertDialog: "Thêm 30p dọn phòng sau checkout?"
2. If confirmed → `bookingService.create()` with `category: 'internal'`, `internalTag: 'cleaning'`, startTime = booking.endTime, endTime = booking.endTime + 30min

- [ ] **Step 3: Verify integrations**

1. Create a guest booking → check customer appears in `/admin/customers` → check telegram log at `/admin/telegram`
2. Edit booking → change status to confirmed → telegram log shows "confirmed" event
3. Check-out a booking → cleaning prompt appears → accept → cleaning block appears on grid

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/booking-schedule.tsx
git commit -m "feat: wire cross-module integrations (customer auto-create, telegram, cleaning prompt)"
```

---

### Task 18: Initialize all services on app load

**Files:**
- Modify: `src/main.tsx` — add service initialization

- [ ] **Step 1: Add init calls**

At the top level of `main.tsx`, before rendering, call init on all services:

```typescript
import * as bookingService from '@/services/bookingService'
import * as customerService from '@/services/customerService'
import * as promoService from '@/services/promoService'
import * as telegramService from '@/services/telegramService'

// Initialize services (seed localStorage with demo data)
bookingService.init()
customerService.init()
promoService.init()
telegramService.init()
```

- [ ] **Step 2: Verify app loads correctly with seeded data**

Clear localStorage → refresh → all pages should show demo data.

- [ ] **Step 3: Commit**

```bash
git add src/main.tsx
git commit -m "feat: initialize all services with demo data on app load"
```

---

### Task 19: Final verification and cleanup

- [ ] **Step 1: Full smoke test**

Navigate through every route and verify:
1. `/admin` — revenue dashboard with stats, chart, occupancy, top customers
2. `/admin/bookings` — grid with bookings + internal blocks, create/edit/delete works
3. `/admin/customers` — list with search/sort, click → detail with history
4. `/admin/promos` — list with filter, create/edit/delete, expired shown faded
5. `/admin/telegram` — config saves, template preview works, log shows entries
6. `/admin/settings` — existing page still works
7. Role toggle → switch to Staff → only bookings visible, can't edit/delete

- [ ] **Step 2: Fix any TypeScript errors**

```bash
npx tsc --noEmit
```

Fix all errors if any.

- [ ] **Step 3: Verify dev server runs clean**

```bash
npm run dev
```

No console errors, no warnings.

- [ ] **Step 4: Build production**

```bash
npm run build
```

Must succeed without errors.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve any remaining TypeScript and build issues"
```

---

## Summary

| Task | Module | Files | Estimated |
|------|--------|-------|-----------|
| 1 | Setup | package.json | 2 min |
| 2 | Types | 4 files (types/) | 10 min |
| 3 | Data | 3 files (data/) | 15 min |
| 4 | Services | 6 files (services/) | 45 min |
| 5 | UI | alert-dialog | 2 min |
| 6 | Nav | sidebar.tsx | 10 min |
| 7 | Nav | AdminLayout.tsx | 10 min |
| 8 | Routes | main.tsx + 8 placeholders | 15 min |
| 9 | Booking | booking-schedule.tsx | 30 min |
| 10 | Booking | booking-modal.tsx | 30 min |
| 11 | Customer | customer-list.tsx | 25 min |
| 12 | Customer | customer-detail.tsx | 25 min |
| 13 | Promo | promo-manager.tsx | 20 min |
| 14 | Promo | promo-modal.tsx | 25 min |
| 15 | Telegram | telegram-config.tsx | 30 min |
| 16 | Revenue | revenue-dashboard.tsx | 30 min |
| 17 | Integration | services + schedule | 15 min |
| 18 | Init | main.tsx | 5 min |
| 19 | Polish | All | 15 min |
| **Total** | | **~30 files** | **~5-6 hours** |
