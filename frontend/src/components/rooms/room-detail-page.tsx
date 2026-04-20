import { useMemo } from 'react'
import RoomSchedule from '../schedule/room-schedule'
import { RoomImageGallery } from './RoomImageGallery'
import { RoomTypeBadge } from './RoomTypeBadge'
import { imageUrl } from '@/services/roomService'
import type { RoomDetail } from '@/types/room'
import type { Booking, Room } from '@/types/schedule'

/**
 * Maps a RoomDetail object to the simpler Room type used by RoomSchedule.
 */
function toScheduleRoom(detail: RoomDetail): Room {
  return { id: detail.id, name: detail.name, type: detail.type, amenities: detail.amenities }
}

export interface RoomDetailPageProps {
  room: RoomDetail
  branchRooms: RoomDetail[]
  bookings: Booking[]
  selectedDate: Date
  onDateChange: (date: Date) => void
  onBookingCreate: (booking: Omit<Booking, 'id'>) => void
}

/**
 * Trang chi tiết phòng — presentational component hiển thị ảnh, tiện nghi,
 * và lịch trình đặt phòng theo timeline cho tất cả phòng cùng chi nhánh.
 */
export function RoomDetailPage({
  room,
  branchRooms,
  bookings,
  selectedDate,
  onDateChange,
  onBookingCreate,
}: RoomDetailPageProps) {
  // Map RoomDetail[] → Room[] for the schedule component
  const scheduleRooms = useMemo<Room[]>(
    () => branchRooms.map(toScheduleRoom),
    [branchRooms]
  )

  // Build roomId → amenities map for the schedule legend
  const roomAmenities = useMemo<Record<string, string[]>>(
    () =>
      branchRooms.reduce<Record<string, string[]>>((acc, r) => {
        acc[r.id] = r.amenities;
        return acc;
      }, {}),
    [branchRooms]
  )

  // Resolve relative image paths to absolute URLs
  const resolvedImages = useMemo<string[]>(
    () => room.images.map((img) => imageUrl(img)),
    [room.images]
  )

  return (
    <div className="bg-[#fdeeee] px-4 md:px-6 pb-20 pt-10">
      <div className="mx-auto w-full max-w-6xl rounded-[18px] border border-[#f3c6cc] bg-white/70 px-4 md:px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        <section aria-labelledby="room-detail-heading">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 id="room-detail-heading" className="text-2xl font-bold text-foreground">
              {room.name}
            </h2>
            <RoomTypeBadge type={room.type} />
          </div>

          <RoomImageGallery images={resolvedImages} roomName={room.name} />

          <div className="mt-6">
            <RoomSchedule
              date={selectedDate}
              rooms={scheduleRooms}
              bookings={bookings}
              onDateChange={onDateChange}
              onBookingCreate={onBookingCreate}
              roomAmenities={roomAmenities}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
