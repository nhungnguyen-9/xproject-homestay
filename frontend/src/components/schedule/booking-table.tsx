import React, { useState } from "react"
import { Badge, BOOKING_STATUS_LABELS, type BadgeVariant } from "@/components/ui/badge"
import type { Booking, Room } from "@/types/schedule"

// Map trạng thái booking → variant màu badge
const STATUS_TO_VARIANT: Record<string, BadgeVariant> = {
  pending: "pending",
  confirmed: "confirmed",
  "checked-in": "confirmed",   // checked-in dùng màu xanh như confirmed
  "checked-out": "checked-out",
  cancelled: "cancelled",
}

interface BookingTableProps {
  bookings: Booking[]
  rooms: Room[]
  /** Tiêu đề bảng - mặc định "Danh sách Booking" */
  title?: string
}

/**
 * BookingTable - Bảng hiển thị danh sách đặt phòng
 * Columns: Phòng | Giờ vào | Giờ ra | Trạng thái | Khách | Tổng tiền
 * Responsive: scroll ngang trên mobile
 */
export function BookingTable({ bookings, rooms, title = "Danh sách Booking" }: BookingTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Map roomId → room name để tra cứu nhanh
  const roomMap = React.useMemo(
    () => Object.fromEntries(rooms.map(r => [r.id, r])),
    [rooms]
  )

  // Lọc bookings theo trạng thái được chọn
  const filtered = statusFilter === "all"
    ? bookings
    : bookings.filter(b => b.status === statusFilter)

  const formatCurrency = (amount?: number) =>
    amount ? `${amount.toLocaleString("vi-VN")}₫` : "—"

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
      {/* Header bảng */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-[#E2E8F0]">
        <h2 className="font-semibold text-[#334155] text-base">{title}</h2>

        {/* Bộ lọc trạng thái */}
        <div className="flex flex-wrap gap-2">
          {["all", "pending", "confirmed", "checked-out"].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={[
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === status
                  ? "bg-[#F87171] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              ].join(" ")}
            >
              {status === "all" ? "Tất cả" : BOOKING_STATUS_LABELS[status] ?? status}
            </button>
          ))}
        </div>
      </div>

      {/* Bảng dữ liệu - scroll ngang trên mobile */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
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
                    className="hover:bg-[#F8FAFC] transition-colors"
                  >
                    {/* Tên phòng + loại phòng */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#334155]">
                        {room?.name ?? booking.roomId}
                      </div>
                      {room && (
                        <div className="text-xs text-slate-400 capitalize">{room.type}</div>
                      )}
                    </td>

                    {/* Giờ vào */}
                    <td className="px-4 py-3 font-mono text-slate-700">
                      {booking.startTime}
                    </td>

                    {/* Giờ ra */}
                    <td className="px-4 py-3 font-mono text-slate-700">
                      {booking.endTime}
                    </td>

                    {/* Tên khách */}
                    <td className="px-4 py-3 text-slate-600">
                      {booking.guestName ?? (
                        <span className="text-slate-300 italic">Chưa có</span>
                      )}
                    </td>

                    {/* Badge trạng thái */}
                    <td className="px-4 py-3">
                      <Badge variant={variant}>
                        {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                      </Badge>
                    </td>

                    {/* Tổng tiền */}
                    <td className="px-4 py-3 font-medium text-[#334155]">
                      {formatCurrency(booking.totalPrice)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: tổng số bản ghi */}
      <div className="px-5 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
        <p className="text-xs text-slate-400">
          Hiển thị <span className="font-semibold text-slate-600">{filtered.length}</span> / {bookings.length} đơn đặt phòng
        </p>
      </div>
    </div>
  )
}
