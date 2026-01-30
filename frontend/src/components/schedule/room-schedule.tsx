import React, { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type {
    Room,
    Booking,
    RoomType,
    ScheduleProps,
    FilterOption,
} from '@/types/schedule';
import { HelpCircle } from 'lucide-react';

// ==================== CONSTANTS ====================
const HOUR_WIDTH = 120; // pixels per hour
const ROOM_LABEL_WIDTH = 80;
const HEADER_HEIGHT = 50;
const ROW_HEIGHT = 50;

// Highlighted hours (có icon đặc biệt)
const HIGHLIGHTED_HOURS = [6, 8, 10, 12, 14, 16];

// ==================== HELPER FUNCTIONS ====================
const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const formatTime = (time: string): string => {
    return time; // Already in HH:mm format
};

const getBookingPosition = (
    startTime: string,
    endTime: string,
    startHour: number
): { left: number; width: number } => {
    const startMinutes = timeToMinutes(startTime) - startHour * 60;
    const endMinutes = timeToMinutes(endTime) - startHour * 60;
    const duration = endMinutes - startMinutes;

    const left = (startMinutes / 60) * HOUR_WIDTH;
    const width = (duration / 60) * HOUR_WIDTH;

    return { left, width };
};

// ==================== SUB COMPONENTS ====================

// Filter Button Component
interface FilterButtonProps {
    label: string;
    active: boolean;
    onClick: () => void;
    variant?: 'standard' | 'vip' | 'supervip';
}

const FilterButton: React.FC<FilterButtonProps> = ({
    label,
    active,
    onClick,
    variant = 'standard',
}) => {
    const variantStyles = {
        standard: active
            ? 'bg-rose-400 text-white'
            : 'bg-white text-black border-rose-300 hover:border-rose-200',
        vip: active
            ? 'bg-rose-400 text-white'
            : 'bg-white text-black border-rose-300 hover:border-rose-200',
        supervip: active
            ? 'bg-rose-400 text-white'
            : 'bg-white text-black border-rose-300 hover:border-rose-200',
    };

    return (
        <button
            onClick={onClick}
            className={cn(
                'px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg border text-xs lg:text-sm font-medium transition-all whitespace-nowrap',
                variantStyles[variant]
            )}
        >
            {label}
        </button>
    );
};

// Date Picker Component
interface DatePickerProps {
    date: Date;
    onChange: (date: Date) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ date, onChange }) => {
    const formatDate = (d: Date): string => {
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();
        return `${month}/${day}/${year}`;
    };

    return (
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 lg:px-3 py-1.5 lg:py-2">
            <span className="text-black text-xs lg:text-sm font-semibold whitespace-nowrap">Chọn ngày:</span>
            <div className="flex items-center gap-2">
                {/* <Calendar className="w-4 h-4 text-rose-500" /> */}
                <input
                    type="date"
                    value={date.toISOString().split('T')[0]}
                    onChange={(e) => onChange(new Date(e.target.value))}
                    className="border-none outline-none text-xs lg:text-sm bg-transparent"
                />
            </div>
        </div>
    );
};

