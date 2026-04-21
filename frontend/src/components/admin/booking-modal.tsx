import { useState, useCallback, useEffect } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { RoomTypeBadge } from '@/components/rooms/RoomTypeBadge'
import * as bookingService from '@/services/bookingService'
import * as roomService from '@/services/roomService'
import * as promoService from '@/services/promoService'
import * as authService from '@/services/authService'
import type { PromoCode } from '@/types/promo'
import type { Booking, BookingStatus, InternalTag, Room, RoomType } from '@/types/schedule'
import { getRoomPriceConfig } from '@/types/schedule'
import { calculateBookingPrice, formatDate, formatDateInput } from '@/utils/helpers'

interface BookingModalProps {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  booking?: Booking
  prefillRoomId?: string
  prefillDate?: string
  prefillStartTime?: string
  prefillEndTime?: string
  onSave: (booking: Omit<Booking, 'id'> | Booking) => void
  onDelete?: (id: string) => void
}

const INTERNAL_TAGS: { value: InternalTag; label: string; icon: string }[] = [
  { value: 'cleaning', label: 'Don phong', icon: '🧹' },
  { value: 'maintenance', label: 'Bao tri', icon: '🔧' },
  { value: 'locked', label: 'Khoa phong', icon: '🚫' },
  { value: 'custom', label: 'Tuy chinh', icon: '📝' },
]

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: 'pending', label: 'Cho xac nhan' },
  { value: 'confirmed', label: 'Da xac nhan' },
  { value: 'checked-in', label: 'Da nhan phong' },
  { value: 'checked-out', label: 'Da tra phong' },
  { value: 'cancelled', label: 'Da huy' },
]

const guestSchema = z.object({
  guestName: z.string().min(1, 'Ten khach hang la bat buoc'),
  guestPhone: z
    .string()
    .min(1, 'So dien thoai la bat buoc')
    .regex(/^0\d{9,10}$/, 'So dien thoai khong hop le (VD: 0901234567)'),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
})

const internalSchema = z.object({
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  internalTag: z.enum(['cleaning', 'maintenance', 'locked', 'custom']),
})

/**
 * Modal tạo/chỉnh sửa booking — hai tab: khách hàng (guest) và nội bộ (internal)
 * Validate với Zod, kiểm tra trùng lịch, áp dụng mã khuyến mãi
 */
