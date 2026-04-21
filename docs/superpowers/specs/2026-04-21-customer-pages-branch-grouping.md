# Customer Pages — Branch Grouping Redesign

## Overview

Redesign `/phong-nghi` and `/dat-phong` customer pages to group content by branch using tabs. Homepage (`/`) is unchanged.

## Pages

### 1. `/phong-nghi` — Room Listing by Branch

**Layout:** Tab bar at top to switch branches. Room card grid below shows only rooms of the active branch.

**Tab bar:**
- Fetch all branches via `branchService.getAll()`
- Each tab = one branch name
- Default: first branch active
- Style: bottom-border underline on active tab, consistent with existing UI (`border-b-2 border-primary` for active, `text-muted-foreground` for inactive)

**Room cards grid:**
- Reuse existing `GalleryGrid` + `room-card.tsx` component (collage image layout, `rounded-2xl bg-white p-3 shadow-sm hover:scale-[1.02]`)
- Filter rooms by `branchId` matching active tab
- Fetch all rooms once via `roomService.getAll()`, group client-side by `branchId`
- `RoomTypeBadge` overlay on card image (existing behavior)

**Room card actions:**
- Click **image or room name** → navigate to `/phong-nghi/:id` (existing room detail page)
- Click **"Dat Phong" button** → navigate to `/dat-phong?roomId=<id>` (booking schedule, auto-expand that room)

**"Dat Phong" button on card:**
- New element added below price line in `room-card.tsx`
- Style: `bg-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-primary-hover` (uses nhacam design tokens)
- `onClick` stops propagation (prevents card-level navigation to detail page)
- Uses `useNavigate()` to push `/dat-phong?roomId=<id>`

**Rooms without branchId:**
- If `room.branchId` is null, exclude from display (only show rooms assigned to a branch)

### 2. `/dat-phong` — Booking Schedule by Branch

**Layout:** Tab bar for branches + date picker in top bar. Timeline grid shows rooms of active branch only.

**Top bar (inside existing `bg-card rounded-xl shadow-sm border` container):**
- Left: existing date navigation (prev/next arrows + date display)
- Right: branch tabs (same styling as `/phong-nghi`)
- Below or inline: existing room type filter buttons (Standard / VIP / SuperVip)

**Timeline grid:**
- Reuse existing `RoomSchedule` component
- Pass filtered rooms based on active branch tab
- All existing functionality preserved: 30-min slots, booking blocks, cleaning display, overnight support, current time indicator

**Expand inline (click room):**
- Click room name label → that room enters "focused" state
- Focused room: row expands height (`ROW_HEIGHT` 60→90px), rose highlight border (`border-2 border-primary rounded-lg bg-primary/5`), room info shows type + "Bo chon" link
- `focusedRoomId` prop passed from `BookingPage` → `RoomSchedule` (set from URL param on mount, or from room name click inside schedule). Callback `onFocusChange(roomId | null)` lifts state back up.
- Other rooms: `opacity-35` dim effect
- Click "Bo chon" or click focused room name again → exit focus, all rooms return to normal
- Booking slot clicks still work on all rooms (focused or dimmed) — focus is visual only, not functional lock

**URL param `?roomId=xxx`:**
- On mount, read `roomId` from search params
- If present, find which branch owns that room, set that branch tab active, auto-focus that room
- Works as entry point from `/phong-nghi` "Dat Phong" button

**Branch tab switch:**
- Clears any focused room
- Reloads rooms for new branch (client-side filter, no extra API call)
- Preserves selected date

## Data Flow

```
branchService.getAll() → branches[]
roomService.getAll()   → rooms[] (each has branchId)

Client groups: Map<branchId, Room[]>

Tab switch → filter rooms by branchId → pass to grid/schedule
```

No new API endpoints needed. Existing `GET /branches` and `GET /rooms` already return all data.

Bookings: existing `bookingService.getByDate(dateStr)` fetches all bookings for the date. Client filters by roomId based on active branch.

## Component Changes

### Modified Files

| File | Change |
|------|--------|
| `components/rest-room/RestRoomPage.tsx` | Add branch tabs, group rooms by branch, remove `?branchId` URL param logic (tabs replace it) |
| `components/rooms/room-card.tsx` | Add "Dat Phong" button with `stopPropagation` + navigate to `/dat-phong?roomId=` |
| `components/booking/BookingPage.tsx` | Add branch tabs, pass filtered rooms to RoomSchedule, read `?roomId` param |
| `components/schedule/room-schedule.tsx` | Add `focusedRoomId` state, expand/dim logic, "Bo chon" UI in room label |

### No New Files

All changes fit within existing components. No new components, services, or utilities needed.

## Styling Constraints

All new UI must use existing design tokens:

- **Primary color:** `bg-primary` / `text-primary` (rose-400 `#F87171`)
- **Card surface:** `bg-card` (white)
- **Background:** `bg-background` (warm off-white)
- **Border:** `border-border` (slate-200)
- **Text hierarchy:** `text-[#2B2B2B]` for titles, `text-muted-foreground` for secondary
- **Room type badges:** existing `RoomTypeBadge` component unchanged
- **Border radius:** `rounded-xl` for containers, `rounded-2xl` for cards, `rounded-lg` for buttons
- **Shadows:** `shadow-sm` for cards, no custom shadows
- **Transitions:** `transition-all duration-300` for tab switches, `transition-opacity` for dim/expand
- **Hover effects:** `hover:scale-[1.02]` on cards (existing), `hover:bg-primary-hover` on buttons
- **Font family:** Inter (inherited from `--font-sans`)
- **Tab active state:** `font-semibold text-foreground border-b-2 border-primary`
- **Tab inactive state:** `text-muted-foreground hover:text-foreground`

## Edge Cases

- **No branches exist:** Show empty state message "Chua co chi nhanh nao"
- **Branch has no rooms:** Show empty state under that tab "Chi nhanh nay chua co phong"
- **`?roomId` points to non-existent room:** Ignore param, show default view
- **`?roomId` room has null branchId:** Ignore param, show default view
- **Mobile responsive:** Tabs scroll horizontally if many branches (overflow-x-auto)
