import pepsi from "@/assets/pepsi.png";

/** Loại phòng: tiêu chuẩn, VIP, hoặc super VIP */
export type RoomType = 'standard' | 'vip' | 'supervip';

/** Thông tin phòng nghỉ */
export interface Room {
  id: string;
  name: string;
  type: RoomType;
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

/** Chế độ đặt phòng: theo giờ, theo ngày, hoặc qua đêm */
export type BookingMode = 'hourly' | 'daily' | 'overnight';

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
}

/** Cấu hình giá phòng theo từng chế độ */
export interface PriceConfig {
  hourlyRate: number;
  dailyRate: number;
  overnightRate: number;
  extraHourRate: number;
}

/** Bảng giá phòng theo từng loại phòng */
export const ROOM_PRICES: Record<RoomType, PriceConfig> = {
  standard: {
    hourlyRate: 169000,
    dailyRate: 450000,
    overnightRate: 350000,
    extraHourRate: 40000,
  },
  vip: {
    hourlyRate: 210000,
    dailyRate: 550000,
    overnightRate: 450000,
    extraHourRate: 50000,
  },
  supervip: {
    hourlyRate: 269000,
    dailyRate: 650000,
    overnightRate: 550000,
    extraHourRate: 60000,
  },
};

/** Danh sách đồ ăn/đồ uống có thể đặt kèm */
export const FOOD_ITEMS: FoodItem[] = [
  {
    id: '1',
    name: 'Pepsi',
    price: 11000,
    image: pepsi,
  },
  {
    id: '2',
    name: 'Mỳ Ly',
    price: 20000,
    image: pepsi,
  },
  {
    id: '3',
    name: 'Sting',
    price: 15000,
    image: pepsi,
  },
  {
    id: '4',
    name: 'Pepsi (lon)',
    price: 115000,
    image: pepsi,
  },
  {
    id: '5',
    name: 'Mỳ Ly (hộp)',
    price: 20000,
    image: pepsi,
  },
  {
    id: '6',
    name: 'Sting (lon)',
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