// Timeline Header Component
interface TimelineHeaderProps {
    startHour: number;
    endHour: number;
    currentTime: Date;
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({
    startHour,
    endHour,
}) => {
    const hours = [];
    for (let i = startHour; i <= endHour; i += 2) {
        hours.push(i);
    }

    return (
        <div
            className="flex bg-gray-50 border-b border-gray-200"
            style={{ height: HEADER_HEIGHT }}
        >
            {/* Room label column */}
            <div
                className="flex items-center justify-center bg-rose-400 text-white font-medium text-sm shrink-0 rounded-md m-1"
                style={{ width: ROOM_LABEL_WIDTH }}
            >
                Phòng
            </div>

            {/* Timeline */}
            <div className="flex-1 flex relative">
                {hours.map((hour) => {
                    const isHighlighted = HIGHLIGHTED_HOURS.includes(hour);
                    return (
                        <div
                            key={hour}
                            className="flex items-center justify-center border-l border-gray-200 text-sm text-gray-600"
                            style={{ width: HOUR_WIDTH * 2 }}
                        >
                            {isHighlighted ? (
                                <div className="flex items-center gap-1 bg-amber-100 px-2 py-1 rounded">
                                    <span className="font-medium">{String(hour).padStart(2, '0')}h</span>
                                    <span className="text-amber-500">📅</span>
                                </div>
                            ) : (
                                <span>{String(hour).padStart(2, '0')}h</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Booking Block Component
interface BookingBlockProps {
    booking: Booking;
    startHour: number;
    onClick?: (booking: Booking) => void;
}

const BookingBlock: React.FC<BookingBlockProps> = ({
    booking,
    startHour,
    onClick,
}) => {
    const { left, width } = getBookingPosition(
        booking.startTime,
        booking.endTime,
        startHour
    );

    // Handle bookings that span across days
    if (width <= 0) return null;

    return (
        <div
            className={cn(
                'absolute top-1 bottom-1 rounded cursor-pointer',
                'bg-rose-400/90 hover:bg-rose-500 transition-colors',
                'flex items-center overflow-hidden'
            )}
            style={{
                left: `${left}px`,
                width: `${Math.max(width, 30)}px`,
            }}
            onClick={() => onClick?.(booking)}
            title={`${booking.startTime} - ${booking.endTime}`}
        >
            <div className="flex items-center justify-between w-full px-2 text-white text-xs">
                <span className="font-medium truncate">{formatTime(booking.startTime)}</span>
                {width > 80 && (
                    <>
                        <span className="mx-1">→</span>
                        <span className="font-medium truncate">{formatTime(booking.endTime)}</span>
                    </>
                )}
            </div>
        </div>
    );
};

// Room Row Component
interface RoomRowProps {
    room: Room;
    bookings: Booking[];
    startHour: number;
    endHour: number;
    onBookingClick?: (booking: Booking) => void;
    onEmptySlotClick?: (roomId: string, time: string) => void;
}

const RoomRow: React.FC<RoomRowProps> = ({
    room,
    bookings,
    startHour,
    endHour,
    onBookingClick,
}) => {
    const totalWidth = (endHour - startHour) * HOUR_WIDTH;

    const roomTypeColors = {
        standard: 'rounded-md m-1 bg-rose-400 text-white font-medium text-sm shrink-0',
        vip: 'rounded-md m-1 bg-rose-400 text-white font-medium text-sm shrink-0',
        supervip: 'rounded-md m-1 bg-rose-400 text-white font-medium text-sm shrink-0',
    };

    return (
        <div className="flex border-b border-gray-200" style={{ height: ROW_HEIGHT }}>
            {/* Room label */}
            <div
                className={cn(
                    'flex items-center justify-center text-white font-medium text-sm shrink-0',
                    roomTypeColors[room.type]
                )}
                style={{ width: ROOM_LABEL_WIDTH }}
            >
                {room.name}
            </div>

            {/* Timeline slots */}
            <div className="flex-1 relative bg-white">
                {/* Grid lines */}
                <div className="absolute inset-0 flex">
                    {Array.from({ length: (endHour - startHour) / 2 }).map((_, i) => (
                        <div
                            key={i}
                            className="border-l border-gray-100"
                            style={{ width: HOUR_WIDTH * 2 }}
                        />
                    ))}
                </div>

                {/* Bookings */}
                <div className="absolute inset-0" style={{ width: totalWidth }}>
                    {bookings.map((booking) => (
                        <BookingBlock
                            key={booking.id}
                            booking={booking}
                            startHour={startHour}
                            onClick={onBookingClick}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

// Current Time Indicator
interface CurrentTimeIndicatorProps {
    currentTime: Date;
    startHour: number;
}

const CurrentTimeIndicator: React.FC<CurrentTimeIndicatorProps> = ({
    currentTime,
    startHour,
}) => {
    const currentMinutes =
        currentTime.getHours() * 60 + currentTime.getMinutes() - startHour * 60;
    const left = (currentMinutes / 60) * HOUR_WIDTH + ROOM_LABEL_WIDTH;

    const timeLabel = `${String(currentTime.getHours()).padStart(2, '0')}:${String(
        currentTime.getMinutes()
    ).padStart(2, '0')}`;

    return (
        <div
            className="absolute top-0 bottom-0 z-20 pointer-events-none"
            style={{ left: `${left}px` }}
        >
            {/* Time label */}
            <div className="absolute -top-5 -translate-x-1/2 bg-rose-500 text-white text-xs px-2 py-0.5 rounded flex items-center justify-center gap-0.5 font-semibold">
                ⏰
                <span>{timeLabel}</span>
            </div>
            {/* Vertical line */}
            <div className="w-0.5 h-full bg-rose-500" />
        </div>
    );
};

// ==================== MAIN COMPONENT ====================
export const RoomSchedule: React.FC<ScheduleProps> = ({
    date,
    rooms,
    bookings,
    onDateChange,
    onBookingClick,
    onEmptySlotClick,
    startHour = 0,
    endHour = 22,
}) => {
    const [selectedDate, setSelectedDate] = useState(date);
    const [filters, setFilters] = useState<FilterOption[]>([
        { value: 'standard', label: 'Tiêu chuẩn', active: true },
        { value: 'vip', label: 'VIP', active: true },
        { value: 'supervip', label: 'SuperVip', active: true },
    ]);

    // Set demo time to 02:00 (change this to new Date() for real time)
    const [currentTime, setCurrentTime] = useState(() => {
        const demoTime = new Date();
        demoTime.setHours(2, 0, 0, 0);
        return demoTime;
    });

    // Update current time every minute
    useEffect(() => {
        const interval = setInterval(() => {
            // For demo: keep at 02:00, for real time use: setCurrentTime(new Date());
            const demoTime = new Date();
            demoTime.setHours(2, 0, 0, 0);
            setCurrentTime(demoTime);
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Filter rooms based on selected filters
    const filteredRooms = useMemo(() => {
        const activeTypes = filters
            .filter((f) => f.active)
            .map((f) => f.value as RoomType);
        return rooms.filter((room) => activeTypes.includes(room.type));
    }, [rooms, filters]);

    // Get bookings for each room
    const getBookingsForRoom = (roomId: string): Booking[] => {
        return bookings.filter((b) => b.roomId === roomId);
    };

    // Handle date change
    const handleDateChange = (newDate: Date) => {
        setSelectedDate(newDate);
        onDateChange?.(newDate);
    };

    // Toggle filter
    const toggleFilter = (value: RoomType | 'all') => {
        setFilters((prev) =>
            prev.map((f) => (f.value === value ? { ...f, active: !f.active } : f))
        );
    };

    const totalWidth = (endHour - startHour) * HOUR_WIDTH + ROOM_LABEL_WIDTH;

    return (
        <div className="max-w-7xl mx-auto">
            <div className='w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-center mb-4 lg:mb-8'>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 lg:gap-6 p-2 sm:p-3 lg:p-4 border-t border-gray-200">
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 rounded bg-rose-400" />
                        <span className="text-[10px] sm:text-xs lg:text-sm text-gray-600">Đã đặt</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 rounded bg-white border border-gray-200" />
                        <span className="text-[10px] sm:text-xs lg:text-sm text-gray-600">Trống</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-0.5 h-2.5 sm:h-3 lg:h-4 bg-rose-500" />
                        <span className="text-[10px] sm:text-xs lg:text-sm text-gray-600">Thời gian hiện tại</span>
                    </div>
                </div>
                <div className='text-center text-blue-500 w-full px-2 sm:px-4 text-[11px] sm:text-xs lg:text-sm'>
                    <span className='font-bold'>💡 Hướng dẫn:</span>
                    <span> Kéo trên timeline để xem phòng trống. Nhấn vào khung thời gian trống <span className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 rounded bg-white border border-gray-200 align-middle mx-0.5" /> để bắt đầu đặt phòng</span>
                </div>
                <p className='text-amber-500 font-semibold mx-1 my-1.5 sm:my-2 text-[11px] sm:text-xs lg:text-sm'>⏰ Phí thêm giờ: 40k/giờ</p>
            </div>
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header Controls */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-3 lg:p-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                        {/* Help Button */}
                        <button className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-red-500 text-white rounded-lg border border-rose-200 hover:bg-red-600 transition-colors">
                            <HelpCircle className="w-4 h-4" />
                            <span className="text-xs lg:text-sm font-medium">Hướng dẫn</span>
                        </button>

                        {/* Date Picker */}
                        <DatePicker date={selectedDate} onChange={handleDateChange} />
                    </div>

                    {/* Filters - scrollable on mobile */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 -mx-3 px-3 lg:mx-0 lg:px-0">
                        <FilterButton
                            label="Tiêu chuẩn"
                            active={filters.find((f) => f.value === 'standard')?.active ?? false}
                            onClick={() => toggleFilter('standard')}
                            variant="standard"
                        />
                        <FilterButton
                            label="VIP"
                            active={filters.find((f) => f.value === 'vip')?.active ?? false}
                            onClick={() => toggleFilter('vip')}
                            variant="vip"
                        />
                        <FilterButton
                            label="SuperVip"
                            active={filters.find((f) => f.value === 'supervip')?.active ?? false}
                            onClick={() => toggleFilter('supervip')}
                            variant="supervip"
                        />
                    </div>
                </div>

                {/* Schedule Grid */}
                <div className="overflow-x-auto relative">
                    <div style={{ minWidth: totalWidth }}>
                        {/* Timeline Header */}
                        <TimelineHeader
                            startHour={startHour}
                            endHour={endHour}
                            currentTime={currentTime}
                        />

                        {/* Room Rows */}
                        <div className="relative">
                            {filteredRooms.map((room) => (
                                <RoomRow
                                    key={room.id}
                                    room={room}
                                    bookings={getBookingsForRoom(room.id)}
                                    startHour={startHour}
                                    endHour={endHour}
                                    onBookingClick={onBookingClick}
                                    onEmptySlotClick={onEmptySlotClick}
                                />
                            ))}

                            {/* Current Time Indicator */}
                            <CurrentTimeIndicator
                                currentTime={currentTime}
                                startHour={startHour}
                            />
                        </div>
                    </div>
                </div>

                {/* Legend - wrap on mobile */}
                {/* <div className="flex flex-wrap items-center gap-3 lg:gap-6 p-3 lg:p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 lg:w-4 lg:h-4 rounded bg-rose-400" />
                        <span className="text-xs lg:text-sm text-gray-600">Đã đặt</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 lg:w-4 lg:h-4 rounded bg-white border border-gray-200" />
                        <span className="text-xs lg:text-sm text-gray-600">Trống</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-0.5 h-3 lg:h-4 bg-rose-500" />
                        <span className="text-xs lg:text-sm text-gray-600">Thời gian hiện tại</span>
                    </div>
                </div> */}
            </div>
        </div>
    );
};

// Export default
export default RoomSchedule;
