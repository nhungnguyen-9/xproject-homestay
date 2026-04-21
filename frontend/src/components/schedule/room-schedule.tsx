import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { formatDateInput } from '@/utils/helpers';
import type {
    Room,
    Booking,
    RoomType,
    ScheduleProps,
    FilterOption,
} from '@/types/schedule';
import { Plus } from 'lucide-react';
import { BookingModal } from '@/components/booking-calendar-form/booking-modal';
import {
    getAmenityIcon,
    COMMON_AMENITIES,
    isSharedWC,
    hasSharedWC,
    SHARED_WC_WARNING,
} from '@/data/amenities';
import { RoomTypeBadge } from '@/components/rooms/RoomTypeBadge';

const HOUR_WIDTH = 80;
const ROOM_LABEL_WIDTH = 80;
const HEADER_HEIGHT = 50;
const ROW_HEIGHT = 60;

const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const formatTime = (time: string): string => {
    return time;
};

/** So sánh hai Date có cùng ngày/tháng/năm không — dùng để chỉ hiển thị indicator khi đang xem hôm nay */
const isSameDay = (a: Date, b: Date): boolean => {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
};

/**
 * Tính toán vị trí pixel (left, width) của khối booking trên timeline.
 * Overnight (end ≤ start): cộng thêm 24h để width tính đúng cả khung qua đêm.
 */
export const getBookingPosition = (
    startTime: string,
    endTime: string,
    startHour: number
): { left: number; width: number } => {
    const startMin = timeToMinutes(startTime);
    let endMin = timeToMinutes(endTime);
    if (endMin <= startMin) endMin += 24 * 60;
    const duration = endMin - startMin;

    const left = ((startMin - startHour * 60) / 60) * HOUR_WIDTH;
    const width = (duration / 60) * HOUR_WIDTH;

    return { left, width };
};

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
            ? 'text-black hover:cursor-pointer'
            : 'bg-gray-100 text-foreground border-black/30 hover:border-black/20 ',
        vip: active
            ? 'text-black hover:cursor-pointer'
            : 'bg-gray-100 text-foreground border-black/30 hover:border-black/20',
        supervip: active
            ? 'text-black hover:cursor-pointer'
            : 'bg-gray-100 text-foreground border-black/30 hover:border-black/20',
    };

    const activeGradientStyle = active
        ? { background: 'white' }
        : undefined;

    return (
        <button
            onClick={onClick}
            className={cn(
                'px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg border text-xs lg:text-sm font-medium transition-all whitespace-nowrap',
                variantStyles[variant]
            )}
            style={activeGradientStyle}
        >
            {label}
        </button>
    );
};

interface DatePickerProps {
    date: Date;
    onChange: (date: Date) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ date, onChange }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const formatDate = (d: Date): string => {
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();
        return `${month}/${day}/${year}`;
    };

    return (
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-2 lg:px-3 py-1.5 lg:py-2">
            <span className="text-black text-xs lg:text-sm font-semibold whitespace-nowrap">Chọn ngày:</span>
            <div className="flex items-center gap-2">
                <input
                    type="date"
                    value={formatDateInput(date)}
                    onChange={(e) => onChange(new Date(e.target.value))}
                    className="border-none outline-none text-xs lg:text-sm bg-transparent"
                />
            </div>
        </div>
    );
};