export function BookingModal({
  open,
  onClose,
  mode,
  booking,
  prefillRoomId,
  prefillDate,
  prefillStartTime,
  prefillEndTime,
  onSave,
  onDelete,
}: BookingModalProps) {
  const isAdmin = authService.isAdmin()
  const isEdit = mode === 'edit'

  const [rooms, setRooms] = useState<Room[]>([])
  useEffect(() => {
    roomService.getAll().then((data) => {
      setRooms(data.map((r) => ({
        id: r.id, name: r.name, type: r.type,
        amenities: r.amenities || [],
        hourlyRate: r.hourlyRate, dailyRate: r.dailyRate,
        overnightRate: r.overnightRate, extraHourRate: r.extraHourRate,
        combo3hRate: r.combo3hRate, combo6h1hRate: r.combo6h1hRate,
        combo6h1hDiscount: r.combo6h1hDiscount,
      })))
    }).catch(() => {})
  }, [])

  const [activeTab, setActiveTab] = useState<'guest' | 'internal'>(
    booking?.category === 'internal' ? 'internal' : 'guest'
  )

  const [roomId, setRoomId] = useState(booking?.roomId || prefillRoomId || '')

  useEffect(() => {
    if (!roomId && rooms.length > 0) setRoomId(rooms[0].id)
  }, [rooms, roomId])
  const [date, setDate] = useState(
    booking?.date || prefillDate || formatDateInput(new Date())
  )
  const [startTime, setStartTime] = useState(booking?.startTime || prefillStartTime || '08:00')
  const [endTime, setEndTime] = useState(booking?.endTime || prefillEndTime || '10:00')

  const [guestName, setGuestName] = useState(booking?.guestName || '')
  const [guestPhone, setGuestPhone] = useState(booking?.guestPhone || '')
  const [status, setStatus] = useState<BookingStatus>(booking?.status || 'pending')
  const [voucher, setVoucher] = useState(booking?.voucher || '')
  const [note, setNote] = useState(booking?.note || '')

  const [internalTag, setInternalTag] = useState<InternalTag>(
    booking?.internalTag || 'cleaning'
  )
  const [internalNote, setInternalNote] = useState(booking?.internalNote || '')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [voucherStatus, setVoucherStatus] = useState<{
    valid: boolean
    message: string
  } | null>(null)
  const [validatedPromo, setValidatedPromo] = useState<PromoCode | null>(null)
  const [validatingVoucher, setValidatingVoucher] = useState(false)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const validateVoucher = useCallback(async () => {
    if (!voucher.trim()) {
      setVoucherStatus(null)
      setValidatedPromo(null)
      return
    }
    const room = rooms.find((r) => r.id === roomId)
    const roomType: RoomType = room?.type || 'standard'
    setValidatingVoucher(true)
    try {
      const result = await promoService.validate(voucher.trim().toUpperCase(), roomType)
      if (result.valid && result.promo) {
        const discountText =
          result.promo.discountType === 'percent'
            ? `${result.promo.discountValue}%`
            : `${result.promo.discountValue.toLocaleString('vi-VN')}d`
        setVoucherStatus({ valid: true, message: `Giam ${discountText}` })
        setValidatedPromo(result.promo)
      } else {
        setVoucherStatus({ valid: false, message: result.error || 'Ma khong hop le' })
        setValidatedPromo(null)
      }
    } catch (err) {
      setVoucherStatus({ valid: false, message: err instanceof Error ? err.message : 'Không kiểm tra được mã' })
      setValidatedPromo(null)
    } finally {
      setValidatingVoucher(false)
    }
  }, [voucher, roomId, rooms])

  const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  }

  const handleSave = async () => {
    const newErrors: Record<string, string> = {}

    // `endTime === startTime` = zero-duration → invalid.
    // `endTime < startTime` = overnight (cross-midnight) → valid, BE sẽ validate overlap.
    if (timeToMinutes(endTime) === timeToMinutes(startTime)) {
      newErrors.endTime = 'Giờ kết thúc không được trùng giờ bắt đầu'
    }

    if (activeTab === 'guest') {
      const result = guestSchema.safeParse({ guestName, guestPhone, startTime, endTime })
      if (!result.success) {
        for (const issue of result.error.issues) {
          const field = issue.path[0] as string
          newErrors[field] = issue.message
        }
      }
    } else {
      const result = internalSchema.safeParse({ startTime, endTime, internalTag })
      if (!result.success) {
        for (const issue of result.error.issues) {
          const field = issue.path[0] as string
          newErrors[field] = issue.message
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const excludeId = isEdit && booking ? booking.id : undefined
    try {
      const conflict = await bookingService.hasConflict(roomId, date, startTime, endTime, excludeId)
      if (conflict) {
        toast.error('Trung lich! Da co booking trong khung gio nay.')
        return
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Khong kiem tra duoc trung lich')
      return
    }

    const isGuest = activeTab === 'guest'

    const bookingData: Omit<Booking, 'id'> = {
      roomId,
      date,
      startTime,
      endTime,
      status: isGuest ? status : 'confirmed',
      totalPrice: isGuest ? calculatePrice() : 0,
      category: isGuest ? 'guest' : 'internal',
      ...(isGuest && {
        guestName,
        guestPhone,
        note,
        voucher: voucher.trim().toUpperCase() || undefined,
      }),
      ...(!isGuest && {
        internalTag,
        internalNote: internalNote || undefined,
        createdBy: authService.getAuth().userName,
      }),
    }

    if (isEdit && booking) {
      onSave({ ...bookingData, id: booking.id } as Booking)
    } else {
      onSave(bookingData)
    }

    onClose()
  }

  const calculatePrice = (): number => {
    const room = rooms.find((r) => r.id === roomId)
    if (!room) return 0
    const priceConfig = getRoomPriceConfig(room)
    
    // Admin modal không có trường 'mode' → mặc định 'hourly'.
    // Overnight (end ≤ start): cộng 24h để tính đúng duration.
    const startMin = timeToMinutes(startTime)
    let endMin = timeToMinutes(endTime)
    if (endMin <= startMin) endMin += 24 * 60
    const hours = (endMin - startMin) / 60
    
    // Sử dụng helper để tính giá chuẩn
    let price = calculateBookingPrice('hourly', hours, priceConfig)

    if (voucher.trim() && validatedPromo && validatedPromo.code === voucher.trim().toUpperCase()) {
      if (validatedPromo.discountType === 'percent') {
        price = Math.round(price * (1 - validatedPromo.discountValue / 100))
      } else {
        price = Math.max(0, price - validatedPromo.discountValue)
      }
    }

    return price
  }

  const handleDelete = () => {
    if (booking && onDelete) {
      onDelete(booking.id)
      setShowDeleteConfirm(false)
      onClose()
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? 'Chinh sua booking' : 'Tao booking moi'}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Cap nhat thong tin booking hien tai'
                : 'Dien thong tin de tao booking moi'}
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'guest' | 'internal')}
          >
            <TabsList className="w-full">
              <TabsTrigger value="guest" className="flex-1">
                Khach hang
              </TabsTrigger>
              <TabsTrigger value="internal" className="flex-1">
                Noi bo
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="room">Phong</Label>
                <Select value={roomId} onValueChange={setRoomId}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        <span className="inline-flex items-center gap-2">
                          <span>{r.name}</span>
                          <RoomTypeBadge type={r.type} size="sm" />
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">Ngay</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="startTime">Bat dau</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1"
                  />
                  {errors.startTime && (
                    <p className="text-xs text-status-error-foreground mt-0.5">{errors.startTime}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="endTime">Ket thuc</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1"
                  />
                  {errors.endTime && (
                    <p className="text-xs text-status-error-foreground mt-0.5">{errors.endTime}</p>
                  )}
                  {(() => {
                    const startMin = timeToMinutes(startTime)
                    const endMin = timeToMinutes(endTime)
                    if (endMin >= startMin) return null
                    const d = new Date(date + 'T00:00:00')
                    if (isNaN(d.getTime())) return null
                    d.setDate(d.getDate() + 1)
                    return (
                      <p className="text-xs text-amber-600 mt-0.5">
                        Qua đêm — kết thúc {formatDate(d)}
                      </p>
                    )
                  })()}
                </div>
              </div>
            </div>

            <TabsContent value="guest" className="mt-3 flex flex-col gap-3">
              <div>
                <Label htmlFor="guestName">Ten khach hang</Label>
                <Input
                  id="guestName"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Nguyen Van A"
                  className="mt-1"
                />
                {errors.guestName && (
                  <p className="text-xs text-status-error-foreground mt-0.5">{errors.guestName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="guestPhone">So dien thoai</Label>
                <Input
                  id="guestPhone"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="0901234567"
                  className="mt-1"
                />
                {errors.guestPhone && (
                  <p className="text-xs text-status-error-foreground mt-0.5">{errors.guestPhone}</p>
                )}
              </div>

              <div>
                <Label htmlFor="status">Trang thai</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as BookingStatus)}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="voucher">Ma khuyen mai</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="voucher"
                    value={voucher}
                    onChange={(e) => {
                      setVoucher(e.target.value)
                      setVoucherStatus(null)
                      setValidatedPromo(null)
                    }}
                    placeholder="SUMMER20"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={validateVoucher}
                    disabled={validatingVoucher}
                    className="shrink-0"
                  >
                    {validatingVoucher ? 'Dang kiem tra...' : 'Kiem tra'}
                  </Button>
                </div>
                {voucherStatus && (
                  <p
                    className={cn(
                      'text-xs mt-1',
                      voucherStatus.valid ? 'text-status-success-foreground' : 'text-status-error-foreground'
                    )}
                  >
                    {voucherStatus.valid ? '✓' : '✗'} {voucherStatus.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="note">Ghi chu</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chu them..."
                  rows={2}
                  className="mt-1"
                />
              </div>
            </TabsContent>

            <TabsContent value="internal" className="mt-3 flex flex-col gap-3">
              <div>
                <Label>Loai noi bo</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {INTERNAL_TAGS.map((tag) => (
                    <button
                      key={tag.value}
                      type="button"
                      onClick={() => setInternalTag(tag.value)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors',
                        internalTag === tag.value
                          ? 'border-primary bg-status-error-muted text-status-error-foreground'
                          : 'border-border hover:border-muted-foreground'
                      )}
                    >
                      <span className="text-base">{tag.icon}</span>
                      <span>{tag.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="internalNote">Ghi chu noi bo</Label>
                <Textarea
                  id="internalNote"
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Ly do, chi tiet..."
                  rows={2}
                  className="mt-1"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-2 gap-2">
            {isEdit && isAdmin && onDelete && (
              <Button
                variant="outline"
                className="mr-auto text-destructive border-destructive/20 hover:bg-destructive/5"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Xoa
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Huy
            </Button>
            <Button
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isEdit ? 'Cap nhat' : 'Tao moi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoa booking?</AlertDialogTitle>
            <AlertDialogDescription>
              Ban co chac muon xoa booking nay? Hanh dong nay khong thể hoan tac.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Xoa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
