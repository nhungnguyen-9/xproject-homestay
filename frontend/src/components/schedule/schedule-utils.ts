import type { Booking } from '@/types/schedule';

export const HOUR_WIDTH = 80;

const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

export const getBookingPosition = (
    booking: Pick<Booking, 'date' | 'startTime' | 'endTime'>,
    viewingDate: string,
    startHour: number
): { left: number; width: number } => {
    const startMin = timeToMinutes(booking.startTime);
    let endMin = timeToMinutes(booking.endTime);
    const isOvernight = endMin <= startMin;
    if (isOvernight) endMin += 24 * 60;

    if (booking.date === viewingDate) {
        const left = ((startMin - startHour * 60) / 60) * HOUR_WIDTH;
        const clampedEndMin = Math.min(endMin, 24 * 60);
        const width = ((clampedEndMin - startMin) / 60) * HOUR_WIDTH;
        return { left, width };
    }

    if (isOvernight) {
        const wrapEndMin = endMin - 24 * 60;
        const left = ((0 - startHour * 60) / 60) * HOUR_WIDTH;
        const width = (wrapEndMin / 60) * HOUR_WIDTH;
        return { left, width };
    }

    return { left: 0, width: 0 };
};
