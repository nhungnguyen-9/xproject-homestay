import pepsi from "@/assets/pepsi.png";
import type { DiscountSlot } from "@/types/room";

/** Loại phòng: tiêu chuẩn, VIP, hoặc super VIP */
export type RoomType = 'standard' | 'vip' | 'supervip';

/** Thông tin phòng nghỉ */
export interface Room {
  id: string;
  name: string;
  type: RoomType;
  branchId?: string | null;
  amenities?: string[];
  hourlyRate?: number;
  dailyRate?: number;
  overnightRate?: number;
  extraHourRate?: number;
  combo3hRate?: number;
  combo6h1hRate?: number;
  combo6h1hDiscount?: number;
  discountSlots?: DiscountSlot[];
}

/** Lấy PriceConfig từ Room — dùng giá thực từ API, fallback về ROOM_PRICES mặc định */
export function getRoomPriceConfig(room: Pick<Room, 'type' | 'hourlyRate' | 'dailyRate' | 'overnightRate' | 'extraHourRate' | 'combo3hRate' | 'combo6h1hRate' | 'combo6h1hDiscount' | 'discountSlots'>): PriceConfig {
  const fallback = ROOM_PRICES[room.type];
  return {
    hourlyRate: room.hourlyRate ?? fallback.hourlyRate,
    dailyRate: room.dailyRate ?? fallback.dailyRate,
    overnightRate: room.overnightRate ?? fallback.overnightRate,
    extraHourRate: room.extraHourRate ?? fallback.extraHourRate,
    combo3hRate: room.combo3hRate ?? fallback.combo3hRate,
    combo6h1hRate: room.combo6h1hRate ?? fallback.combo6h1hRate,
    combo6h1hDiscount: room.combo6h1hDiscount ?? fallback.combo6h1hDiscount,
    discountSlots: room.discountSlots,
  };
}

/** Trạng thái đặt phòng */
export type BookingStatus = 'confirmed' | 'pending' | 'checked-in' | 'checked-out' | 'cancelled';

/** Nhãn nội bộ cho việc quản lý phòng */
export type InternalTag = 'cleaning' | 'maintenance' | 'locked' | 'custom';

/** Phân loại đặt phòng: khách hàng hoặc nội bộ */
export type BookingCategory = 'guest' | 'internal';

/** Thông tin chi tiết một lượt đặt phòng */
export interface Booking {
  id: string;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  guestName?: string;
  guestPhone?: string;
  status: BookingStatus;
  note?: string;
  adults?: number;
  foodItems?: FoodItem[];
  totalPrice: number;
  voucher?: string;
  category: BookingCategory;
  internalTag?: InternalTag;
  internalNote?: string;
  createdBy?: string;
}

/** Props cho component lịch đặt phòng */
export interface ScheduleProps {
  date: Date;
  rooms: Room[];
  bookings: Booking[];
  onDateChange?: (date: Date) => void;
  onBookingClick?: (booking: Booking) => void;
  onEmptySlotClick?: (roomId: string, time: string) => void;
  onBookingCreate?: (booking: Omit<Booking, 'id'>) => void;
  startHour?: number;
  endHour?: number;
  focusedRoomId?: string | null;
  onFocusChange?: (roomId: string | null) => void;
  /** Map roomId → amenities array for dynamic legend rendering */
  roomAmenities?: Record<string, string[]>;
}

/** Tùy chọn bộ lọc loại phòng */
export interface FilterOption {
  value: RoomType | 'all';
  label: string;
  active: boolean;
}

/** Khung giờ hiển thị trên lịch */
export interface TimeSlot {
  hour: number;
  label: string;
  isHighlighted?: boolean;
}

/** Chế độ đặt phòng: theo giờ, theo ngày, qua đêm, combo 3H, hoặc combo 6H+1H */
export type BookingMode = 'hourly' | 'daily' | 'overnight' | 'combo3h' | 'combo6h1h';

