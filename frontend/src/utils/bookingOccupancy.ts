import type { Booking } from '@/types/schedule'
import { timeToMinutes } from './helpers'

type OccupancyBooking = Pick<Booking, 'date' | 'startTime' | 'endTime' | 'status'>

/**
 * Kiểm tra một slot trên timeline ngày `viewingDate` có bị chiếm bởi bất kỳ booking nào không.
 *
 * Giả định caller đã filter `bookings` theo đúng room (list chỉ chứa booking của 1 phòng).
 * Hỗ trợ booking qua đêm (end ≤ start → cộng 24h), và booking của ngày `viewingDate - 1`
 * đang wrap vào ngày hiện tại (chỉ xét phần [00:00, endTime)).
 *
 * @param slotStartMin/slotEndMin — phạm vi slot tính bằng phút tính từ 00:00 của `viewingDate` (0..1440)
 * @param bufferMin — đệm giữa các booking (phút) để tránh đặt sát nhau; default 10
 */
export function isSlotOccupied(
    bookings: OccupancyBooking[],
    viewingDate: string,
    slotStartMin: number,
    slotEndMin: number,
    bufferMin = 10,
): boolean {
    return bookings.some((b) => {
        if (b.status === 'cancelled') return false

        const startMin = timeToMinutes(b.startTime)
        let endMin = timeToMinutes(b.endTime)
        const isOvernight = endMin <= startMin
        if (isOvernight) endMin += 24 * 60

        if (b.date === viewingDate) {
            return startMin < slotEndMin && endMin + bufferMin > slotStartMin
        }

        if (isOvernight) {
            const wrapEndMin = endMin - 24 * 60
            return slotStartMin < wrapEndMin + bufferMin
        }

        return false
    })
}
