import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { RoomDetailPage } from "./room-detail-page"
import * as roomService from "@/services/roomService"
import * as bookingService from "@/services/bookingService"
import type { RoomDetail } from "@/types/room"
import type { Booking } from "@/types/schedule"

/**
 * Route chi tiết phòng — fetch dữ liệu phòng từ API và render trang chi tiết
 */
export default function RoomDetailRoute() {
  const { id } = useParams<{ id: string }>()

  const [room, setRoom] = useState<RoomDetail | null>(null)
  const [branchRooms, setBranchRooms] = useState<RoomDetail[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch room detail when id changes
  useEffect(() => {
    if (!id) {
      setError("Phòng không tìm thấy")
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    roomService
      .getById(id)
      .then((data) => {
        if (!cancelled) {
          setRoom(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Phòng không tìm thấy")
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [id])

  // Fetch sibling rooms when room.branchId is available
  useEffect(() => {
    if (!room?.branchId) {
      setBranchRooms(room ? [room] : [])
      return
    }

    let cancelled = false

    roomService
      .getAll({ branchId: room.branchId })
      .then((data) => {
        if (!cancelled) {
          setBranchRooms(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBranchRooms([room])
        }
      })

    return () => {
      cancelled = true
    }
  }, [room])

  // Fetch bookings when selectedDate changes
  useEffect(() => {
    const dateStr = selectedDate.toISOString().split("T")[0]
    const data = bookingService.getByDate(dateStr)
    setBookings(data)
  }, [selectedDate])

  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date)
  }, [])

  const handleBookingCreate = useCallback(
    (newBooking: Omit<Booking, "id">) => {
      bookingService.create(newBooking)
      // Refresh bookings for current date
      const dateStr = selectedDate.toISOString().split("T")[0]
      const data = bookingService.getByDate(dateStr)
      setBookings(data)
    },
    [selectedDate]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-lg text-gray-600">{error ?? "Phòng không tìm thấy"}</p>
        <Link
          to="/phong-nghi"
          className="text-blue-600 hover:underline"
        >
          ← Quay lại danh sách phòng
        </Link>
      </div>
    )
  }

  return (
    <RoomDetailPage
      room={room}
      branchRooms={branchRooms}
      bookings={bookings}
      selectedDate={selectedDate}
      onDateChange={handleDateChange}
      onBookingCreate={handleBookingCreate}
    />
  )
}