/** Tuỳ chọn khi chọn combo 6H+1H: nhận 1 giờ bonus hay nhận giảm giá thay thế */
export type Combo6h1hOption = 'bonus_hour' | 'discount';

/** Món ăn/đồ uống kèm theo đặt phòng */
export interface FoodItem {
  id: string;
  name: string;
  price: number;
  selected?: boolean;
  qty?: number;
  image?: string;
}

/** Dữ liệu form đặt phòng từ người dùng */
export interface BookingFormData {
  roomId: string;
  roomType: RoomType;
  roomName: string;
  mode: BookingMode;
  checkInDate: Date;
  checkInTime: string;
  checkOutDate: Date;
  checkOutTime: string;
  adults: number;
  guestName: string;
  guestPhone: string;
  idImages: File[];
  foodItems: FoodItem[];
  selectedComboIds?: string[];
  note: string;
  voucher: string;
  acceptTerms: boolean;
  customerLookup?: import('@/types/customer').CustomerLookup | null;
  /** Tuỳ chọn khi mode = combo6h1h — mặc định 'bonus_hour' */
  combo6h1hOption?: Combo6h1hOption;
}

/** Cấu hình giá phòng theo từng chế độ */
export interface PriceConfig {
  hourlyRate: number;
  dailyRate: number;
  overnightRate: number;
  extraHourRate: number;
  /** Giá combo 3H trọn gói (thay cho hourlyRate * 3) */
  combo3hRate: number;
  /** Giá combo 6H + 1H bonus trọn gói */
  combo6h1hRate: number;
  /** Số tiền giảm khi khách không lấy 1H bonus (chỉ còn 6H) */
  combo6h1hDiscount: number;
  discountSlots?: DiscountSlot[];
}

/** Bảng giá phòng theo từng loại phòng */
export const ROOM_PRICES: Record<RoomType, PriceConfig> = {
  standard: {
    hourlyRate: 169000,
    dailyRate: 450000,
    overnightRate: 350000,
    extraHourRate: 40000,
    combo3hRate: 420000,
    combo6h1hRate: 560000,
    combo6h1hDiscount: 60000,
  },
  vip: {
    hourlyRate: 210000,
    dailyRate: 550000,
    overnightRate: 450000,
    extraHourRate: 50000,
    combo3hRate: 520000,
    combo6h1hRate: 720000,
    combo6h1hDiscount: 80000,
  },
  supervip: {
    hourlyRate: 269000,
    dailyRate: 650000,
    overnightRate: 550000,
    extraHourRate: 60000,
    combo3hRate: 650000,
    combo6h1hRate: 880000,
    combo6h1hDiscount: 100000,
  },
};

/** Danh sách đồ ăn/đồ uống có thể đặt kèm */
export const FOOD_ITEMS: FoodItem[] = [
  {
    id: 'f1',
    name: 'Pepsi',
    price: 15000,
    image: pepsi,
  },
  {
    id: 'f2',
    name: 'Coca Cola',
    price: 15000,
    image: pepsi,
  },
  {
    id: 'f3',
    name: 'Sting',
    price: 15000,
    image: pepsi,
  },
  {
    id: 'f4',
    name: 'Mỳ Ly',
    price: 20000,
    image: pepsi,
  },
  {
    id: 'f5',
    name: 'Nước Suối',
    price: 10000,
    image: pepsi,
  },
  {
    id: 'f6',
    name: 'Xúc Xích',
    price: 15000,
    image: pepsi,
  },
];

/** Danh sách combo đồ ăn ưu đãi */
export const COMBO_ITEMS: FoodItem[] = [
  { id: 'c1', name: '1 MỲ LY + 1 XÚC SÍCH + 1 SUỐI', price: 25000 },
  { id: 'c2', name: '2 ÁO GIÁP', price: 20000 },
  { id: 'c3', name: '1 SNACK + 1 SUỐI', price: 15000 },
];
