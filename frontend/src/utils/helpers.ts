import type { DiscountSlot } from '@/types/room';

/**
 * Định dạng số tiền theo chuẩn Việt Nam (dấu chấm phân cách hàng nghìn)
 * @param price - Số tiền cần định dạng
 * @returns Chuỗi đã định dạng, ví dụ: "1.000.000"
 */
export const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN').format(price);
};

/**
 * Định dạng ngày theo kiểu Việt Nam (DD/MM/YYYY)
 * @param date - Đối tượng Date cần định dạng
 * @returns Chuỗi ngày dạng "dd/mm/yyyy"
 */
export const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Định dạng ngày cho input HTML (YYYY-MM-DD)
 * @param date - Đối tượng Date cần định dạng
 * @returns Chuỗi ngày dạng "yyyy-mm-dd"
 */
export const formatDateInput = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
};

/**
 * Chuyển đổi chuỗi thời gian "HH:mm" sang tổng số phút
 * @param time - Chuỗi thời gian dạng "HH:mm"
 * @returns Tổng số phút tính từ 00:00
 */
export const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

/**
 * Tính thời lượng giữa hai mốc thời gian (tính bằng giờ)
 * @param checkInDate - Ngày nhận phòng
 * @param checkInTime - Giờ nhận phòng (HH:mm)
 * @param checkOutDate - Ngày trả phòng
 * @param checkOutTime - Giờ trả phòng (HH:mm)
 * @returns Số giờ chênh lệch (tối thiểu 0)
 */
export const calculateDuration = (
    checkInDate: Date,
    checkInTime: string,
    checkOutDate: Date,
    checkOutTime: string
): number => {
    const checkInMinutes = timeToMinutes(checkInTime);
    const checkOutMinutes = timeToMinutes(checkOutTime);

    // Tạo bản sao để so sánh ngày (không quan tâm giờ phút)
    const d1 = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
    const d2 = new Date(checkOutDate.getFullYear(), checkOutDate.getMonth(), checkOutDate.getDate());

    if (d1.getTime() === d2.getTime()) {
        return Math.max(0, (checkOutMinutes - checkInMinutes) / 60);
    }

    const dayDiff = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    const totalMinutes = (dayDiff * 24 * 60) + checkOutMinutes - checkInMinutes;
    return Math.max(0, totalMinutes / 60);
};

/** Subset trường giá mà calculateBookingPrice cần — phủ toàn bộ mode */
export interface BookingPriceConfig {
    hourlyRate: number;
    dailyRate: number;
    overnightRate: number;
    extraHourRate: number;
    combo3hRate: number;
    combo6h1hRate: number;
    combo6h1hDiscount: number;
    discountSlots?: DiscountSlot[];
}

function computeHourlyCostMinuteWalk(
    startMin: number,
    endMin: number,
    hourlyRate: number,
    slots: DiscountSlot[] | undefined,
): number {
    if (endMin <= startMin) return 0;
    const perMinute = hourlyRate / 60;
    const totalMinutes = endMin - startMin;
    if (!slots || slots.length === 0) return Math.round(perMinute * totalMinutes);
    let sum = 0;
    for (let m = startMin; m < endMin; m++) {
        let maxPct = 0;
        for (const s of slots) {
            const sStart = timeToMinutes(s.startTime);
            const sEnd = timeToMinutes(s.endTime);
            if (m >= sStart && m < sEnd && s.discountPercent > maxPct) maxPct = s.discountPercent;
        }
        sum += perMinute * (1 - maxPct / 100);
    }
    return Math.round(sum);
}

/**
 * Tính giá phòng dựa trên loại phòng, chế độ đặt, và thời lượng
 * @param mode - Chế độ đặt (hourly, daily, overnight, combo3h, combo6h1h)
 * @param duration - Thời lượng tính bằng giờ (bỏ qua với combo modes)
 * @param priceConfig - Cấu hình giá từ ROOM_PRICES hoặc RoomDetail
 * @param combo6h1hOption - Khi mode=combo6h1h: 'bonus_hour' (7h, full price) hoặc 'discount' (6h, trừ discount)
 * @param times - Giờ nhận/trả phòng (HH:mm) — bắt buộc khi có discountSlots để áp đúng khung giờ
 * @returns Tổng giá phòng (chưa tính đồ ăn)
 */
export const calculateBookingPrice = (
    mode: string,
    duration: number,
    priceConfig: BookingPriceConfig,
    combo6h1hOption: 'bonus_hour' | 'discount' = 'bonus_hour',
    times?: { startTime: string; endTime: string },
): number => {
    const hasDiscount = (priceConfig.discountSlots?.length ?? 0) > 0 && !!times;

    if (mode === "hourly") {
        if (hasDiscount) {
            const startMin = timeToMinutes(times!.startTime);
            const billedMinutes = Math.max(1, Math.ceil(duration)) * 60;
            return computeHourlyCostMinuteWalk(startMin, startMin + billedMinutes, priceConfig.hourlyRate, priceConfig.discountSlots);
        }
        return Math.max(1, Math.ceil(duration)) * priceConfig.hourlyRate;
    }

    if (mode === "daily") {
        const fullDays = Math.max(1, Math.floor(duration / 24) || 1);
        const remainingHours = duration - fullDays * 24;
        const extraHours = Math.max(0, Math.ceil(remainingHours));

        // Giá = (số ngày * dailyRate) + (giờ lẻ * extraRate), nhưng không vượt quá (số ngày + 1) * dailyRate
        const basePrice = fullDays * priceConfig.dailyRate;
        const extraPrice = extraHours * priceConfig.extraHourRate;
        return Math.min(basePrice + extraPrice, (fullDays + 1) * priceConfig.dailyRate);
    }

    if (mode === "overnight") {
        const OVERNIGHT_BASE_HOURS = 11;
        if (duration <= OVERNIGHT_BASE_HOURS) {
            return priceConfig.overnightRate;
        }
        const extraHours = Math.ceil(duration - OVERNIGHT_BASE_HOURS);
        // Giới hạn giá qua đêm + giờ lẻ không vượt quá dailyRate (giá 1 ngày)
        return Math.min(
            priceConfig.overnightRate + extraHours * priceConfig.extraHourRate,
            priceConfig.dailyRate
        );
    }

    if (mode === "combo3h") {
        if (hasDiscount) {
            const startMin = timeToMinutes(times!.startTime);
            const overage = Math.max(0, Math.ceil(duration) - 3);
            const overageStart = startMin + 3 * 60;
            const overageEnd = overageStart + overage * 60;
            const overageCost = computeHourlyCostMinuteWalk(overageStart, overageEnd, priceConfig.extraHourRate, priceConfig.discountSlots);
            return priceConfig.combo3hRate + overageCost;
        }
        return priceConfig.combo3hRate;
    }

    if (mode === "combo6h1h") {
        if (combo6h1hOption === 'discount') {
            return Math.max(0, priceConfig.combo6h1hRate - priceConfig.combo6h1hDiscount);
        }
        return priceConfig.combo6h1hRate;
    }

    return Math.ceil(duration) * priceConfig.hourlyRate;
};
