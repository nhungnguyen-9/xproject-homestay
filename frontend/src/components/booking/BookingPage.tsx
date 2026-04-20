import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import type { Booking, Room, RoomType } from '@/types/schedule'
import { RoomSchedule } from '@/components/schedule/room-schedule'
import * as roomService from '@/services/roomService'
import * as bookingService from '@/services/bookingService'
import { Loader2 } from 'lucide-react'

function formatDateISO(d: Date): string {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export const BookingPage = () => {
    const [date, setDate] = useState(new Date())
    const [rooms, setRooms] = useState<Room[]>([])
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        roomService.getAll().then((data) => {
            setRooms(data.map((r: { id: string; name: string; type: string; amenities?: string[] }) => ({
                id: r.id,
                name: r.name,
                type: r.type as RoomType,
                amenities: r.amenities || [],
            })))
        }).catch(() => toast.error('Không tải được danh sách phòng'))
    }, [])

    useEffect(() => {
        const dateStr = formatDateISO(date)
        setLoading(true)
        bookingService.getByDate(dateStr)
            .then(setBookings)
            .catch(() => toast.error('Không tải được lịch đặt phòng'))
            .finally(() => setLoading(false))
    }, [date])

    if (loading && rooms.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="px-4 py-8 pb-20 sm:px-8">
            <RoomSchedule
                date={date}
                rooms={rooms}
                bookings={bookings}
                onDateChange={setDate}
                startHour={0}
                endHour={22}
            />
        </div>
    )
}
