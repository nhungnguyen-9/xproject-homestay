import { useState, useMemo } from 'react'
import { demoRooms } from '@/data/demo-schedule'
import type { Booking } from '@/types/schedule'
import { RoomSchedule } from '@/components/schedule/room-schedule'

function todayISO() {
    return new Date().toISOString().slice(0, 10)
}

/** Mock bookings với ngày hôm nay */
function getMockBookings(): Booking[] {
    const today = todayISO()
    return [
        { id: 'm1', roomId: 'g01', date: today, startTime: '08:45', endTime: '11:25', status: 'confirmed', totalPrice: 0, category: 'guest' },
        { id: 'm2', roomId: 'g01', date: today, startTime: '15:40', endTime: '17:10', status: 'confirmed', totalPrice: 0, category: 'guest' },
        { id: 'm3', roomId: 'p102', date: today, startTime: '06:30', endTime: '10:20', status: 'checked-in', totalPrice: 0, category: 'guest' },
        { id: 'm4', roomId: 'p102', date: today, startTime: '15:40', endTime: '17:10', status: 'confirmed', totalPrice: 0, category: 'guest' },
        { id: 'm5', roomId: 'p103', date: today, startTime: '09:10', endTime: '12:00', status: 'confirmed', totalPrice: 0, category: 'guest' },
        { id: 'm6', roomId: 'p104', date: today, startTime: '15:40', endTime: '17:10', status: 'confirmed', totalPrice: 0, category: 'guest' },
    ]
}

export const BookingPage = () => {
    const [date, setDate] = useState(new Date())
    const mockBookings = useMemo(() => getMockBookings(), [])

    return (
        <div className="px-4 py-8 pb-20 sm:px-8">
            <RoomSchedule
                date={date}
                rooms={demoRooms}
                bookings={mockBookings}
                onDateChange={setDate}
                startHour={0}
                endHour={22}
            />
        </div>
    )
}
