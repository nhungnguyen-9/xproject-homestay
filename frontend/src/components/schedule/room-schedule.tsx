import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type {
    Room,
    Booking,
    RoomType,
    ScheduleProps,
    FilterOption,
} from '@/types/schedule';
import { HelpCircle } from 'lucide-react';
import { BookingModal } from '@/components/booking-calendar-form/booking-modal';

const HOUR_WIDTH = 80;
const ROOM_LABEL_WIDTH = 80;
const HEADER_HEIGHT = 50;
const INDICATOR_ROW_HEIGHT = 30;
const ROW_HEIGHT = 50;

const HIGHLIGHTED_HOURS = [6, 8, 10, 12, 14, 16];

const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const formatTime = (time: string): string => {
    return time;
};

/**
 * Tính toán vị trí pixel (left, width) của khối booking trên timeline
 */
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
            ? 'text-white'
            : 'bg-card text-foreground border-primary/30 hover:border-primary/20',
        vip: active
            ? 'text-white'
            : 'bg-card text-foreground border-primary/30 hover:border-primary/20',
        supervip: active
            ? 'text-white'
            : 'bg-card text-foreground border-primary/30 hover:border-primary/20',
    };

    const activeGradientStyle = active
        ? { background: 'linear-gradient(135deg, var(--primary), #FFB199)' }
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
                    value={date.toISOString().split('T')[0]}
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

    /** Trả về emoji thời tiết tương ứng với khung giờ trong ngày */
    const getWeatherIcon = (hour: number) => {
        if (hour === 6) return '🌅';
        if (hour === 8) return '☀️';
        if (hour === 10) return '☁';
        if (hour === 12) return '🌤️';
        if (hour === 14) return '⛅';
        if (hour === 16) return '🌥️';
        return '';
    };

    return (
        <div
            className="flex bg-muted/50 border-b border-border"
            style={{ height: HEADER_HEIGHT }}
        >
            <div
                className="flex items-center justify-center text-black font-bold text-md shrink-0 rounded-md m-1"
                style={{ width: ROOM_LABEL_WIDTH, background: 'linear-gradient(90deg, #F8E1EE 0%, #FFF1E1 100%)' }}
            >
                Phòng
            </div>

            <div className="flex-1 flex relative">
                {hours.map((hour, index) => {
                    const weatherIcon = getWeatherIcon(hour);
                    const isLastColumn = index === hours.length - 1;
                    return (
                        <div
                            key={hour}
                            className={`flex flex-col items-center justify-center border-l border-border text-sm text-black gap-0.5 ${isLastColumn ? 'border-r' : ''}`}
                            style={{ width: HOUR_WIDTH * 2 }}
                        >
                            <span className="font-bold text-sm">{String(hour).padStart(2, '0')}h</span>
                            <div className="h-5 flex items-center justify-center">
                                {weatherIcon && (
                                    <span className="text-lg leading-none">{weatherIcon}</span>
                                )}
                            </div>
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
    onBookingClick?: (booking: Booking) => void;
    onEmptySlotClick?: (roomId: string, time: string) => void;
}

const RoomRow: React.FC<RoomRowProps> = ({
    room,
    bookings,
    startHour,
    endHour,
    onBookingClick,
    onEmptySlotClick,
}) => {
    const totalWidth = (endHour - startHour) * HOUR_WIDTH;

    const roomTypeColors = {
        standard: 'rounded-md m-1 bg-room-standard text-primary-foreground font-medium text-sm shrink-0',
        vip: 'rounded-md m-1 bg-room-vip text-primary-foreground font-medium text-sm shrink-0',
        supervip: 'rounded-md m-1 bg-room-supervip text-primary-foreground font-medium text-sm shrink-0',
    };

    const isTimeBooked = (minutes: number): boolean => {
        return bookings.some(booking => {
            const bookingStart = timeToMinutes(booking.startTime);
            const bookingEnd = timeToMinutes(booking.endTime);
            return minutes >= bookingStart && minutes < bookingEnd;
        });
    };

    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;

        const minutes = (x / HOUR_WIDTH) * 60 + startHour * 60;
        // Làm tròn xuống bội số 30 phút
        const roundedMinutes = Math.floor(minutes / 30) * 30;

        if (!isTimeBooked(roundedMinutes)) {
            const hours = Math.floor(roundedMinutes / 60);
            const mins = roundedMinutes % 60;
            const timeString = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
            onEmptySlotClick?.(room.id, timeString);
        }
    };

    return (
        <div className="flex border-b border-border" style={{ height: ROW_HEIGHT }}>
            <div
                className={cn(
                    'flex items-center justify-center font-bold text-md shrink-0',
                    roomTypeColors[room.type]
                )}
                style={{
                    width: ROOM_LABEL_WIDTH,
                    background: 'linear-gradient(135deg, #FFB9A7 0%, #FFDFD3 100%)',
                    color: '#F06E6E',
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
                    fontWeight: 'bold'
                }}
            >
                {room.name}
            </div>

            <div
                className="flex-1 relative bg-card cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={handleTimelineClick}
            >
                <div className="absolute inset-0 pointer-events-none">
                    {Array.from({ length: (endHour - startHour) / 2 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute top-0 bottom-0 border-l border-border/50"
                            style={{ left: `${i * HOUR_WIDTH * 2}px` }}
                        />
                    ))}
                    <div
                        className="absolute top-0 bottom-0 border-r border-border/50"
                        style={{ right: 0 }}
                    />
                </div>

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
            className="absolute z-20 pointer-events-none"
            style={{ left: `${left}px`, top: 0, bottom: 0 }}
        >
            <div
                className="absolute bg-[#03c068] text-white text-xs px-2.5 py-1.5 rounded-xl flex items-center justify-center gap-0.5 font-bold -translate-x-1/2"
                style={{ top: '2px' }}
            >
                ⏰
                <span>{timeLabel}</span>
            </div>
            <div
                className="w-0.5 bg-[#03c068] absolute"
                style={{
                    top: `${INDICATOR_ROW_HEIGHT}px`,
                    bottom: 0,
                    left: 0
                }}
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
    endHour = 22,
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

    useEffect(() => {
        setLocalBookings(bookings);
    }, [bookings]);

    const [currentTime, setCurrentTime] = useState(() => {
        const demoTime = new Date();
        demoTime.setHours(2, 0, 0, 0);
        return demoTime;
    });

    useEffect(() => {
        const interval = setInterval(() => {
            const demoTime = new Date();
            demoTime.setHours(2, 0, 0, 0);
            setCurrentTime(demoTime);
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const filteredRooms = useMemo(() => {
        const activeTypes = filters
            .filter((f) => f.active)
            .map((f) => f.value as RoomType);
        return rooms.filter((room) => activeTypes.includes(room.type));
    }, [rooms, filters]);

    const getBookingsForRoom = (roomId: string): Booking[] => {
        return localBookings.filter((b) => b.roomId === roomId);
    };

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
            <div className='w-full bg-card rounded-xl shadow-sm border border-border overflow-hidden text-center mb-4 lg:mb-8'>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 lg:gap-6 p-2 sm:p-3 lg:p-4 border-t border-gray-200">
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 rounded bg-primary" />
                        <span className="text-[10px] sm:text-xs lg:text-sm text-gray-600">Đã đặt</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 rounded bg-white border border-border" />
                        <span className="text-[10px] sm:text-xs lg:text-sm text-gray-600">Trống</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-0.5 h-2.5 sm:h-3 lg:h-4 bg-[#03c068]" />
                        <span className="text-[10px] sm:text-xs lg:text-sm text-gray-600">Thời gian hiện tại</span>
                    </div>
                </div>
                <div className='text-center text-blue-500 w-full px-2 sm:px-4 text-[11px] sm:text-xs lg:text-sm'>
                    <span className='font-bold'>💡 Hướng dẫn:</span>
                    <span> Kéo trên timeline để xem phòng trống. Nhấn vào khung thời gian trống <span className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 rounded bg-white border border-border align-middle mx-0.5" /> để bắt đầu đặt phòng</span>
                </div>
                <p className='text-amber-500 font-semibold mx-1 my-1.5 sm:my-2 text-[11px] sm:text-xs lg:text-sm'>⏰ Phí thêm giờ: 40k/giờ</p>
            </div>
            <div className="w-full bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-3 lg:p-4 border-b border-border">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                        <button
                            className="flex items-center gap-2 px-3 lg:px-4 py-2 text-white rounded-lg transition-transform"
                            style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))' }}
                        >

                            <span className="text-xs lg:text-sm font-medium">🎯 Hướng dẫn</span>
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

                <div className="overflow-x-auto relative">
                    <div style={{ minWidth: totalWidth }}>
                        <TimelineHeader
                            startHour={startHour}
                            endHour={endHour}
                            currentTime={currentTime}
                        />

                        <div className="relative">
                            <div
                                className="flex bg-card border-b border-border/50 relative"
                                style={{ height: INDICATOR_ROW_HEIGHT }}
                            >
                                <div style={{ width: ROOM_LABEL_WIDTH }} className="shrink-0" />
                                <div className="flex-1 relative">
                                    <div className="absolute inset-0 pointer-events-none">
                                        {Array.from({ length: (endHour - startHour) / 2 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="absolute top-0 bottom-0 border-l border-border/50"
                                                style={{ left: `${i * HOUR_WIDTH * 2}px` }}
                                            />
                                        ))}
                                        <div
                                            className="absolute top-0 bottom-0 border-r border-border/50"
                                            style={{ right: 0 }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {filteredRooms.map((room) => (
                                <RoomRow
                                    key={room.id}
                                    room={room}
                                    bookings={getBookingsForRoom(room.id)}
                                    startHour={startHour}
                                    endHour={endHour}
                                    onBookingClick={onBookingClick}
                                    onEmptySlotClick={handleEmptySlotClick}
                                />
                            ))}

                            <CurrentTimeIndicator
                                currentTime={currentTime}
                                startHour={startHour}
                            />
                        </div>
                    </div>
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
