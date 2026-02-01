import type { BookingFormData, Booking } from "@/types/schedule";
import { timeToMinutes } from "@/utils/helpers";

export const validateStep1 = (
    formData: BookingFormData,
    bookings: Booking[],
    duration: number,
    selectedDate: Date
): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (duration < 0.5) {
        newErrors.duration = "Thời gian đặt phòng tối thiểu 30 phút";
    }

    // Check for overlapping bookings
    const roomBookings = bookings.filter((b) => b.roomId === formData.roomId);
    const checkInMinutes = timeToMinutes(formData.checkInTime);
    const checkOutMinutes = timeToMinutes(formData.checkOutTime);

    for (const booking of roomBookings) {
        const bookingStart = timeToMinutes(booking.startTime);
        const bookingEnd = timeToMinutes(booking.endTime);

        // Check overlap (same day only for now)
        if (formData.checkInDate.toDateString() === selectedDate.toDateString()) {
            if (
                (checkInMinutes >= bookingStart && checkInMinutes < bookingEnd) ||
                (checkOutMinutes > bookingStart && checkOutMinutes <= bookingEnd) ||
                (checkInMinutes <= bookingStart && checkOutMinutes >= bookingEnd)
            ) {
                newErrors.time = `Phòng đã được đặt từ ${booking.startTime} đến ${booking.endTime}`;
            }
        }
    }

    return newErrors;
};

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

export const validateStep3 = (formData: BookingFormData): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!formData.acceptTerms) {
        newErrors.acceptTerms = "Vui lòng đồng ý với điều khoản";
    }

    return newErrors;
};
