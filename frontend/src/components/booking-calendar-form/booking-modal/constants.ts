import type { BookingMode, RoomType } from "@/types/schedule";

/** Các hình thức đặt phòng: theo giờ, theo ngày, qua đêm */
export const BOOKING_MODES: { value: BookingMode; label: string }[] = [
    { value: "hourly", label: "Theo giờ" },
    { value: "daily", label: "Theo ngày (14:00-12:00)" },
    { value: "overnight", label: "Qua đêm (22:00-09:00)" },
];

/** Nhãn tiếng Việt cho từng hạng phòng */
export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
    standard: "Tiêu chuẩn",
    vip: "VIP",
    supervip: "Super VIP",
};

/** Danh sách giờ 00h-23h cho select chọn giờ */
export const HOURS = Array.from({ length: 24 }, (_, i) => ({
    value: String(i).padStart(2, "0") + "h",
    label: String(i).padStart(2, "0") + "h",
}));

/** Danh sách phút (bước 15 phút) cho select chọn phút */
export const MINUTES = [
    { value: "00", label: "00" },
    { value: "15", label: "15" },
    { value: "30", label: "30" },
    { value: "45", label: "45" },
];
