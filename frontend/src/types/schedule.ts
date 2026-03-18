import pepsi from "@/assets/pepsi.png";

// Các loại phòng có trong hệ thống
export type RoomType = 'standard' | 'vip' | 'supervip';

// Giao diện dữ liệu cho một phòng
export interface Room {
  id: string;      // Định danh duy nhất của phòng
  name: string;    // Tên hiển thị của phòng
  type: RoomType;  // Phân loại phòng
  images?: string[]; // Mảng chứa tối đa 5 URL hình ảnh
}

// Trạng thái của một đơn đặt phòng
export type BookingStatus = 'confirmed' | 'pending' | 'checked-in' | 'checked-out';

// Giao diện dữ liệu cho một đơn đặt phòng (Booking)
export interface Booking {
  id: string;          // Định danh duy nhất của đơn đặt phòng
  roomId: string;      // ID của phòng được đặt
  startTime: string;   // Thời gian bắt đầu (Định dạng: "HH:mm")
  endTime: string;     // Thời gian kết thúc (Định dạng: "HH:mm")
  guestName?: string;  // Tên khách hàng (tùy chọn)
  guestPhone?: string; // Số điện thoại khách (tùy chọn)
  status: BookingStatus; // Trạng thái hiện tại
  note?: string;       // Ghi chú thêm
  adults?: number;     // Số lượng người lớn
  foodItems?: FoodItem[]; // Danh sách món ăn/dịch vụ đi kèm
  totalPrice?: number; // Tổng giá tiền dự tính
}

// Thuộc tính truyền vào cho thành phần Schedule (Lịch trình)
export interface ScheduleProps {
  date: Date;             // Ngày hiển thị lịch
  rooms: Room[];          // Danh sách các phòng cần hiển thị
  bookings: Booking[];    // Danh sách các lượt đặt phòng tương ứng
  onDateChange?: (date: Date) => void; // Callback khi đổi ngày
  onBookingClick?: (booking: Booking) => void; // Callback khi nhấn vào một booking hiện có
  onEmptySlotClick?: (roomId: string, time: string) => void; // Callback khi nhấn vào ô trống
  onBookingCreate?: (booking: Omit<Booking, 'id'>) => void; // Callback khi tạo booking mới
  startHour?: number;  // Giờ bắt đầu hiển thị trên lịch (Mặc định: 0)
  endHour?: number;    // Giờ kết thúc hiển thị trên lịch (Mặc định: 24)
}

// Các tùy chọn bộ lọc cho lịch trình
export interface FilterOption {
  value: RoomType | 'all';
  label: string;
  active: boolean;
}

// Định nghĩa một khe thời gian (time slot) trên lịch
export interface TimeSlot {
  hour: number;
  label: string;
  isHighlighted?: boolean;
}

// Các chế độ đặt phòng được hỗ trợ
export type BookingMode = 'hourly' | 'daily' | 'overnight';

// Giao diện cho món ăn hoặc các combo dịch vụ
export interface FoodItem {
  id: string;
  name: string;
  price: number;
  selected?: boolean;
  qty?: number;
  image?: string;
}

// Cấu trúc dữ liệu form khi thực hiện đặt phòng (Booking Form)
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
  idImages: File[];      // Hình ảnh CCCD/Giấy tờ tùy thân
  foodItems: FoodItem[];  // Danh sách món ăn đã chọn
  selectedComboIds?: string[];
  note: string;
  voucher: string;
  acceptTerms: boolean;   // Đồng ý điều khoản
}

// Cấu trúc cấu hình giá cho từng loại phòng
export interface PriceConfig {
  hourlyRate: number;     // Giá theo giờ đầu
  dailyRate: number;      // Giá theo ngày
  overnightRate: number;  // Giá qua đêm
  extraHourRate: number;  // Giá mỗi giờ thêm sau giờ đầu
}

// Bảng giá chi tiết được định nghĩa cho từng loại phòng
export const ROOM_PRICES: Record<RoomType, PriceConfig> = {
  standard: {
    hourlyRate: 169000,
    dailyRate: 450000,
    overnightRate: 350000,
    extraHourRate: 40000,
  },
  vip: {
    hourlyRate: 21000,
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

// Dữ liệu mẫu cho danh sách món ăn
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
    name: 'Pepsi',
    price: 115000,
    image: pepsi,
  },
  {
    id: '5',
    name: 'Mỳ Ly',
    price: 20000,
    image: pepsi,
  },
  {
    id: '6',
    name: 'Sting',
    price: 15000,
    image: pepsi,
  },
];

// Dữ liệu mẫu cho các gói Combo ưu đãi
export const COMBO_ITEMS: FoodItem[] = [
  { id: 'c1', name: '1 MỲ LY + 1 XÚC SÍCH + 1 SUỐI', price: 25000 },
  { id: 'c2', name: '2 ÁO GIÁP', price: 20000 },
  { id: 'c3', name: '1 SNACK + 1 SUỐI', price: 15000 },
];
