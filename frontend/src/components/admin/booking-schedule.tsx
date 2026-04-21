import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import * as roomService from '@/services/roomService'
import * as bookingService from '@/services/bookingService'
import * as authService from '@/services/authService'
import * as customerService from '@/services/customerService'
import * as telegramService from '@/services/telegramService'
import { BookingModal } from '@/components/admin/booking-modal'
import { RoomTypeBadge } from '@/components/rooms/RoomTypeBadge'
import { formatDate } from '@/utils/helpers'
import type { Booking, InternalTag } from '@/types/schedule'
import { Plus, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => i * 2)

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-booking-confirmed-bg border-l-4 border-l-booking-confirmed text-booking-confirmed-text',
  pending: 'bg-booking-pending-bg border-l-4 border-l-booking-pending text-booking-pending-text',
  'checked-in': 'bg-booking-checked-in-bg border-l-4 border-l-booking-checked-in text-booking-checked-in-text',
  'checked-out': 'bg-booking-checked-out-bg border-l-4 border-l-booking-checked-out text-booking-checked-out-text',
  cancelled: 'bg-booking-cancelled-bg border-l-4 border-l-booking-cancelled text-booking-cancelled-text',
}

const TAG_COLORS: Record<InternalTag, string> = {
  cleaning: 'bg-sky-200 border-l-4 border-l-sky-500 text-sky-900',
  maintenance: 'bg-tag-maintenance-bg border-l-4 border-l-tag-maintenance text-tag-maintenance-text',
  locked: 'bg-tag-locked-bg border-l-4 border-l-tag-locked text-tag-locked-text',
  custom: 'bg-tag-custom-bg border-l-4 border-l-tag-custom text-tag-custom-text',
}

const TAG_ICONS: Record<InternalTag, string> = {
  cleaning: '🧹',
  maintenance: '🔧',
  locked: '🚫',
  custom: '📝',
}

