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

    if (checkInDate.toDateString() === checkOutDate.toDateString()) {
        return Math.max(0, (checkOutMinutes - checkInMinutes) / 60);
    }

/**
 * Tính giá phòng dựa trên loại phòng, chế độ đặt, và thời lượng
 * @param roomType - Loại phòng (standard, vip, supervip)
 * @param mode - Chế độ đặt (hourly, daily, overnight)
 * @param duration - Thời lượng tính bằng giờ
 * @param priceConfig - Cấu hình giá từ ROOM_PRICES
 * @returns Tổng giá phòng (chưa tính đồ ăn)
 */
export const calculateBookingPrice = (
    mode: string,
    duration: number,
    priceConfig: { hourlyRate: number; dailyRate: number; overnightRate: number; extraHourRate: number }
): number => {
    if (mode === "hourly") {
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
        // Tương tự, giá qua đêm + giờ lẻ không vượt quá giá ngày tiếp theo (nếu có logic liên quan)
        // Ở đây tạm thời giới hạn ở mức dailyRate nếu vượt quá nhiều giờ
        return Math.min(
            priceConfig.overnightRate + extraHours * priceConfig.extraHourRate,
            priceConfig.dailyRate // Giả định qua đêm quá nhiều giờ thì tính bằng 1 ngày
        );
    }

    return Math.ceil(duration) * priceConfig.hourlyRate;
};

