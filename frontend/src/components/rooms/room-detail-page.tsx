import { DoorOpen, MapPin } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import RoomSchedule from "../schedule/room-schedule"
import type { Booking, Room } from "../../types/schedule"
import type { DestinationSuite } from "../../data/destination-suites"
import * as bookingService from "@/services/bookingService"

type RoomDetailPageProps = {
  suite: DestinationSuite
  locationName: string
}

/**
 * Trang chi tiết phòng — hiển thị thông tin hạng phòng, tiện nghi, và lịch trình đặt phòng theo timeline
 */
export function RoomDetailPage({ suite, locationName }: RoomDetailPageProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())

  const handleBookingCreate = useCallback((newBooking: Omit<Booking, 'id'>) => {
    bookingService.create(newBooking);
  }, []);

  const rooms = useMemo<Room[]>(
    () => [
      { id: "g01", name: "G01", type: "standard" },
      { id: "p102", name: "P102", type: "vip" },
      { id: "p103", name: "P103", type: "supervip" },
    ],
    []
  )

  const bookings = useMemo<Booking[]>(
    () => [
      { id: "b1", roomId: "g01", startTime: "02:00", endTime: "09:15", status: "confirmed", date: "2026-03-20", totalPrice: 0, category: "guest" as const },
      { id: "b2", roomId: "g01", startTime: "09:15", endTime: "13:00", status: "confirmed", date: "2026-03-20", totalPrice: 0, category: "guest" as const },
      { id: "b3", roomId: "g01", startTime: "15:15", endTime: "18:45", status: "confirmed", date: "2026-03-20", totalPrice: 0, category: "guest" as const },
      { id: "b4", roomId: "g01", startTime: "21:45", endTime: "24:00", status: "confirmed", date: "2026-03-20", totalPrice: 0, category: "guest" as const },
      { id: "b5", roomId: "p102", startTime: "04:00", endTime: "10:15", status: "confirmed", date: "2026-03-20", totalPrice: 0, category: "guest" as const },
      { id: "b6", roomId: "p102", startTime: "10:45", endTime: "14:30", status: "confirmed", date: "2026-03-20", totalPrice: 0, category: "guest" as const },
      { id: "b7", roomId: "p102", startTime: "15:00", endTime: "17:00", status: "confirmed", date: "2026-03-20", totalPrice: 0, category: "guest" as const },
      { id: "b8", roomId: "p102", startTime: "19:00", endTime: "21:45", status: "confirmed", date: "2026-03-20", totalPrice: 0, category: "guest" as const },
      { id: "b9", roomId: "p103", startTime: "00:00", endTime: "10:00", status: "confirmed", date: "2026-03-20", totalPrice: 0, category: "guest" as const },
      { id: "b10", roomId: "p103", startTime: "12:15", endTime: "14:00", status: "confirmed", date: "2026-03-20", totalPrice: 0, category: "guest" as const },
      { id: "b11", roomId: "p103", startTime: "16:15", endTime: "20:30", status: "confirmed", date: "2026-03-20", totalPrice: 0, category: "guest" as const },
      { id: "b12", roomId: "p104", startTime: "02:00", endTime: "09:45", status: "confirmed", date: "2026-03-20", totalPrice: 0, category: "guest" as const },
      { id: "b13", roomId: "p104", startTime: "11:15", endTime: "15:00", status: "confirmed", date: "2026-03-20", totalPrice: 0, category: "guest" as const },
      { id: "b14", roomId: "p104", startTime: "17:45", endTime: "21:15", status: "confirmed", date: "2026-03-20", totalPrice: 0, category: "guest" as const },
      { id: "b15", roomId: "p202", startTime: "02:00", endTime: "11:00", status: "confirmed", date: "2026-03-20", totalPrice: 0, category: "guest" as const },
      { id: "b16", roomId: "p202", startTime: "13:15", endTime: "15:00", status: "confirmed", date: "2026-03-20", totalPrice: 0, category: "guest" as const },
      { id: "b17", roomId: "p202", startTime: "18:15", endTime: "22:45", status: "confirmed", date: "2026-03-20", totalPrice: 0, category: "guest" as const },
      { id: "b18", roomId: "p203", startTime: "02:00", endTime: "07:30", status: "confirmed", date: "2026-03-20", totalPrice: 0, category: "guest" as const },
      { id: "b19", roomId: "p203", startTime: "12:15", endTime: "16:00", status: "confirmed", date: "2026-03-20", totalPrice: 0, category: "guest" as const },
      { id: "b20", roomId: "p203", startTime: "21:45", endTime: "24:00", status: "confirmed", date: "2026-03-20", totalPrice: 0, category: "guest" as const },
    ],
    []
  )

  return (
    <div className="bg-[#fdeeee] px-6 pb-20 pt-10">
      <div className="mx-auto w-full max-w-6xl rounded-[18px] border border-[#f3c6cc] bg-white/70 px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        <div className="mt-8">
          <div className="mt-4">
            <RoomSchedule
              date={selectedDate}
              rooms={rooms}
              bookings={bookings}
              onDateChange={setSelectedDate}
              onBookingCreate={handleBookingCreate}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