const TAG_LABELS: Record<InternalTag, string> = {
  cleaning: 'Dọn phòng',
  maintenance: 'Bảo trì',
  locked: 'Khóa phòng',
  custom: 'Tùy chỉnh',
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function addMinutes(time: string, mins: number): string {
  const total = timeToMinutes(time) + mins
  const h = Math.floor(total / 60) % 24
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function formatDateISO(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Lịch đặt phòng theo ngày — hiển thị timeline 24h cho từng phòng
 * Hỗ trợ tạo/sửa/xoá booking, gắn tag nội bộ, và gửi thông báo Telegram
 */
export function BookingSchedule() {
  const isAdmin = authService.isAdmin()
  const role = authService.getRole()

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedBooking, setSelectedBooking] = useState<Booking | undefined>(undefined)
  const [prefillRoomId, setPrefillRoomId] = useState<string | undefined>(undefined)
  const [prefillStartTime, setPrefillStartTime] = useState<string | undefined>(undefined)
  const [prefillEndTime, setPrefillEndTime] = useState<string | undefined>(undefined)

  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    booking: Booking
  } | null>(null)
  const contextRef = useRef<HTMLDivElement>(null)

  const dateStr = formatDateISO(selectedDate)

  const [rooms, setRooms] = useState<import('@/types/schedule').Room[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    roomService.getAll().then((data) => {
      setRooms(data.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type as import('@/types/schedule').RoomType,
        amenities: r.amenities || [],
        hourlyRate: r.hourlyRate,
        dailyRate: r.dailyRate,
        overnightRate: r.overnightRate,
        extraHourRate: r.extraHourRate,
        combo3hRate: r.combo3hRate,
        combo6h1hRate: r.combo6h1hRate,
        combo6h1hDiscount: r.combo6h1hDiscount,
      })))
    }).catch(() => toast.error('Không tải được danh sách phòng'))
  }, [])

  const refreshBookings = useCallback(async () => {
    try {
      const data = await bookingService.getByDate(dateStr)
      setBookings(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tải được lịch đặt phòng')
    }
  }, [dateStr])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    bookingService.getByDate(dateStr)
      .then(data => { if (!cancelled) setBookings(data) })
      .catch(err => { if (!cancelled) toast.error(err instanceof Error ? err.message : 'Không tải được lịch đặt phòng') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [dateStr])

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    if (contextMenu) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [contextMenu])

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = new Date(e.target.value + 'T00:00:00')
    if (!isNaN(d.getTime())) {
      setSelectedDate(d)
    }
  }

  const handlePrevDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    setSelectedDate(d)
  }

  const handleNextDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    setSelectedDate(d)
  }

  const handleEmptySlotClick = (roomId: string, slotHour: number) => {
    setPrefillRoomId(roomId)
    setPrefillStartTime(`${String(slotHour).padStart(2, '0')}:00`)
    setPrefillEndTime(`${String(Math.min(slotHour + 2, 24)).padStart(2, '0')}:00`)
    setSelectedBooking(undefined)
    setModalMode('create')
    setShowModal(true)
  }

  const handleBookingClick = async (booking: Booking) => {
    if (!isAdmin) return
    try {
      const full = await bookingService.getById(booking.id)
      setSelectedBooking(full)
      setModalMode('edit')
      setPrefillRoomId(undefined)
      setPrefillStartTime(undefined)
      setPrefillEndTime(undefined)
      setShowModal(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tải được chi tiết booking')
    }
  }

  const handleBookingContextMenu = (e: React.MouseEvent, booking: Booking) => {
    if (booking.category !== 'guest') return
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, booking })
  }

  const handleAddCleaningAfter = async (booking: Booking) => {
    setContextMenu(null)
    const cleaningStart = booking.endTime
    const cleaningEnd = addMinutes(booking.endTime, 30)

    try {
      await bookingService.create({
        roomId: booking.roomId,
        date: dateStr,
        startTime: cleaningStart,
        endTime: cleaningEnd,
        status: 'confirmed',
        totalPrice: 0,
        category: 'internal',
        internalTag: 'cleaning',
        internalNote: 'Dọn phòng sau check-out',
        createdBy: authService.getAuth().userName,
      })
      toast.success('Đã thêm 30p dọn phòng')
      await refreshBookings()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Thêm dọn phòng thất bại')
    }
  }

  const handleSave = async (bookingData: Omit<Booking, 'id'> | Booking) => {
    try {
      let saved: Booking

      if ('id' in bookingData) {
        const { id, ...rest } = bookingData

        // Nếu status thay đổi, gọi endpoint status transition riêng; còn lại dùng PUT
        if (selectedBooking && rest.status !== selectedBooking.status) {
          saved = await bookingService.updateStatus(id, rest.status)
          const restNoStatus: Partial<typeof rest> = { ...rest }
          delete restNoStatus.status
          if (Object.keys(restNoStatus).length > 0) {
            saved = await bookingService.update(id, restNoStatus)
          }
        } else {
          saved = await bookingService.update(id, rest)
        }

        if (saved.category === 'guest') {
          const room = rooms.find((r) => r.id === saved.roomId)
          if (saved.status === 'confirmed' && selectedBooking?.status !== 'confirmed') {
            telegramService.notify(saved, 'confirmed', room?.name || saved.roomId)
          } else if (saved.status === 'checked-in' && selectedBooking?.status !== 'checked-in') {
            telegramService.notify(saved, 'checked_in', room?.name || saved.roomId)
          }
        }

        toast.success('Đã cập nhật booking')
      } else {
        saved = await bookingService.create(bookingData)

        // Tự động tạo khách hàng + gửi Telegram khi booking mới là khách
        if (saved.category === 'guest') {
          if (saved.guestPhone && saved.guestName) {
            customerService.ensureCustomerExists(saved.guestName, saved.guestPhone).catch(() => {})
          }
          const room = rooms.find((r) => r.id === saved.roomId)
          telegramService.notify(saved, 'new_booking', room?.name || saved.roomId)
        }

        toast.success('Đã tạo booking mới')

        // BE auto-tạo cleaning 30p sau guest booking. Nếu là overnight,
        // cleaning rơi vào ngày D+1 → timeline ngày D không hiển thị.
        // Cho admin 1 toast hint để biết cleaning đã được scheduled.
        if (saved.category === 'guest') {
          const startMin = timeToMinutes(saved.startTime)
          const endMin = timeToMinutes(saved.endTime)
          if (endMin <= startMin) {
            const nextDay = new Date(saved.date + 'T00:00:00')
            nextDay.setDate(nextDay.getDate() + 1)
            toast.info(`🧹 Dọn phòng 30p lúc ${saved.endTime} ngày ${formatDate(nextDay)} (hôm sau)`)
          }
        }
      }

      await refreshBookings()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lưu booking thất bại')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await bookingService.remove(id)
      toast.success('Đã xóa booking')
      await refreshBookings()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xóa booking thất bại')
    }
  }

  /**
   * Tính vị trí booking (%) cho timeline 24h của ngày đang xem.
   * - Same-day: render từ startTime; overnight clamp tại biên phải 100% — slice còn lại render ngày D+1.
   * - Cross-day wrap-in (booking ngày hôm trước, overnight sang ngày đang xem): render slice [00:00, endTime).
   * - Không liên quan tới ngày đang xem: trả width 0 để caller bỏ qua.
   */
  const getBookingPosition = (booking: Booking, viewingDate: string) => {
    const startMins = timeToMinutes(booking.startTime)
    let endMins = timeToMinutes(booking.endTime)
    const isOvernight = endMins <= startMins
    if (isOvernight) endMins += 24 * 60
    const totalMins = 24 * 60

    if (booking.date === viewingDate) {
      const leftPct = (startMins / totalMins) * 100
      const rawWidthPct = ((endMins - startMins) / totalMins) * 100
      const widthPct = Math.max(Math.min(rawWidthPct, 100 - leftPct), 0.8)
      return { left: `${leftPct}%`, width: `${widthPct}%` }
    }

    if (isOvernight) {
      const wrapEndMins = endMins - 24 * 60
      const widthPct = Math.max((wrapEndMins / totalMins) * 100, 0.8)
      return { left: '0%', width: `${widthPct}%` }
    }

    return { left: '0%', width: '0%' }
  }

  const isSlotOccupied = (roomId: string, slotHour: number) => {
    const slotStart = slotHour * 60
    const slotEnd = (slotHour + 2) * 60
    return bookings.some((b) => {
      if (b.roomId !== roomId) return false
      const bStart = timeToMinutes(b.startTime)
      const bEnd = timeToMinutes(b.endTime)
      return bStart < slotEnd && bEnd > slotStart
    })
  }

  const renderBookingBlock = (booking: Booking) => {
    const isInternal = booking.category === 'internal'
    const isStaff = role === 'staff'
    const pos = getBookingPosition(booking, dateStr)

    if (pos.width === '0%') return null

    if (isInternal) {
      const tag = booking.internalTag || 'custom'
      const colorClass = TAG_COLORS[tag]

      if (isStaff) {
        return (
          <div
            key={booking.id}
            className="absolute top-1 bottom-1 rounded px-1.5 flex items-center text-[11px] bg-muted text-muted-foreground cursor-default overflow-hidden z-10"
            style={pos}
            title="Khung giờ này không thể đặt phòng"
          >
            <span className="truncate">Không khả dụng</span>
          </div>
        )
      }

      return (
        <div
          key={booking.id}
          className={cn(
            'absolute top-1 bottom-1 rounded px-1.5 flex items-center gap-1 text-[11px] overflow-hidden z-10',
            colorClass,
            isAdmin ? 'cursor-pointer' : 'cursor-default'
          )}
          style={{
            ...pos,
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.3) 4px, rgba(255,255,255,0.3) 8px)',
          }}
          onClick={() => handleBookingClick(booking)}
        >
          <span className="truncate font-medium">{TAG_LABELS[tag]}</span>
          <span className="shrink-0">{TAG_ICONS[tag]}</span>
        </div>
      )
    }

    const statusClass = STATUS_COLORS[booking.status] || STATUS_COLORS['pending']
    return (
      <div
        key={booking.id}
        className={cn(
          'absolute top-1 bottom-1 rounded px-1.5 flex items-center text-[11px] overflow-hidden z-10',
          statusClass,
          isAdmin ? 'cursor-pointer hover:opacity-90' : 'cursor-default'
        )}
        style={pos}
        onClick={() => handleBookingClick(booking)}
        onContextMenu={(e) => handleBookingContextMenu(e, booking)}
        title={`${booking.guestName || 'Khách'} (${booking.startTime} - ${booking.endTime})`}
      >
        <span className="truncate">
          {booking.guestName || 'Khách'}{' '}
          <span className="opacity-60">
            {booking.startTime}-{booking.endTime}
          </span>
        </span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-foreground">Lịch phòng</h2>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <input
            type="date"
            value={dateStr}
            onChange={handleDateChange}
            className="border border-border rounded-md px-3 py-1.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <Button variant="outline" size="sm" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(new Date())}
            className="text-xs"
          >
            Hôm nay
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="size-3 rounded bg-booking-confirmed inline-block" /> Xác nhận
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded bg-booking-pending inline-block" /> Chờ xác nhận
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded bg-booking-checked-in inline-block" /> Nhận phòng
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded bg-booking-checked-out inline-block" /> Trả phòng
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded bg-booking-cancelled inline-block" /> Hủy
        </span>
        {isAdmin && (
          <span className="flex items-center gap-1">
            <span
              className="size-3 rounded bg-tag-cleaning inline-block"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.4) 2px, rgba(255,255,255,0.4) 4px)',
              }}
            />{' '}
            Nội bộ
          </span>
        )}
      </div>

      <div className="overflow-x-auto border border-border rounded-lg bg-card">
        <div className="min-w-[900px]">
          <div className="flex bg-muted/50 border-b border-border">
            <div className="w-24 shrink-0 px-3 py-2 text-xs font-semibold text-muted-foreground border-r border-border">
              Phòng
            </div>
            <div className="flex-1 flex">
              {TIME_SLOTS.map((hour) => (
                <div
                  key={hour}
                  className="flex-1 text-center py-2 text-xs font-medium text-muted-foreground border-r border-border last:border-r-0"
                >
                  {String(hour).padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>

          {rooms.map((room) => {
            const roomBookings = bookings.filter((b) => b.roomId === room.id && b.status !== 'cancelled')

            return (
              <div
                key={room.id}
                className="flex border-b border-border last:border-b-0 hover:bg-muted/20"
              >
                <div className="w-24 shrink-0 px-3 py-2 border-r border-border bg-card">
                  <div className="font-semibold text-sm text-slate-800">{room.name}</div>
                  <div className="mt-1">
                    <RoomTypeBadge type={room.type} size="sm" />
                  </div>
                </div>

                <div className="flex-1 relative h-12">
                  <div className="absolute inset-0 flex">
                    {TIME_SLOTS.map((slotHour) => {
                      const occupied = isSlotOccupied(room.id, slotHour)
                      return (
                        <div
                          key={slotHour}
                          className="flex-1 border-r border-border last:border-r-0 relative"
                        >
                          {!occupied && (
                            <button
                              type="button"
                              onClick={() => handleEmptySlotClick(room.id, slotHour)}
                              className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary z-[5]"
                              title="Thêm booking"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {roomBookings.map((booking) => renderBookingBlock(booking))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {bookings.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p className="text-sm">Không có booking nào cho ngày này.</p>
          <p className="text-xs mt-1">Nhấn vào ô trống để tạo booking mới.</p>
        </div>
      )}

      <BookingModal
        key={selectedBooking?.id || `new-${prefillRoomId}-${dateStr}`}
        open={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedBooking(undefined)
        }}
        mode={modalMode}
        booking={selectedBooking}
        prefillRoomId={prefillRoomId}
        prefillDate={dateStr}
        prefillStartTime={prefillStartTime}
        prefillEndTime={prefillEndTime}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      {contextMenu && (
        <div
          ref={contextRef}
          className="fixed z-50 bg-card border border-border rounded-md shadow-lg py-1 min-w-[180px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            type="button"
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors flex items-center gap-2"
            onClick={() => handleAddCleaningAfter(contextMenu.booking)}
          >
            🧹 Thêm dọn phòng sau
          </button>
        </div>
      )}
    </div>
  )
}
