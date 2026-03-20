import pepsi from "@/assets/pepsi.png";

// Room types
export type RoomType = 'standard' | 'vip' | 'supervip';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
}

// Booking status
export type BookingStatus = 'confirmed' | 'pending' | 'checked-in' | 'checked-out' | 'cancelled';

// Internal booking tags
export type InternalTag = 'cleaning' | 'maintenance' | 'locked' | 'custom';
export type BookingCategory = 'guest' | 'internal';

// Booking interface
export interface Booking {
  id: string;
  roomId: string;
  date: string;              // ISO date "YYYY-MM-DD"
  startTime: string;         // Format: "HH:mm"
  endTime: string;           // Format: "HH:mm"
  guestName?: string;
  guestPhone?: string;
  status: BookingStatus;
  note?: string;
  adults?: number;
  foodItems?: FoodItem[];
  totalPrice: number;        // Required. Internal bookings: 0.
  voucher?: string;          // Promo code string
  category: BookingCategory;
  internalTag?: InternalTag;
  internalNote?: string;
  createdBy?: string;
}

// Schedule props
export interface ScheduleProps {
  date: Date;
  rooms: Room[];
  bookings: Booking[];
  onDateChange?: (date: Date) => void;
  onBookingClick?: (booking: Booking) => void;
  onEmptySlotClick?: (roomId: string, time: string) => void;
  onBookingCreate?: (booking: Omit<Booking, 'id'>) => void;
  startHour?: number;  // Default: 0
  endHour?: number;    // Default: 24
}

// Filter options
export interface FilterOption {
  value: RoomType | 'all';
  label: string;
  active: boolean;
}

// Time slot
export interface TimeSlot {
  hour: number;
  label: string;
  isHighlighted?: boolean;
}

// Booking type mode
export type BookingMode = 'hourly' | 'daily' | 'overnight';

// Food/Combo items
export interface FoodItem {
  id: string;
  name: string;
  price: number;
  selected?: boolean;
  qty?: number;
  image?: string;
}

// Booking form data
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

// Price config
export interface PriceConfig {
  hourlyRate: number;
  dailyRate: number;
  overnightRate: number;
  extraHourRate: number;
}

// Room price config by type
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

// Demo food items
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

// Combo items (special combos shown separately)
export const COMBO_ITEMS: FoodItem[] = [
  { id: 'c1', name: '1 MỲ LY + 1 XÚC SÍCH + 1 SUỐI', price: 25000 },
  { id: 'c2', name: '2 ÁO GIÁP', price: 20000 },
  { id: 'c3', name: '1 SNACK + 1 SUỐI', price: 15000 },
];
