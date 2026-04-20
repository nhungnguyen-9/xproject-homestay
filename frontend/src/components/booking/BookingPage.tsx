import { useState, useEffect, useCallback } from 'react'
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
            setRooms(data.map((r) => ({
                id: r.id,
                name: r.name,
                type: r.type as RoomType,
                amenities: r.amenities || [],
                hourlyRate: r.hourlyRate,
                dailyRate: r.dailyRate,
                overnightRate: r.overnightRate,
                extraHourRate: r.extraHourRate,
                combo3hRate: r.combo3hRate,
                combo6h1hRate: r.combo6h1hRate,
                combo6h1hDiscount: r.combo6h1hDiscount,
            })))
        }).catch((err) => {
            console.error('Failed to load rooms:', err)
            toast.error('Không tải được danh sách phòng')
        })
    }, [])

    useEffect(() => {
        const dateStr = formatDateISO(date)
        let cancelled = false
        bookingService.getByDate(dateStr)
            .then(data => { if (!cancelled) setBookings(data) })
            .catch((err) => {
                if (!cancelled) {
                    console.error('Failed to load bookings:', err)
                    toast.error('Không tải được lịch đặt phòng')
                }
            })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [date])

    const handleBookingCreate = useCallback(async (newBooking: Omit<Booking, 'id'>) => {
        try {
            await bookingService.create(newBooking)
            const dateStr = formatDateISO(date)
            const data = await bookingService.getByDate(dateStr)
            setBookings(data)
            toast.success('Đặt phòng thành công')
        } catch (err) {
            console.error('Tạo booking thất bại:', err)
            toast.error('Đặt phòng thất bại, vui lòng thử lại')
        }
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
                onBookingCreate={handleBookingCreate}
                startHour={0}
                endHour={24}
            />
        </div>
    )
}