interface TimelineHeaderProps {
    startHour: number;
    endHour: number;
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({
    startHour,
    endHour,
}) => {
    // Mỗi cột = 1 giờ, chạy từ startHour đến endHour-1 (ví dụ 0..23 với startHour=0, endHour=24)
    const hours: number[] = [];
    for (let i = startHour; i < endHour; i += 1) {
        hours.push(i);
    }

    return (
        <div
            className="flex bg-muted/50 border-b border-border sticky top-0 z-10"
            style={{ height: HEADER_HEIGHT }}
        >
            <div
                className="flex items-center justify-center text-black font-semibold text-md shrink-0 rounded-md m-1 sticky left-0 bg-muted/50 z-20"
                style={{ width: ROOM_LABEL_WIDTH }}
            >
                Phòng
            </div>

            <div className="flex-1 flex relative">
                {hours.map((hour, index) => {
                    const isLastColumn = index === hours.length - 1;
                    return (
                        <div
                            key={hour}
                            className={`flex flex-col items-center justify-center border-l border-border text-sm text-black gap-0.5 ${isLastColumn ? 'border-r' : ''}`}
                            style={{ width: HOUR_WIDTH }}
                        >
                            <span className="font-medium text-sm">{String(hour).padStart(2, '0')}h</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

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

    if (width <= 0) return null;

    return (
        <div
            className={cn(
                'absolute top-1 bottom-1 rounded-md cursor-pointer hover:cursor-not-allowed',
                'flex items-center overflow-hidden'
            )}
            style={{
                left: `${left}px`,
                width: `${Math.max(width, 30)}px`,
                background: 'linear-gradient(90deg, #FF7272 0%, #FFC0A9 100%)'
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

interface RoomRowProps {
    room: Room;
    bookings: Booking[];
    startHour: number;
    endHour: number;
    selectedDate: Date;
    currentTime: Date;
    onBookingClick?: (booking: Booking) => void;
    onEmptySlotClick?: (roomId: string, time: string) => void;
}

const RoomRow: React.FC<RoomRowProps> = ({
    room,
    bookings,
    startHour,
    endHour,
    selectedDate,
    currentTime,
    onBookingClick,
    onEmptySlotClick,
}) => {
    const isToday = isSameDay(selectedDate, currentTime);
    const isPastDate = selectedDate.getTime() < new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate()).getTime();
    const totalWidth = (endHour - startHour) * HOUR_WIDTH;

    const roomTypeColors = {
        standard: 'rounded-md m-1 text-black font-medium text-sm shrink-0',
        vip: 'rounded-md m-1 text-black font-medium text-sm shrink-0',
        supervip: 'rounded-md m-1 text-black font-medium text-sm shrink-0',
    };

    const hourCount = endHour - startHour;

    return (
        <div className="flex border-b border-border" style={{ height: ROW_HEIGHT }}>
            <div
                className={cn(
                    'flex flex-col items-center justify-center gap-1 text-[#374151] text-sm shrink-0 font-semibold sticky left-0 bg-card z-10',
                    roomTypeColors[room.type]
                )}
                style={{
                    width: ROOM_LABEL_WIDTH,
                }}
            >
                <span>{room.name}</span>
                <RoomTypeBadge type={room.type} size="sm" />
            </div>

            <div
                className="flex-1 relative bg-card transition-colors"
            >
                {/* Grid lines — 1 đường mỗi giờ */}
                <div className="absolute inset-0 pointer-events-none">
                    {Array.from({ length: hourCount }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute top-0 bottom-0 border-l border-border/50"
                            style={{ left: `${i * HOUR_WIDTH}px` }}
                        />
                    ))}
                    <div
                        className="absolute top-0 bottom-0 border-r border-border/50"
                        style={{ right: 0 }}
                    />
                </div>

                {/* Slot buttons 1h với + icon khi hover (min-height đủ để đạt 44px tap target) */}
                <div className="absolute inset-0 flex" style={{ width: totalWidth }}>
                    {Array.from({ length: hourCount }).map((_, i) => {
                        const slotHour = startHour + i
                        const slotStart = slotHour * 60
                        const slotEnd = (slotHour + 1) * 60
                        const occupied = bookings.some(b => {
                            const bs = timeToMinutes(b.startTime)
                            const be = timeToMinutes(b.endTime) + 10 // +10 phút buffer
                            return bs < slotEnd && be > slotStart
                        })
                        const isPast = isPastDate || (isToday && (
                            slotHour < currentTime.getHours() ||
                            (slotHour === currentTime.getHours() && currentTime.getMinutes() > 0)
                        ))
                        return (
                            <div
                                key={i}
                                className="relative"
                                style={{ width: HOUR_WIDTH, minHeight: 44 }}
                            >
                                {occupied ? (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-[5] cursor-not-allowed">
                                    </div>
                                ) : isPast ? (
                                    <div
                                        className="absolute inset-0 bg-gray-200/50 cursor-not-allowed z-[4]"
                                        aria-label={`Slot ${String(slotHour).padStart(2, '0')}:00 đã qua, không thể đặt`}
                                        aria-disabled="true"
                                    />
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const timeString = `${String(slotHour).padStart(2, '0')}:00`
                                            onEmptySlotClick?.(room.id, timeString)
                                        }}
                                        className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary z-[5] hover:cursor-pointer"
                                        aria-label={`Đặt phòng ${room.name} lúc ${String(slotHour).padStart(2, '0')}:00`}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Booking blocks */}
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
        </div >
    );
};

interface CurrentTimeIndicatorProps {
    currentTime: Date;
    startHour: number;
    endHour: number;
}

const CurrentTimeIndicator: React.FC<CurrentTimeIndicatorProps> = ({
    currentTime,
    startHour,
    endHour,
}) => {
    // Vị trí tính theo (giờ*60 + phút) / 60 * HOUR_WIDTH — cập nhật mỗi 60s
    const minutesFromStart =
        currentTime.getHours() * 60 + currentTime.getMinutes() - startHour * 60;
    const totalMinutes = (endHour - startHour) * 60;

    // Không hiển thị nếu thời điểm hiện tại nằm ngoài khung giờ timeline
    if (minutesFromStart < 0 || minutesFromStart > totalMinutes) return null;

    const left = (minutesFromStart / 60) * HOUR_WIDTH;

    return (
        <div
            className="absolute z-20 pointer-events-none"
            style={{ left: `${left}px`, top: 0, bottom: 0 }}
        >
            {/* Đường dọc đỏ với pulse glow nhẹ */}
            <div
                className="w-0.5 h-full bg-red-500 schedule-indicator-pulse"
                style={{
                    boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)',
                }}
            />
            {/* Chấm tròn đầu chỉ báo */}
            <div
                className="absolute -top-1 -left-[3px] w-2 h-2 rounded-full bg-red-500 schedule-indicator-pulse"
                style={{ boxShadow: '0 0 6px rgba(239, 68, 68, 0.8)' }}
            />
        </div>
    );
};

/**
 * Lịch trình phòng — hiển thị timeline theo giờ, khối booking, bộ lọc loại phòng, và hỗ trợ tạo booking mới
 */
export const RoomSchedule: React.FC<ScheduleProps> = ({
    date,
    rooms,
    bookings,
    onDateChange,
    onBookingClick,
    onEmptySlotClick,
    onBookingCreate,
    startHour = 0,
    endHour = 24,
}) => {
    const [selectedDate, setSelectedDate] = useState(date);
    const [filters, setFilters] = useState<FilterOption[]>([
        { value: 'standard', label: 'Tiêu chuẩn', active: true },
        { value: 'vip', label: 'VIP', active: true },
        { value: 'supervip', label: 'SuperVip', active: true },
    ]);

    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [selectedTime, setSelectedTime] = useState<string>('06:00');
    const [localBookings, setLocalBookings] = useState<Booking[]>(bookings);

    // Ref container có scroll ngang — dùng cho auto-scroll tới current time indicator
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLocalBookings(bookings);
    }, [bookings]);

    // Thời gian thực — cập nhật mỗi 60 giây
    const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

    useEffect(() => {
        const id = setInterval(() => setCurrentTime(new Date()), 60_000);
        return () => clearInterval(id);
    }, []);

    // Chỉ hiển thị indicator khi đang xem ngày hôm nay
    const showIndicator = isSameDay(selectedDate, currentTime);

    // Auto-scroll: đưa indicator về ~1/3 viewport từ trái, mỗi khi currentTime đổi hoặc đổi ngày
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        if (!showIndicator) return;

        const minutesFromStart =
            currentTime.getHours() * 60 + currentTime.getMinutes() - startHour * 60;
        if (minutesFromStart < 0) return;

        const indicatorLeft =
            ROOM_LABEL_WIDTH + (minutesFromStart / 60) * HOUR_WIDTH;
        const viewportWidth = el.clientWidth;
        const targetScroll = indicatorLeft - viewportWidth / 3;

        el.scrollTo({
            left: Math.max(0, targetScroll),
            behavior: 'smooth',
        });
    }, [currentTime, showIndicator, startHour]);

    const filteredRooms = useMemo(() => {
        const activeTypes = filters
            .filter((f) => f.active)
            .map((f) => f.value as RoomType);
        return rooms.filter((room) => activeTypes.includes(room.type));
    }, [rooms, filters]);

    const getBookingsForRoom = (roomId: string): Booking[] => {
        return localBookings.filter((b) => b.roomId === roomId);
    };

    // Đồng bộ selectedDate nếu prop `date` từ ngoài thay đổi
    useEffect(() => {
        setSelectedDate(date);
    }, [date]);

    const handleDateChange = (newDate: Date) => {
        setSelectedDate(newDate);
        onDateChange?.(newDate);
    };

    const toggleFilter = (value: RoomType | 'all') => {
        setFilters((prev) =>
            prev.map((f) => (f.value === value ? { ...f, active: !f.active } : f))
        );
    };

    const handleEmptySlotClick = useCallback((roomId: string, time: string) => {
        const room = rooms.find(r => r.id === roomId);
        setSelectedRoom(room || null);
        setSelectedTime(time);
        setBookingModalOpen(true);
        onEmptySlotClick?.(roomId, time);
    }, [rooms, onEmptySlotClick]);

    const handleBookingCreate = useCallback((newBooking: Omit<Booking, 'id'>) => {
        const booking: Booking = {
            ...newBooking,
            id: `booking-${Date.now()}`,
        };
        setLocalBookings(prev => [...prev, booking]);
        onBookingCreate?.(newBooking);
    }, [onBookingCreate]);

    const totalWidth = (endHour - startHour) * HOUR_WIDTH + ROOM_LABEL_WIDTH;

    return (
        <div className="max-w-7xl mx-auto">

            {/* 1. Top bar: Instructions + date | filters */}
            <div className="w-full bg-card rounded-xl shadow-sm border border-border overflow-hidden mb-3">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-3 lg:p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                        <button
                            className="flex items-center gap-2 px-3 lg:px-4 py-2 text-white rounded-lg transition-transform"
                            style={{ background: '#f87171f2' }}
                        >
                            <span className="text-xs lg:text-sm font-medium">Hướng dẫn</span>
                        </button>

                        <DatePicker date={selectedDate} onChange={handleDateChange} />
                    </div>

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
            </div>

            {/* 2. Amenities bar — dynamic from common amenities */}
            <div className="w-full bg-card rounded-xl shadow-sm border border-border px-4 py-6 mb-3">
                <p className="text-sm font-bold text-foreground mb-2">Tổng Quan Tiện Nghi Phòng</p>
                <p className="text-sm text-muted-foreground">
                    Tiện nghi: {COMMON_AMENITIES.map((a, i) => (
                        <span key={a.id}>{i > 0 && ' • '}{a.icon} {a.label}</span>
                    ))}
                </p>
            </div>

            {/* Keyframes cho pulse animation của current-time indicator */}
            <style>{`
                @keyframes scheduleIndicatorPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.55; }
                }
                .schedule-indicator-pulse {
                    animation: scheduleIndicatorPulse 2s ease-in-out infinite;
                }
            `}</style>

            {/* 3. Timeline */}
            <div className="w-full bg-card rounded-xl shadow-sm border border-border overflow-hidden p-3">
                <div
                    ref={scrollRef}
                    className="overflow-x-auto relative"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    <div style={{ minWidth: totalWidth }}>
                        <TimelineHeader
                            startHour={startHour}
                            endHour={endHour}
                        />

                        <div className="relative">
                            {filteredRooms.map((room) => (
                                <RoomRow
                                    key={room.id}
                                    room={room}
                                    bookings={getBookingsForRoom(room.id)}
                                    startHour={startHour}
                                    endHour={endHour}
                                    selectedDate={selectedDate}
                                    currentTime={currentTime}
                                    onBookingClick={onBookingClick}
                                    onEmptySlotClick={handleEmptySlotClick}
                                />
                            ))}

                            {/* Indicator đặt trong phần grid (sau cột label), offset bằng ROOM_LABEL_WIDTH */}
                            {showIndicator && (
                                <div
                                    className="absolute top-0 bottom-0 pointer-events-none"
                                    style={{ left: ROOM_LABEL_WIDTH, right: 0 }}
                                >
                                    <CurrentTimeIndicator
                                        currentTime={currentTime}
                                        startHour={startHour}
                                        endHour={endHour}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. Footer notes — dynamic per-room amenities */}
                <div className="border-t border-border px-4 py-3 bg-muted/20 mt-5">
                    <p className="text-xs font-bold text-foreground mb-0.5">Ghi chú tiện nghi</p>
                    <p className="text-xs text-muted-foreground">
                        {rooms
                            .filter((r) => r.amenities && r.amenities.length > 0)
                            .map((r, i) => (
                                <span key={r.id}>
                                    {i > 0 && ' • '}
                                    {getAmenityIcon(r.amenities![0])} {r.name}:{' '}
                                    {r.amenities!.map((a, idx) => (
                                        <span
                                            key={a}
                                            className={cn(
                                                isSharedWC(a) && 'text-red-600 font-semibold',
                                            )}
                                        >
                                            {idx > 0 && ', '}
                                            {a}
                                        </span>
                                    ))}
                                </span>
                            ))}
                        {rooms.every((r) => !r.amenities || r.amenities.length === 0) && (
                            <span className="italic">Chưa có thông tin tiện nghi riêng</span>
                        )}
                    </p>
                    {rooms.some((r) => hasSharedWC(r.amenities)) && (
                        <p className="mt-1 text-xs font-medium text-red-600">
                            ⚠️ {SHARED_WC_WARNING} (áp dụng cho phòng có tag "WC chung")
                        </p>
                    )}
                </div>
            </div>

            <BookingModal
                open={bookingModalOpen}
                onOpenChange={setBookingModalOpen}
                room={selectedRoom}
                rooms={rooms}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                bookings={localBookings}
                onBookingCreate={handleBookingCreate}
            />
        </div>
    );
};

export default RoomSchedule;
