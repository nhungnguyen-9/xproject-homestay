import { useCallback, useEffect, useMemo, useState } from "react"
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
  const [fetchedBranchRooms, setFetchedBranchRooms] = useState<RoomDetail[] | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch room detail when id changes
  useEffect(() => {
    if (!id) return

    let cancelled = false

    roomService
      .getById(id)
      .then((data) => {
        if (!cancelled) {
          setError(null)
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
    if (!room?.branchId) return

    let cancelled = false

    roomService
      .getAll({ branchId: room.branchId })
      .then((data) => {
        if (!cancelled) {
          setFetchedBranchRooms(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFetchedBranchRooms(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [room])

  // Derive branchRooms: use fetched when available, otherwise fallback to current room
  const branchRooms = useMemo<RoomDetail[]>(() => {
    if (fetchedBranchRooms && fetchedBranchRooms.length > 0) return fetchedBranchRooms
    return room ? [room] : []
  }, [fetchedBranchRooms, room])

  // Fetch bookings when selectedDate changes
  useEffect(() => {
    const dateStr = selectedDate.toISOString().split("T")[0]
    let cancelled = false
    bookingService.getByDate(dateStr)
      .then(data => { if (!cancelled) setBookings(data) })
      .catch(() => { if (!cancelled) setBookings([]) })
    return () => { cancelled = true }
  }, [selectedDate])

  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date)
  }, [])

  const handleBookingCreate = useCallback(
    async (newBooking: Omit<Booking, "id">) => {
      try {
        await bookingService.create(newBooking)
        const dateStr = selectedDate.toISOString().split("T")[0]
        const data = await bookingService.getByDate(dateStr)
        setBookings(data)
      } catch (err) {
        console.error('Tạo booking thất bại:', err)
      }
    },
    [selectedDate]
  )

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-lg text-gray-600">Phòng không tìm thấy</p>
        <Link
          to="/phong-nghi"
          className="text-blue-600 hover:underline"
        >
          ← Quay lại danh sách phòng
        </Link>
      </div>
    )
  }

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
