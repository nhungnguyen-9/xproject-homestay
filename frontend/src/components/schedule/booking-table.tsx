import React, { useState } from "react"
import { Badge, BOOKING_STATUS_LABELS, type BadgeVariant } from "@/components/ui/badge"
import type { Booking, Room } from "@/types/schedule"

const STATUS_TO_VARIANT: Record<string, BadgeVariant> = {
  pending: "pending",
  confirmed: "confirmed",
  "checked-in": "confirmed",
  "checked-out": "checked-out",
  cancelled: "cancelled",
}

interface BookingTableProps {
  bookings: Booking[]
  rooms: Room[]
  title?: string
}

/**
 * Bảng hiển thị danh sách đặt phòng — hỗ trợ lọc theo trạng thái, cuộn ngang trên mobile
 */
export function BookingTable({ bookings, rooms, title = "Danh sách Booking" }: BookingTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const roomMap = React.useMemo(
    () => Object.fromEntries(rooms.map(r => [r.id, r])),
    [rooms]
  )

  const filtered = statusFilter === "all"
    ? bookings
    : bookings.filter(b => b.status === statusFilter)

  const formatCurrency = (amount?: number) =>
    amount ? `${amount.toLocaleString("vi-VN")}₫` : "—"

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <h2 className="font-semibold text-secondary text-base">{title}</h2>

        <div className="flex flex-wrap gap-2">
          {["all", "pending", "confirmed", "checked-out"].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={[
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              ].join(" ")}
            >
              {status === "all" ? "Tất cả" : BOOKING_STATUS_LABELS[status] ?? status}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-border bg-card">
              {["Phòng", "Giờ vào", "Giờ ra", "Khách", "Trạng thái", "Tổng tiền"].map(col => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">
                  Không có đơn đặt phòng nào
                </td>
              </tr>
            ) : (
              filtered.map(booking => {
                const room = roomMap[booking.roomId]
                const variant = STATUS_TO_VARIANT[booking.status] ?? "default"
                return (
                  <tr
                    key={booking.id}
                    className="hover:bg-card transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-secondary">
                        {room?.name ?? booking.roomId}
                      </div>
                      {room && (
                        <div className="text-xs text-slate-400 capitalize">{room.type}</div>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-700">
                      {booking.startTime}
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-700">
                      {booking.endTime}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {booking.guestName ?? (
                        <span className="text-slate-300 italic">Chưa có</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <Badge variant={variant}>
                        {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 font-medium text-secondary">
                      {formatCurrency(booking.totalPrice)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-border bg-card">
        <p className="text-xs text-slate-400">
          Hiển thị <span className="font-semibold text-slate-600">{filtered.length}</span> / {bookings.length} đơn đặt phòng
        </p>
      </div>
    </div>
  )
}
