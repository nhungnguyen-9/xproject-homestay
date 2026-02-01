import type { BookingMode, RoomType } from "@/types/schedule";

export const BOOKING_MODES: { value: BookingMode; label: string }[] = [
    { value: "hourly", label: "Theo giờ" },
    { value: "daily", label: "Theo ngày (14:00-12:00)" },
    { value: "overnight", label: "Qua đêm (22:00-09:00)" },
];

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
    standard: "Tiêu chuẩn",
    vip: "VIP",
    supervip: "Super VIP",
};

// Generate hours array from 0-23
export const HOURS = Array.from({ length: 24 }, (_, i) => ({
    value: String(i).padStart(2, "0") + "h",
    label: String(i).padStart(2, "0") + "h",
}));

export const MINUTES = [
    { value: "00", label: "00" },
    { value: "15", label: "15" },
    { value: "30", label: "30" },
    { value: "45", label: "45" },
];
