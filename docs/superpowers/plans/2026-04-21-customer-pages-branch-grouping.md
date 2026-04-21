# Customer Pages — Branch Grouping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/phong-nghi` and `/dat-phong` customer pages to group rooms by branch using tabs, add "Dat Phong" button on room cards, and add focus/expand inline behavior on the booking schedule.

**Architecture:** Both pages fetch all branches + rooms on mount, group client-side by `branchId`. A shared tab bar component pattern (not extracted — inline in each page) switches the active branch. RoomSchedule gains `focusedRoomId` / `onFocusChange` props for the expand-inline behavior. URL param `?roomId=xxx` on `/dat-phong` auto-selects the correct branch tab and focuses that room.

**Tech Stack:** React 19, React Router 7, Tailwind CSS v4, Framer Motion, shadcn/ui, existing design tokens from `index.css`.

**Spec:** `docs/superpowers/specs/2026-04-21-customer-pages-branch-grouping.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `frontend/src/components/rooms/room-card.tsx` | Modify | Add "Dat Phong" button with stopPropagation + navigate |
| `frontend/src/components/rest-room/RestRoomPage.tsx` | Modify | Replace `?branchId` URL param with branch tabs, fetch branches, group rooms |
| `frontend/src/types/schedule.ts` | Modify | Add `focusedRoomId` and `onFocusChange` to `ScheduleProps` |
| `frontend/src/components/schedule/room-schedule.tsx` | Modify | Accept focus props, expand/dim rows, "Bo chon" UI |
| `frontend/src/components/booking/BookingPage.tsx` | Modify | Add branch tabs, filter rooms by branch, read `?roomId` param, pass focus props |

---

### Task 1: Add "Dat Phong" button to room card

**Files:**
- Modify: `frontend/src/components/rooms/room-card.tsx`

- [ ] **Step 1: Add `id` to destructured props and `useNavigate` import**

```tsx
// room-card.tsx — line 1, add import
import { useNavigate } from "react-router"

// line 26 — add id to destructured props
export function RoomCard({ id, title, price, images, type }: RoomCardProps) {
  const navigate = useNavigate()
```

- [ ] **Step 2: Add "Dat Phong" button below the info section**

Insert after the closing `</div>` of the info section (after line 66), before `</motion.div>`:

```tsx
      {/* "Dat Phong" button — navigates to /dat-phong?roomId=id */}
      {id && (
        <div className="px-1 pb-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/dat-phong?roomId=${id}`)
            }}
            className="w-full bg-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            Đặt Phòng
          </button>
        </div>
      )}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors (id is already optional in `RoomCardProps`)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/rooms/room-card.tsx
git commit -m "feat(frontend): add Dat Phong button to room card with navigate to /dat-phong?roomId="
```

---

### Task 2: Redesign RestRoomPage with branch tabs

**Files:**
- Modify: `frontend/src/components/rest-room/RestRoomPage.tsx`

- [ ] **Step 1: Replace the entire file content**

The current page uses `?branchId` URL param. Replace with branch tabs and client-side grouping:

```tsx
import { useState, useEffect, useMemo } from "react"
import { GalleryGrid } from "../gallery-grid"
import { getAll, imageUrl } from "@/services/roomService"
import * as branchService from "@/services/branchService"
import { formatPrice } from "@/utils/helpers"
import type { RoomDetail } from "@/types/room"
import type { Branch } from "@/types/branch"
import type { RoomCardProps } from "../rooms/room-card"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

function shortPrice(amount: number): string {
    if (amount >= 1000) {
        const k = amount / 1000
        return `${k % 1 === 0 ? k : k.toFixed(0)}K`
    }
    return formatPrice(amount)
}

function toRoomCardProps(room: RoomDetail): RoomCardProps {
    const parts: string[] = []
    if (room.combo3hRate > 0) parts.push(`3H/${shortPrice(room.combo3hRate)}`)
    else if (room.hourlyRate > 0) parts.push(`${shortPrice(room.hourlyRate)}/giờ`)
    if (room.combo6h1hRate > 0) parts.push(`6H+1H/${shortPrice(room.combo6h1hRate)}`)
    if (room.overnightRate > 0) parts.push(`Qua đêm/${shortPrice(room.overnightRate)}`)

    return {
        id: room.id,
        title: room.name,
        price: parts.join(' • ') || 'Liên hệ',
        images: room.images.map(imageUrl),
        type: room.type,
    }
}

