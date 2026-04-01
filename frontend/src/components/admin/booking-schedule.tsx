import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { demoRooms } from '@/data/demo-schedule'
import * as bookingService from '@/services/bookingService'
import * as authService from '@/services/authService'
import * as customerService from '@/services/customerService'
import * as telegramService from '@/services/telegramService'
import { BookingModal } from '@/components/admin/booking-modal'
import type { Booking, InternalTag } from '@/types/schedule'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'

const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => i * 2)

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-booking-confirmed-bg border-l-4 border-l-booking-confirmed text-booking-confirmed-text',
  pending: 'bg-booking-pending-bg border-l-4 border-l-booking-pending text-booking-pending-text',
  'checked-in': 'bg-booking-checked-in-bg border-l-4 border-l-booking-checked-in text-booking-checked-in-text',
  'checked-out': 'bg-booking-checked-out-bg border-l-4 border-l-booking-checked-out text-booking-checked-out-text',
  cancelled: 'bg-booking-cancelled-bg border-l-4 border-l-booking-cancelled text-booking-cancelled-text',
}

const TAG_COLORS: Record<InternalTag, string> = {
  cleaning: 'bg-tag-cleaning-bg border-l-4 border-l-tag-cleaning text-tag-cleaning-text',
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
  cleaning: 'Don phong',
  maintenance: 'Bao tri',
  locked: 'Khoa phong',
  custom: 'Tuy chinh',
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

  const [showCleaningPrompt, setShowCleaningPrompt] = useState(false)
  const [cleaningAfterBooking, setCleaningAfterBooking] = useState<Booking | null>(null)

  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    booking: Booking
  } | null>(null)
  const contextRef = useRef<HTMLDivElement>(null)

  const dateStr = formatDateISO(selectedDate)

  const [bookings, setBookings] = useState<Booking[]>(() => {
    bookingService.init()
    return bookingService.getByDate(dateStr)
  })

  const refreshBookings = useCallback(() => {
    const data = bookingService.getByDate(dateStr)
    setBookings(data)
  }, [dateStr])

  useEffect(() => {
    refreshBookings()
  }, [refreshBookings])

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

  const handleBookingClick = (booking: Booking) => {
    if (!isAdmin) return
    setSelectedBooking(booking)
    setModalMode('edit')
    setPrefillRoomId(undefined)
    setPrefillStartTime(undefined)
    setPrefillEndTime(undefined)
    setShowModal(true)
  }

  const handleBookingContextMenu = (e: React.MouseEvent, booking: Booking) => {
    if (booking.category !== 'guest') return
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, booking })
  }

  const handleAddCleaningAfter = (booking: Booking) => {
    setContextMenu(null)
    const cleaningStart = booking.endTime
    const cleaningEnd = addMinutes(booking.endTime, 30)

    bookingService.create({
      roomId: booking.roomId,
      date: dateStr,
      startTime: cleaningStart,
      endTime: cleaningEnd,
      status: 'confirmed',
      totalPrice: 0,
      category: 'internal',
      internalTag: 'cleaning',
      internalNote: 'Don phong sau check-out',
      createdBy: authService.getAuth().userName,
    })

    toast.success('Da them 30p don phong')
    refreshBookings()
  }

  const handleSave = (bookingData: Omit<Booking, 'id'> | Booking) => {
    let saved: Booking

    if ('id' in bookingData) {
      const { id, ...rest } = bookingData
      saved = bookingService.update(id, rest)

      // Khi chuyển sang checked-out → đề xuất thêm dọn phòng
      if (
        saved.category === 'guest' &&
        saved.status === 'checked-out' &&
        selectedBooking?.status !== 'checked-out'
      ) {
        setCleaningAfterBooking(saved)
        setShowCleaningPrompt(true)
      }

      if (saved.category === 'guest') {
        const room = demoRooms.find((r) => r.id === saved.roomId)
        if (saved.status === 'confirmed' && selectedBooking?.status !== 'confirmed') {
          telegramService.notify(saved, 'confirmed', room?.name || saved.roomId)
        } else if (saved.status === 'checked-in' && selectedBooking?.status !== 'checked-in') {
          telegramService.notify(saved, 'checked_in', room?.name || saved.roomId)
        }
      }

      toast.success('Da cap nhat booking')
    } else {
      saved = bookingService.create(bookingData)

      // Tự động tạo khách hàng + gửi Telegram khi booking mới là khách
      if (saved.category === 'guest') {
        if (saved.guestPhone && saved.guestName) {
          customerService.ensureCustomerExists(saved.guestName, saved.guestPhone)
        }
        const room = demoRooms.find((r) => r.id === saved.roomId)
        telegramService.notify(saved, 'new_booking', room?.name || saved.roomId)
      }

      toast.success('Da tao booking moi')
    }

    refreshBookings()
  }

  const handleDelete = (id: string) => {
    bookingService.remove(id)
    toast.success('Da xoa booking')
    refreshBookings()
  }

  const handleCleaningConfirm = () => {
    if (!cleaningAfterBooking) return
    const cleaningStart = cleaningAfterBooking.endTime
    const cleaningEnd = addMinutes(cleaningAfterBooking.endTime, 30)

    bookingService.create({
      roomId: cleaningAfterBooking.roomId,
      date: cleaningAfterBooking.date,
      startTime: cleaningStart,
      endTime: cleaningEnd,
      status: 'confirmed',
      totalPrice: 0,
      category: 'internal',
      internalTag: 'cleaning',
      internalNote: 'Don phong sau check-out',
      createdBy: authService.getAuth().userName,
    })

    toast.success('Da them 30p don phong')
    setShowCleaningPrompt(false)
    setCleaningAfterBooking(null)
    refreshBookings()
  }

  /** Tính vị trí và chiều rộng booking theo phần trăm trên timeline 24h */
  const getBookingPosition = (booking: Booking) => {
    const startMins = timeToMinutes(booking.startTime)
    const endMins = timeToMinutes(booking.endTime)
    const totalMins = 24 * 60
    const leftPct = (startMins / totalMins) * 100
    const widthPct = Math.max(((endMins - startMins) / totalMins) * 100, 0.8)
    return { left: `${leftPct}%`, width: `${widthPct}%` }
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
    const pos = getBookingPosition(booking)

    if (isInternal) {
      const tag = booking.internalTag || 'custom'
      const colorClass = TAG_COLORS[tag]

      if (isStaff) {
        return (
          <div
            key={booking.id}
            className="absolute top-1 bottom-1 rounded px-1.5 flex items-center text-[11px] bg-muted text-muted-foreground cursor-default overflow-hidden z-10"
            style={pos}
            title="Khung gio nay khong the dat phong"
          >
            <span className="truncate">Khong kha dung</span>
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
          <span className="shrink-0">{TAG_ICONS[tag]}</span>
          <span className="truncate font-medium">{TAG_LABELS[tag]}</span>
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
        title={`${booking.guestName || 'Khach'} (${booking.startTime} - ${booking.endTime})`}
      >
        <span className="truncate">
          {booking.guestName || 'Khach'}{' '}
          <span className="opacity-60">
            {booking.startTime}-{booking.endTime}
          </span>
        </span>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-slate-800">Lich phong</h2>

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
            Hom nay
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="size-3 rounded bg-booking-confirmed inline-block" /> Xac nhan
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded bg-booking-pending inline-block" /> Cho xac nhan
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded bg-booking-checked-in inline-block" /> Nhan phong
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded bg-booking-checked-out inline-block" /> Tra phong
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded bg-booking-cancelled inline-block" /> Huy
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
            Noi bo
          </span>
        )}
      </div>

      <div className="overflow-x-auto border border-border rounded-lg bg-card">
        <div className="min-w-[900px]">
          <div className="flex bg-muted/50 border-b border-border">
            <div className="w-24 shrink-0 px-3 py-2 text-xs font-semibold text-muted-foreground border-r border-border">
              Phong
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

          {demoRooms.map((room) => {
            const roomBookings = bookings.filter((b) => b.roomId === room.id)

            return (
              <div
                key={room.id}
                className="flex border-b border-border last:border-b-0 hover:bg-muted/20"
              >
                <div className="w-24 shrink-0 px-3 py-2 border-r border-border bg-card">
                  <div className="font-semibold text-sm text-slate-800">{room.name}</div>
                  <div
                    className={cn(
                      'text-[10px] uppercase font-medium',
                      room.type === 'supervip'
                        ? 'text-room-supervip'
                        : room.type === 'vip'
                          ? 'text-room-vip'
                          : 'text-muted-foreground'
                    )}
                  >
                    {room.type}
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
                              title="Them booking"
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
          <p className="text-sm">Khong co booking nao cho ngay nay.</p>
          <p className="text-xs mt-1">Nhan vao o trong de tao booking moi.</p>
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

      <AlertDialog open={showCleaningPrompt} onOpenChange={setShowCleaningPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Them 30p don phong?</AlertDialogTitle>
            <AlertDialogDescription>
              Khach vua check-out. Ban co muon them 30 phut don phong sau checkout khong?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowCleaningPrompt(false)
                setCleaningAfterBooking(null)
              }}
            >
              Khong
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCleaningConfirm}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Them don phong
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            🧹 Them don phong sau
          </button>
        </div>
      )}
    </div>
  )
}
