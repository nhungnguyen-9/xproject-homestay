import type { BookingFormData, Booking } from "@/types/schedule";

/** Chuyển chuỗi ngày (YYYY-MM-DD) và giờ (HH:mm) thành timestamp tuyệt đối (local time) */
function toTimestamp(dateStr: string, time: string): number {
    const [y, M, d] = dateStr.split('-').map(Number);
    const [h, m] = time.split(':').map(Number);
    return new Date(y, M - 1, d, h, m, 0, 0).getTime();
}

/** Trả về khoảng thời gian {start, end} tuyệt đối của một booking */
function bookingRange(booking: Booking): { start: number; end: number } {
    const start = toTimestamp(booking.date, booking.startTime);
    let end = toTimestamp(booking.date, booking.endTime);
    // Nếu endTime <= startTime, coi như kết thúc vào ngày hôm sau (qua đêm)
    if (end <= start) end += 24 * 60 * 60 * 1000;
    return { start, end };
}

/**
 * Validate bước 1: kiểm tra thời lượng tối thiểu và phát hiện trùng lịch với booking hiện có
 */
export const validateStep1 = (
    formData: BookingFormData,
    bookings: Booking[],
    duration: number,
    _selectedDate: Date
): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (duration < 0.5) {
        newErrors.duration = "Thời gian đặt phòng tối thiểu 30 phút";
    }

    const inDate = formData.checkInDate instanceof Date
        ? formData.checkInDate.toISOString().split('T')[0]
        : String(formData.checkInDate);
    const outDate = formData.checkOutDate instanceof Date
        ? formData.checkOutDate.toISOString().split('T')[0]
        : String(formData.checkOutDate);

    const newStart = toTimestamp(inDate, formData.checkInTime);
    let newEnd = toTimestamp(outDate, formData.checkOutTime);
    
    // Nếu checkout <= checkin, cộng thêm 24h (trường hợp cùng ngày nhưng ghi giờ ngược)
    if (newEnd <= newStart) newEnd += 24 * 60 * 60 * 1000;

    // Phát hiện trùng lịch: so sánh với TẤT CẢ booking của phòng này
    const roomBookings = bookings.filter((b) => b.roomId === formData.roomId && b.status !== 'cancelled');
    for (const booking of roomBookings) {
        const { start: bStart, end: bEnd } = bookingRange(booking);
        
        // Overlap: newStart < bEnd && bStart < newEnd
        if (newStart < bEnd && bStart < newEnd) {
            newErrors.time = `Phòng đã được đặt từ ${booking.startTime} đến ${booking.endTime}${booking.date !== inDate ? ' (ca qua đêm từ ngày ' + booking.date + ')' : ''}`;
            break;
        }
    }

    return newErrors;
};

/**
 * Validate bước 2: kiểm tra họ tên, số điện thoại (10-11 số), và ảnh giấy tờ tuỳ thân
 */
export const validateStep2 = (formData: BookingFormData): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!formData.guestName.trim()) {
        newErrors.guestName = "Vui lòng nhập họ và tên";
    }

    if (!formData.guestPhone.trim()) {
        newErrors.guestPhone = "Vui lòng nhập số điện thoại";
    } else if (!/^[0-9]{10,11}$/.test(formData.guestPhone.replace(/\s/g, ""))) {
        newErrors.guestPhone = "Số điện thoại không hợp lệ";
    }

    if (formData.idImages.length === 0) {
        newErrors.idImages = "Vui lòng upload ảnh CMND/CCCD";
    }

    return newErrors;
};

/**
 * Validate bước 3: kiểm tra khách đã đồng ý điều khoản
 */
export const validateStep3 = (formData: BookingFormData): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!formData.acceptTerms) {
        newErrors.acceptTerms = "Vui lòng đồng ý với điều khoản";
    }

    return newErrors;
};
