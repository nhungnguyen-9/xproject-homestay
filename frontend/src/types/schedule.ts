// Room types
export type RoomType = 'standard' | 'vip' | 'supervip';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
}

// Booking status
export type BookingStatus = 'confirmed' | 'pending' | 'checked-in' | 'checked-out';

// Booking interface
export interface Booking {
  id: string;
  roomId: string;
  startTime: string; // Format: "HH:mm"
  endTime: string;   // Format: "HH:mm"
  guestName?: string;
  status: BookingStatus;
  note?: string;
}

// Schedule props
export interface ScheduleProps {
  date: Date;
  rooms: Room[];
  bookings: Booking[];
  onDateChange?: (date: Date) => void;
  onBookingClick?: (booking: Booking) => void;
  onEmptySlotClick?: (roomId: string, time: string) => void;
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
