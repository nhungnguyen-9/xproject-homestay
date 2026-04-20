import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  ArrowLeft,
  Pencil,
  DollarSign,
  Calendar,
  Clock,
  StickyNote,
  Save,
  X,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/utils/helpers'
import * as customerService from '@/services/customerService'
import * as bookingService from '@/services/bookingService'
import { demoRooms } from '@/data/demo-schedule'
import type { CustomerWithStats } from '@/types/customer'
import type { Booking } from '@/types/schedule'
import { Badge, BOOKING_STATUS_LABELS } from '@/components/ui/badge'
import type { BadgeVariant } from '@/components/ui/badge'
import { toast } from 'sonner'

const AVATAR_COLORS = [
  'bg-chart-1/10 text-chart-1',
  'bg-chart-2/10 text-chart-2',
  'bg-chart-3/10 text-chart-3',
  'bg-chart-4/10 text-chart-4',
  'bg-chart-5/10 text-chart-5',
  'bg-primary/10 text-primary',
  'bg-status-info/10 text-status-info',
  'bg-status-warning/10 text-status-warning',
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '--'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function getRoomName(roomId: string): string {
  const room = demoRooms.find((r) => r.id === roomId)
  return room?.name ?? roomId
}

function getRoomType(roomId: string): string {
  const room = demoRooms.find((r) => r.id === roomId)
  return room?.type ?? 'standard'
}

function getRoomTypeBadge(roomId: string) {
  const type = getRoomType(roomId)
  if (type === 'supervip') {
    return (
      <span className="ml-1.5 inline-flex items-center rounded-full bg-room-supervip-bg px-1.5 py-0.5 text-[10px] font-semibold text-room-supervip border border-room-supervip/20">
        SVIP
      </span>
    )
  }
  if (type === 'vip') {
    return (
      <span className="ml-1.5 inline-flex items-center rounded-full bg-status-warning-muted px-1.5 py-0.5 text-[10px] font-semibold text-status-warning-foreground border border-status-warning/20">
        VIP
      </span>
    )
  }
  return null
}

function getStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'confirmed':
      return 'confirmed'
    case 'pending':
      return 'pending'
    case 'checked-out':
      return 'checked-out'
    case 'cancelled':
      return 'cancelled'
    default:
      return 'default'
  }
}

interface RoomFrequency {
  roomId: string
  roomName: string
  count: number
}

/**
 * Chi tiết khách hàng — thống kê chi tiêu, phòng hay đặt, lịch sử booking
 * Cho phép chỉnh sửa ghi chú khách hàng
 */
