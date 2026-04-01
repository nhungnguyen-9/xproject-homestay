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

    const dayDiff = Math.floor((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalMinutes = (dayDiff * 24 * 60) + checkOutMinutes - checkInMinutes;
    return Math.max(0, totalMinutes / 60);
};