export const RestRoomPage = () => {
    const [branches, setBranches] = useState<Branch[]>([])
    const [rooms, setRooms] = useState<RoomDetail[]>([])
    const [activeBranchId, setActiveBranchId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [branchData, roomData] = await Promise.all([
                    branchService.getAll(),
                    getAll(),
                ])
                setBranches(branchData)
                setRooms(roomData)
                if (branchData.length > 0) {
                    setActiveBranchId(branchData[0].id)
                }
            } catch {
                // silently fail
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const filteredRooms = useMemo(() => {
        if (!activeBranchId) return []
        return rooms.filter((r) => r.branchId === activeBranchId)
    }, [rooms, activeBranchId])

    const roomItems: RoomCardProps[] = filteredRooms.map(toRoomCardProps)
    const activeBranch = branches.find((b) => b.id === activeBranchId)

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (branches.length === 0) {
        return (
            <div className="flex flex-col gap-6 pb-20 pt-8">
                <div className="px-8">
                    <h1 className="text-[28px] font-extrabold text-[#2B2B2B] tracking-tight">Danh sách phòng</h1>
                </div>
                <div className="flex justify-center py-12">
                    <p className="text-sm text-muted-foreground">Chưa có chi nhánh nào</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 pb-20 pt-8">
            <div className="px-8">
                <h1 className="text-[28px] font-extrabold text-[#2B2B2B] tracking-tight">Phòng Nghỉ</h1>
                {activeBranch && (
                    <p className="mt-1 text-sm text-[#9B8B7A]">{activeBranch.address}</p>
                )}
            </div>

            {/* Branch tabs */}
            <div className="px-8">
                <div className="flex gap-1 border-b-2 border-border overflow-x-auto">
                    {branches.map((branch) => (
                        <button
                            key={branch.id}
                            type="button"
                            onClick={() => setActiveBranchId(branch.id)}
                            className={cn(
                                'px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors -mb-[2px]',
                                activeBranchId === branch.id
                                    ? 'font-semibold text-foreground border-b-2 border-primary'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {branch.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Room cards grid */}
            {roomItems.length > 0 ? (
                <GalleryGrid items={roomItems} />
            ) : (
                <div className="flex justify-center py-12">
                    <p className="text-sm text-muted-foreground">Chi nhánh này chưa có phòng</p>
                </div>
            )}
        </div>
    )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/rest-room/RestRoomPage.tsx
git commit -m "feat(frontend): redesign RestRoomPage with branch tabs and client-side room grouping"
```

---

### Task 3: Add focus props to ScheduleProps and RoomRow

**Files:**
- Modify: `frontend/src/types/schedule.ts` (lines 66-78)
- Modify: `frontend/src/components/schedule/room-schedule.tsx`

- [ ] **Step 1: Add `branchId` to `Room` interface and extend `ScheduleProps`**

In `frontend/src/types/schedule.ts`, add `branchId` to the `Room` interface (after the `type` field):

```ts
  branchId?: string | null;
```

And add two new fields to `ScheduleProps` (after `endHour` on line 75):

```ts
  focusedRoomId?: string | null;
  onFocusChange?: (roomId: string | null) => void;
```

- [ ] **Step 2: Extend RoomRowProps and apply focus styling**

In `frontend/src/components/schedule/room-schedule.tsx`, update the `RoomRowProps` interface (line 266) to add:

```ts
interface RoomRowProps {
    room: Room;
    bookings: Booking[];
    startHour: number;
    endHour: number;
    selectedDate: Date;
    currentTime: Date;
    onBookingClick?: (booking: Booking) => void;
    onEmptySlotClick?: (roomId: string, time: string) => void;
    isFocused?: boolean;
    isDimmed?: boolean;
    onRoomNameClick?: (roomId: string) => void;
}
```

- [ ] **Step 3: Update RoomRow component to accept focus props and render focus/dim state**

Update the `RoomRow` component (line 277). Add the new props to destructuring:

```tsx
const RoomRow: React.FC<RoomRowProps> = ({
    room,
    bookings,
    startHour,
    endHour,
    selectedDate,
    currentTime,
    onBookingClick,
    onEmptySlotClick,
    isFocused = false,
    isDimmed = false,
    onRoomNameClick,
}) => {
```

Replace the outer `<div>` (line 300) with focus/dim aware styling:

```tsx
    const rowHeight = isFocused ? 90 : ROW_HEIGHT;

    return (
        <div
            className={cn(
                'flex border-b border-border transition-all duration-300',
                isFocused && 'border-2 border-primary rounded-lg bg-primary/5',
                isDimmed && 'opacity-35',
            )}
            style={{ height: rowHeight }}
        >
```

Replace the room label `<div>` (lines 301-312) with a clickable version that shows "Bo chon" when focused:

```tsx
            <div
                className={cn(
                    'flex flex-col items-center justify-center gap-1 text-[#374151] text-sm shrink-0 font-semibold sticky left-0 z-10 rounded-md m-1',
                    isFocused ? 'bg-primary/5' : 'bg-card',
                )}
                style={{ width: ROOM_LABEL_WIDTH }}
            >
                <button
                    type="button"
                    onClick={() => onRoomNameClick?.(room.id)}
                    className="hover:text-primary transition-colors"
                >
                    {room.name}
                </button>
                <RoomTypeBadge type={room.type} size="sm" />
                {isFocused && (
                    <button
                        type="button"
                        onClick={() => onRoomNameClick?.(room.id)}
                        className="text-[10px] text-primary hover:underline"
                    >
                        ✕ Bỏ chọn
                    </button>
                )}
            </div>
```

- [ ] **Step 4: Update RoomSchedule to wire focus props through**

In the `RoomSchedule` component (line 436), destructure the new props:

```tsx
export const RoomSchedule: React.FC<ScheduleProps> = ({
    date,
    rooms,
    bookings,
    onDateChange,
    onBookingClick,
    onEmptySlotClick,
    onBookingCreate,
    startHour = 0,
    endHour = 24,
    focusedRoomId,
    onFocusChange,
}) => {
```

Add a handler for room name clicks (after `handleBookingCreate`, around line 540):

```tsx
    const handleRoomNameClick = useCallback((roomId: string) => {
        if (focusedRoomId === roomId) {
            onFocusChange?.(null)
        } else {
            onFocusChange?.(roomId)
        }
    }, [focusedRoomId, onFocusChange])
```

Update the `RoomRow` rendering (line 619-631) to pass focus props:

```tsx
                            {filteredRooms.map((room) => (
                                <RoomRow
                                    key={room.id}
                                    room={room}
                                    bookings={getBookingsForRoom(room.id)}
                                    startHour={startHour}
                                    endHour={endHour}
                                    selectedDate={selectedDate}
                                    currentTime={currentTime}
                                    onBookingClick={onBookingClick}
                                    onEmptySlotClick={handleEmptySlotClick}
                                    isFocused={focusedRoomId === room.id}
                                    isDimmed={focusedRoomId != null && focusedRoomId !== room.id}
                                    onRoomNameClick={handleRoomNameClick}
                                />
                            ))}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Run tests**

Run: `cd frontend && npx vitest run`
Expected: 53/53 pass (no test changes needed — existing tests don't test focus behavior)

- [ ] **Step 7: Commit**

```bash
git add frontend/src/types/schedule.ts frontend/src/components/schedule/room-schedule.tsx
git commit -m "feat(frontend): add focusedRoomId expand/dim behavior to RoomSchedule"
```

---

### Task 4: Redesign BookingPage with branch tabs and focus integration

**Files:**
- Modify: `frontend/src/components/booking/BookingPage.tsx`

- [ ] **Step 1: Replace the entire file content**

The current page loads all rooms flat. Replace with branch tabs, `?roomId` param support, and focus state:

```tsx
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Booking, Room, RoomType } from '@/types/schedule'
import type { Branch } from '@/types/branch'
import { RoomSchedule } from '@/components/schedule/room-schedule'
import * as roomService from '@/services/roomService'
import * as bookingService from '@/services/bookingService'
import * as branchService from '@/services/branchService'
import { formatDateInput } from '@/utils/helpers'
import { Loader2 } from 'lucide-react'

export const BookingPage = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [date, setDate] = useState(new Date())
    const [branches, setBranches] = useState<Branch[]>([])
    const [allRooms, setAllRooms] = useState<Room[]>([])
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [activeBranchId, setActiveBranchId] = useState<string | null>(null)
    const [focusedRoomId, setFocusedRoomId] = useState<string | null>(null)

    // On mount: load branches + rooms, resolve ?roomId param
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [branchData, roomData] = await Promise.all([
                    branchService.getAll(),
                    roomService.getAll(),
                ])
                setBranches(branchData)

                const mappedRooms = roomData.map((r) => ({
                    id: r.id,
                    name: r.name,
                    type: r.type as RoomType,
                    branchId: r.branchId,
                    amenities: r.amenities || [],
                    hourlyRate: r.hourlyRate,
                    dailyRate: r.dailyRate,
                    overnightRate: r.overnightRate,
                    extraHourRate: r.extraHourRate,
                    combo3hRate: r.combo3hRate,
                    combo6h1hRate: r.combo6h1hRate,
                    combo6h1hDiscount: r.combo6h1hDiscount,
                }))
                setAllRooms(mappedRooms)

                // Resolve ?roomId → find branch, set active tab + focus
                const paramRoomId = searchParams.get('roomId')
                if (paramRoomId) {
                    const targetRoom = roomData.find((r) => r.id === paramRoomId)
                    if (targetRoom?.branchId) {
                        setActiveBranchId(targetRoom.branchId)
                        setFocusedRoomId(paramRoomId)
                    } else if (branchData.length > 0) {
                        setActiveBranchId(branchData[0].id)
                    }
                    // Clean up URL param after consuming
                    setSearchParams({}, { replace: true })
                } else if (branchData.length > 0) {
                    setActiveBranchId(branchData[0].id)
                }
            } catch (err) {
                console.error('Failed to load data:', err)
                toast.error('Không tải được dữ liệu')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch bookings when date changes
    useEffect(() => {
        const dateStr = formatDateInput(date)
        let cancelled = false
        bookingService.getByDate(dateStr)
            .then(data => { if (!cancelled) setBookings(data) })
            .catch((err) => {
                if (!cancelled) {
                    console.error('Failed to load bookings:', err)
                    toast.error('Không tải được lịch đặt phòng')
                }
            })
        return () => { cancelled = true }
    }, [date])

    const handleBookingCreate = useCallback(async (newBooking: Omit<Booking, 'id'>) => {
        try {
            await bookingService.create(newBooking)
            const dateStr = formatDateInput(date)
            const data = await bookingService.getByDate(dateStr)
            setBookings(data)
            toast.success('Đặt phòng thành công')
        } catch (err) {
            console.error('Tạo booking thất bại:', err)
            toast.error('Đặt phòng thất bại, vui lòng thử lại')
        }
    }, [date])

    const handleBranchChange = useCallback((branchId: string) => {
        setActiveBranchId(branchId)
        setFocusedRoomId(null)
    }, [])

    const filteredRooms = useMemo(() => {
        if (!activeBranchId) return []
        return allRooms.filter((r) => r.branchId === activeBranchId)
    }, [allRooms, activeBranchId])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="px-4 py-8 pb-20 sm:px-8">
            {/* Branch tabs above the schedule */}
            {branches.length > 1 && (
                <div className="mb-4">
                    <div className="flex gap-1 border-b-2 border-border overflow-x-auto">
                        {branches.map((branch) => (
                            <button
                                key={branch.id}
                                type="button"
                                onClick={() => handleBranchChange(branch.id)}
                                className={cn(
                                    'px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors -mb-[2px]',
                                    activeBranchId === branch.id
                                        ? 'font-semibold text-foreground border-b-2 border-primary'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {branch.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <RoomSchedule
                date={date}
                rooms={filteredRooms}
                bookings={bookings}
                onDateChange={setDate}
                onBookingCreate={handleBookingCreate}
                startHour={0}
                endHour={24}
                focusedRoomId={focusedRoomId}
                onFocusChange={setFocusedRoomId}
            />
        </div>
    )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Run tests**

Run: `cd frontend && npx vitest run`
Expected: 53/53 pass

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/booking/BookingPage.tsx
git commit -m "feat(frontend): redesign BookingPage with branch tabs, roomId param, and focus integration"
```

---

### Task 5: Visual verification and edge case testing

- [ ] **Step 1: Start dev servers**

Run backend (in one terminal): `cd backend && npm run dev`
Run frontend (in another terminal): `cd frontend && npm run dev`

- [ ] **Step 2: Verify /phong-nghi page**

Open http://localhost:5173/phong-nghi and check:
- Branch tabs render at top
- Clicking tabs switches room grid
- Room cards show "Đặt Phòng" button
- Clicking room image → navigates to `/phong-nghi/:id`
- Clicking "Đặt Phòng" → navigates to `/dat-phong?roomId=xxx`

- [ ] **Step 3: Verify /dat-phong page**

Open http://localhost:5173/dat-phong and check:
- Branch tabs render above schedule (only if >1 branch)
- Timeline shows only rooms of active branch
- Clicking room name → row expands, rose border, others dim to 35% opacity
- "Bỏ chọn" link appears and works
- Switching branch tab clears focus
- Arriving via `?roomId=xxx` auto-selects correct branch and focuses room

- [ ] **Step 4: Test edge cases**

- Branch with no rooms → shows "Chi nhánh này chưa có phòng"
- No branches → shows "Chưa có chi nhánh nào"
- Invalid `?roomId` → ignored, default view
- Mobile viewport (375px) → tabs scroll horizontally
- Booking creation still works in focused mode

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(frontend): address visual review findings for branch grouping"
```