export function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [customer, setCustomer] = useState<CustomerWithStats | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [idImageUrls, setIdImageUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [isEditingNote, setIsEditingNote] = useState(false)
  const [noteValue, setNoteValue] = useState('')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    Promise.all([customerService.getStats(id), bookingService.getAll({ customerId: id })])
      .then(([data, customerBookings]) => {
        if (cancelled) return
        setCustomer(data)
        setNoteValue(data.note ?? '')
        setIdImageUrls(data.idImageUrls ?? [])
        // Ưu tiên customerId, fallback lọc theo SĐT cho booking guest legacy chưa có customerId
        const normalizedPhone = customerService.normalizePhone(data.phone)
        const byPhone = customerBookings.length > 0
          ? customerBookings
          : [] // nếu backend đã map customerId thì đủ dùng
        const matched = (byPhone.length > 0 ? byPhone : []).filter(
          (b) =>
            b.category !== 'internal' &&
            (!b.guestPhone || customerService.normalizePhone(b.guestPhone) === normalizedPhone),
        )
        matched.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        setBookings(matched)
      })
      .catch(err => {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : ''
        if (msg.toLowerCase().includes('not found') || msg.includes('404')) {
          setNotFound(true)
        } else {
          toast.error(msg || 'Không tải được thông tin khách hàng')
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  const topRooms = useMemo<RoomFrequency[]>(() => {
    const counts = new Map<string, number>()
    for (const b of bookings) {
      counts.set(b.roomId, (counts.get(b.roomId) || 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([roomId, count]) => ({
        roomId,
        roomName: getRoomName(roomId),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
  }, [bookings])

  const handleSaveNote = async () => {
    if (!customer || !id) return
    try {
      const updated = await customerService.update(id, { note: noteValue })
      setCustomer({ ...customer, note: updated.note })
      setIsEditingNote(false)
      toast.success('Đã lưu ghi chú')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không lưu được ghi chú')
    }
  }

  const handleCancelNote = () => {
    setNoteValue(customer?.note ?? '')
    setIsEditingNote(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFound || !customer) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/admin/customers')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-slate-500 text-sm">Không tìm thấy khách hàng.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => navigate('/admin/customers')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft size={16} />
        Quay lại danh sách
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-semibold',
              getAvatarColor(customer.name),
            )}
          >
            {getInitials(customer.name)}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {customer.name}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span>{customer.phone}</span>
              {customer.email && <span>{customer.email}</span>}
            </div>
          </div>
        </div>
        {!isEditingNote && (
          <button
            onClick={() => setIsEditingNote(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors self-start"
          >
            <Pencil size={14} />
            Sửa ghi chú
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/5">
              <DollarSign size={14} className="text-primary" />
            </div>
            Tổng chi tiêu
          </div>
          <p className="text-xl font-bold text-primary">
            {customer.totalSpent > 0
              ? `${formatPrice(customer.totalSpent)}đ`
              : '0đ'}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <div className="flex size-7 items-center justify-center rounded-lg bg-status-info-muted">
              <Calendar size={14} className="text-status-info" />
            </div>
            Số lần đặt
          </div>
          <p className="text-xl font-bold text-slate-800">{customer.visitCount}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <div className="flex size-7 items-center justify-center rounded-lg bg-status-success-muted">
              <Clock size={14} className="text-status-success" />
            </div>
            Lần cuối đến
          </div>
          <p className="text-xl font-bold text-slate-800">
            {formatDateDisplay(customer.lastVisit)}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <div className="flex size-7 items-center justify-center rounded-lg bg-status-warning-muted">
              <StickyNote size={14} className="text-status-warning" />
            </div>
            Ghi chú
          </div>
          {isEditingNote ? (
            <div className="space-y-2">
              <textarea
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                placeholder="Nhập ghi chú..."
                rows={3}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveNote}
                  className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Save size={12} />
                  Lưu
                </button>
                <button
                  onClick={handleCancelNote}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
                >
                  <X size={12} />
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-700">
              {customer.note || (
                <span className="text-slate-400 italic">Chưa có ghi chú</span>
              )}
            </p>
          )}
        </div>
      </div>

      {topRooms.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Phòng hay đặt nhất
          </h3>
          <div className="flex flex-wrap gap-3">
            {topRooms.map((room, idx) => (
              <div
                key={room.roomId}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2',
                  idx === 0
                    ? 'border-status-warning/30 bg-status-warning-muted'
                    : 'border-border bg-muted/30',
                )}
              >
                <span
                  className={cn(
                    'flex size-6 items-center justify-center rounded-full text-xs font-bold',
                    idx === 0
                      ? 'bg-status-warning/20 text-status-warning-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {idx + 1}
                </span>
                <span className="text-sm font-medium text-slate-700">
                  {room.roomName}
                </span>
                {getRoomTypeBadge(room.roomId)}
                <span className="text-xs text-slate-400">
                  ({room.count} lần)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          Giấy tờ tùy thân (CCCD/CMND)
          {idImageUrls.length === 0 && (
            <span className="text-xs font-normal text-amber-500">Chưa có</span>
          )}
        </h3>
        {idImageUrls.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Khách hàng chưa cung cấp giấy tờ.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {idImageUrls.map((url) => {
              const filename = url.split('/').pop() ?? '';
              const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3001';
              return (
                <div key={url} className="relative group">
                  <img
                    src={`${BACKEND_URL}${url}`}
                    alt="CCCD"
                    className="h-24 w-36 rounded-lg object-cover border border-border"
                  />
                  <button
                    onClick={async () => {
                      try {
                        await customerService.deleteIdImage(id!, filename);
                        setIdImageUrls(prev => prev.filter(u => u !== url));
                      } catch {
                        toast.error('Không thể xóa ảnh');
                      }
                    }}
                    className="absolute top-1 right-1 hidden group-hover:flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-slate-700">
            Lịch sử đặt phòng
            <span className="ml-2 text-slate-400 font-normal">
              ({bookings.length})
            </span>
          </h3>
        </div>

        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar size={28} className="text-slate-300 mb-2" />
            <p className="text-slate-400 text-sm">
              Khách hàng chưa có lịch sử đặt phòng.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    Ngày
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    Phòng
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    Giờ
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">
                    Giá
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-slate-500">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-slate-500">
                    Mã KM
                  </th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {formatDateDisplay(booking.date)}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-medium text-slate-700">
                        {getRoomName(booking.roomId)}
                      </span>
                      {getRoomTypeBadge(booking.roomId)}
                    </td>

                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {booking.startTime} - {booking.endTime}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {booking.voucher ? (
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-slate-400 line-through">
                            {formatPrice(booking.totalPrice)}đ
                          </span>
                          <span className="font-medium text-primary">
                            {formatPrice(booking.totalPrice)}đ
                          </span>
                        </div>
                      ) : (
                        <span className="font-medium text-slate-700">
                          {formatPrice(booking.totalPrice)}đ
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <Badge variant={getStatusVariant(booking.status)}>
                        {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-center">
                      {booking.voucher ? (
                        <span className="inline-flex items-center rounded-full bg-status-success-muted px-2 py-0.5 text-[10px] font-semibold text-status-success-foreground border border-status-success/20 font-mono">
                          {booking.voucher}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
