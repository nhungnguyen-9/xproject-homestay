import { DoorOpen, MapPin } from "lucide-react"
import { useMemo, useState } from "react"
import RoomSchedule from "../schedule/room-schedule"
import type { Booking, Room } from "../../types/schedule"
import type { DestinationSuite } from "../../data/destination-suites"

type RoomDetailPageProps = {
  suite: DestinationSuite
  locationName: string
}

export function RoomDetailPage({ suite, locationName }: RoomDetailPageProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())

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
      { id: "b1", roomId: "g01", startTime: "02:00", endTime: "09:15", status: "confirmed" },
      { id: "b2", roomId: "g01", startTime: "09:15", endTime: "13:00", status: "confirmed" },
      { id: "b3", roomId: "g01", startTime: "15:15", endTime: "18:45", status: "confirmed" },
      { id: "b4", roomId: "g01", startTime: "21:45", endTime: "24:00", status: "confirmed" },
      { id: "b5", roomId: "p102", startTime: "04:00", endTime: "10:15", status: "confirmed" },
      { id: "b6", roomId: "p102", startTime: "10:45", endTime: "14:30", status: "confirmed" },
      { id: "b7", roomId: "p102", startTime: "15:00", endTime: "17:00", status: "confirmed" },
      { id: "b8", roomId: "p102", startTime: "19:00", endTime: "21:45", status: "confirmed" },
      { id: "b9", roomId: "p103", startTime: "00:00", endTime: "10:00", status: "confirmed" },
      { id: "b10", roomId: "p103", startTime: "12:15", endTime: "14:00", status: "confirmed" },
      { id: "b11", roomId: "p103", startTime: "16:15", endTime: "20:30", status: "confirmed" },
      { id: "b12", roomId: "p104", startTime: "02:00", endTime: "09:45", status: "confirmed" },
      { id: "b13", roomId: "p104", startTime: "11:15", endTime: "15:00", status: "confirmed" },
      { id: "b14", roomId: "p104", startTime: "17:45", endTime: "21:15", status: "confirmed" },
      { id: "b15", roomId: "p202", startTime: "02:00", endTime: "11:00", status: "confirmed" },
      { id: "b16", roomId: "p202", startTime: "13:15", endTime: "15:00", status: "confirmed" },
      { id: "b17", roomId: "p202", startTime: "18:15", endTime: "22:45", status: "confirmed" },
      { id: "b18", roomId: "p203", startTime: "02:00", endTime: "07:30", status: "confirmed" },
      { id: "b19", roomId: "p203", startTime: "12:15", endTime: "16:00", status: "confirmed" },
      { id: "b20", roomId: "p203", startTime: "21:45", endTime: "24:00", status: "confirmed" },
    ],
    []
  )

  return (
    <div className="bg-[#fdeeee] px-6 pb-20 pt-10">
      <div className="mx-auto w-full max-w-6xl rounded-[18px] border border-[#f3c6cc] bg-white/70 px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        {/* <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-[#7a6a64]">{suite.title}</p>
          <h1 className="text-2xl font-bold text-[#4a3b36]">{suite.badge}</h1>
        </div> */}

        {/* <div className="mt-6 flex flex-col items-center gap-6">
          <div className="relative w-full max-w-130 overflow-hidden rounded-[18px] bg-white shadow-[0_18px_45px_rgba(0,0,0,0.12)]">
            <img src={suite.image} alt={suite.title} className="h-full w-full object-cover" />
            <div className="absolute left-4 top-4 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-[#d23a70]">
              {suite.priceLabel}
            </div>
            <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-[#4a3b36]">
              <MapPin className="h-3.5 w-3.5" />
              {locationName}
            </div>
          </div>

          <div className="w-full">
            <p className="text-sm font-semibold text-[#7a6a64]">Tiện nghi phòng</p>
            <div className="mt-3 flex flex-wrap gap-6">
              {suite.amenities.map((amenity) => (
                <div key={amenity.label} className="flex flex-col items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff6b7a] text-white shadow-[0_10px_25px_rgba(255,107,122,0.4)]">
                    <amenity.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-[#7a6a64]">{amenity.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div> */}

        <div className="mt-8">
          {/* <p className="text-sm font-semibold text-[#7a6a64]">
            Khách yêu xem tình trạng phòng bên dưới và chọn khung giờ
          </p> */}
          <div className="mt-4">
            <RoomSchedule
              date={selectedDate}
              rooms={rooms}
              bookings={bookings}
              onDateChange={setSelectedDate}
            />
          </div>
        </div>

        {/* <div className="mt-8 border-t border-[#f3c6cc] pt-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#7a6a64]">
            <DoorOpen className="h-4 w-4 text-[#ff6b7a]" />
            Mô tả chi tiết
          </div>
          <p className="mt-3 text-sm text-[#8a7a72]">
            Bạn đang xem {suite.title.toLowerCase()} tại Homestay {locationName}. Không gian được thiết kế ấm áp, riêng tư,
            phù hợp cho nghỉ ngơi và trải nghiệm dịch vụ đa dạng.
          </p>
        </div> */}
      </div>
    </div>
  )
}
