import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Booking, BookingFormData, BookingMode, Combo6h1hOption, Room, RoomType } from "@/types/schedule";
import { getRoomPriceConfig } from "@/types/schedule";
import { ShoppingCart } from "lucide-react";
import { calculateDuration, formatDateInput, formatPrice } from "@/utils/helpers";
import { BOOKING_MODES, HOURS, MINUTES } from "./constants";
import { RoomTypeBadge } from "@/components/rooms/RoomTypeBadge";
import { getAmenityIcon, hasSharedWC, isSharedWC, SHARED_WC_WARNING } from "@/data/amenities";

/** Cộng offsetHours vào checkInDate+checkInTime, trả về checkOutDate+checkOutTime */
function addHoursToCheckIn(checkInDate: Date, checkInTime: string, offsetHours: number): { date: Date; time: string } {
    const [h, m] = checkInTime.split(":").map(Number);
    const base = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate(), h, m, 0, 0);
    const out = new Date(base.getTime() + offsetHours * 3600 * 1000);
    const hh = String(out.getHours()).padStart(2, "0");
    const mm = String(out.getMinutes()).padStart(2, "0");
    return { date: new Date(out.getFullYear(), out.getMonth(), out.getDate()), time: `${hh}:${mm}` };
}

interface TimeSelectsProps {
    field: 'checkInTime' | 'checkOutTime';
    time: string;
    onTimeChange: (field: 'checkInTime' | 'checkOutTime', value: string) => void;
}

const TimeSelects: React.FC<TimeSelectsProps> = ({ field, time, onTimeChange }) => (
    <>
        <Select value={time.split(":")[0] + "h"} onValueChange={v => onTimeChange(field, `${v.replace("h", "")}:${time.split(":")[1] || "00"}`)}>
            <SelectTrigger className="w-20 shrink-0 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent position="popper" align="start">{HOURS.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={time.split(":")[1] || "00"} onValueChange={v => onTimeChange(field, `${time.split(":")[0]}:${v}`)}>
            <SelectTrigger className="w-18 shrink-0 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent position="popper" align="start">{MINUTES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
        </Select>
    </>
);

interface Step1Props {
    formData: BookingFormData;
    setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
    rooms: Room[];
    bookings?: Booking[];
    selectedDate?: Date;
    price: number;
    onOpenFoodModal?: () => void;
}

export const Step1: React.FC<Step1Props> = ({ formData, setFormData, rooms, price, onOpenFoodModal }) => {
    const [modeData, setModeData] = React.useState<Record<BookingMode, { checkInDate: Date; checkInTime: string; checkOutDate: Date; checkOutTime: string }>>(() => {
        const combo3hOut = addHoursToCheckIn(formData.checkInDate, formData.checkInTime, 3);
        const combo6h1hOut = addHoursToCheckIn(formData.checkInDate, formData.checkInTime, 7);
        return {
            hourly: { checkInDate: formData.checkInDate, checkInTime: formData.checkInTime, checkOutDate: formData.checkOutDate, checkOutTime: formData.checkOutTime },
            daily: { checkInDate: formData.checkInDate, checkInTime: '14:00', checkOutDate: new Date(formData.checkInDate.getTime() + 86400000), checkOutTime: '12:00' },
            overnight: { checkInDate: formData.checkInDate, checkInTime: '22:00', checkOutDate: new Date(formData.checkInDate.getTime() + 86400000), checkOutTime: '09:00' },
            combo3h: { checkInDate: formData.checkInDate, checkInTime: formData.checkInTime, checkOutDate: combo3hOut.date, checkOutTime: combo3hOut.time },
            combo6h1h: { checkInDate: formData.checkInDate, checkInTime: formData.checkInTime, checkOutDate: combo6h1hOut.date, checkOutTime: combo6h1hOut.time },
        };
    });

    const upd = (u: Partial<BookingFormData>) => setFormData(p => ({ ...p, ...u }));
    const getRooms = (t: RoomType) => rooms.filter(r => r.type === t);

    const handleRoomChange = (id: string) => {
        const r = rooms.find(r => r.id === id);
        if (r) upd({ roomId: r.id, roomName: r.name, roomType: r.type });
    };

    const handleModeChange = (mode: BookingMode) => {
        setModeData(p => ({ ...p, [formData.mode]: { checkInDate: formData.checkInDate, checkInTime: formData.checkInTime, checkOutDate: formData.checkOutDate, checkOutTime: formData.checkOutTime } }));
        const s = modeData[mode];
        const patch: Partial<BookingFormData> = { mode, checkInDate: s.checkInDate, checkInTime: s.checkInTime, checkOutDate: s.checkOutDate, checkOutTime: s.checkOutTime };
        if (mode === 'combo6h1h' && !formData.combo6h1hOption) {
            patch.combo6h1hOption = 'bonus_hour';
        }
        upd(patch);
    };

    /** Cập nhật combo6h1h option — nếu 'discount' thì rút còn 6h, 'bonus_hour' thì 7h */
    const handleCombo6h1hOptionChange = (option: Combo6h1hOption) => {
        const offset = option === 'discount' ? 6 : 7;
        const out = addHoursToCheckIn(formData.checkInDate, formData.checkInTime, offset);
        upd({ combo6h1hOption: option, checkOutDate: out.date, checkOutTime: out.time });
        setModeData(p => ({ ...p, combo6h1h: { ...p.combo6h1h, checkOutDate: out.date, checkOutTime: out.time } }));
    };

    const handleCheckInDateChange = (date: Date) => {
        const u: Partial<BookingFormData> = { checkInDate: date };
        if (formData.mode === 'daily' || formData.mode === 'overnight') {
            const nd = new Date(date); nd.setDate(nd.getDate() + 1); u.checkOutDate = nd;
        } else if (formData.mode === 'combo3h') {
            const out = addHoursToCheckIn(date, formData.checkInTime, 3);
            u.checkOutDate = out.date;
            u.checkOutTime = out.time;
        } else if (formData.mode === 'combo6h1h') {
            const offset = formData.combo6h1hOption === 'discount' ? 6 : 7;
            const out = addHoursToCheckIn(date, formData.checkInTime, offset);
            u.checkOutDate = out.date;
            u.checkOutTime = out.time;
        }
        upd(u);
        setModeData(p => ({ ...p, [formData.mode]: { ...p[formData.mode], checkInDate: date, checkOutDate: u.checkOutDate || formData.checkOutDate, checkOutTime: u.checkOutTime || formData.checkOutTime } }));
    };

    const handleTime = (f: 'checkInTime' | 'checkOutTime', v: string) => {
        upd({ [f]: v });
        setModeData(p => ({ ...p, [formData.mode]: { ...p[formData.mode], [f]: v } }));
    };

    const handleDate = (f: 'checkInDate' | 'checkOutDate', v: Date) => {
        upd({ [f]: v });
        setModeData(p => ({ ...p, [formData.mode]: { ...p[formData.mode], [f]: v } }));
    };

    const displayDuration = () => {
        const d = calculateDuration(formData.checkInDate, formData.checkInTime, formData.checkOutDate, formData.checkOutTime);
        if (formData.mode === 'daily') {
            const days = Math.max(1, Math.floor(d / 24) || 1);
            const extra = Math.max(0, Math.ceil(d - days * 24));
            return `${days} ngày${extra > 0 ? ` + ${extra}h` : ''}`;
        }
        if (formData.mode === 'overnight') {
            if (d <= 11) return '1 đêm';
            return `1 đêm + ${Math.ceil(d - 11)}h`;
        }
        if (formData.mode === 'combo3h') return '3 giờ';
        if (formData.mode === 'combo6h1h') {
            return formData.combo6h1hOption === 'discount' ? '6 giờ' : '6 giờ + 1H bonus';
        }
        return `${d} giờ`;
    };

    const selectedRoom = rooms.find(r => r.id === formData.roomId);
    const combo6h1hDiscount = getRoomPriceConfig(selectedRoom ?? { type: formData.roomType }).combo6h1hDiscount;

    return (
        <div className="space-y-4 sm:space-y-5">
            <div>
                <h3 className="font-bold text-base sm:text-lg">Bước 1: Chọn phòng và thời gian</h3>
                <p className="text-sm my-1">Vui lòng chọn phòng và thời gian đặt phòng</p>
            </div>

            <div className="bg-white border rounded-lg shadow-sm">
                {/* Mode */}
                <div className="p-3 sm:p-4 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <label className="text-xs sm:text-sm font-medium text-gray-700 shrink-0">Hình thức đặt phòng:</label>
                        <div className="flex gap-2 flex-wrap">
                            {BOOKING_MODES.map(mode => (
                                <button key={mode.value} type="button" onClick={() => handleModeChange(mode.value)}
                                    className={cn("px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all shadow-sm",
                                        formData.mode === mode.value ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border hover:bg-accent")}>
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {formData.mode === 'combo6h1h' && (
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                            <span className="text-xs sm:text-sm font-medium text-gray-700 shrink-0">Combo 6H+1H:</span>
                            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                <label className={cn(
                                    "flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs sm:text-sm cursor-pointer transition-colors",
                                    (formData.combo6h1hOption ?? 'bonus_hour') === 'bonus_hour'
                                        ? "border-primary bg-primary/10 text-primary font-semibold"
                                        : "border-border bg-card text-gray-600 hover:bg-accent",
                                )}>
                                    <input
                                        type="radio"
                                        name="combo6h1hOption"
                                        className="size-3.5 accent-primary"
                                        checked={(formData.combo6h1hOption ?? 'bonus_hour') === 'bonus_hour'}
                                        onChange={() => handleCombo6h1hOptionChange('bonus_hour')}
                                    />
                                    <span>Nhận thêm 1 giờ bonus</span>
                                </label>
                                <label className={cn(
                                    "flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs sm:text-sm cursor-pointer transition-colors",
                                    formData.combo6h1hOption === 'discount'
                                        ? "border-primary bg-primary/10 text-primary font-semibold"
                                        : "border-border bg-card text-gray-600 hover:bg-accent",
                                )}>
                                    <input
                                        type="radio"
                                        name="combo6h1hOption"
                                        className="size-3.5 accent-primary"
                                        checked={formData.combo6h1hOption === 'discount'}
                                        onChange={() => handleCombo6h1hOptionChange('discount')}
                                    />
                                    <span>Giảm giá {formatPrice(combo6h1hDiscount)}đ thay thế</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-3 sm:p-4">
                    {/* Desktop — flex với overflow-x-auto để không bao giờ bị che */}
                    <div className="hidden lg:block">
                        <div className="w-full">
                            {/* Header */}
                            <div className="flex items-center justify-between text-xs text-gray-500 font-medium mb-2">
                                <div className="w-[90px] shrink-0">Hạng phòng</div>
                                <div className="w-[90px] shrink-0">Phòng</div>
                                <div className="w-[300px] shrink-0">Thời gian nhận</div>
                                <div className="w-[300px] shrink-0">Thời gian trả</div>
                                <div className="w-[52px] shrink-0 text-center">Dự kiến</div>
                                <div className="w-[90px] shrink-0 text-right">Thành tiền</div>
                            </div>
                            {/* Data */}
                            <div className="flex items-center justify-between">
                                <div className="w-[90px] shrink-0"><RoomTypeBadge type={formData.roomType} size="sm" /></div>
                                <div className="w-[90px] shrink-0">
                                    <Select value={formData.roomId} onValueChange={handleRoomChange}>
                                        <SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger>
                                        <SelectContent position="popper" align="start">
                                            {getRooms(formData.roomType).map(r => (
                                                <SelectItem key={r.id} value={r.id}>
                                                    <span className="inline-flex items-center gap-2">
                                                        <span>{r.name}</span>
                                                        <RoomTypeBadge type={r.type} size="sm" />
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-[300px] shrink-0 flex gap-1.5 items-center">
                                    <Input type="date" value={formatDateInput(formData.checkInDate)} onChange={e => handleCheckInDateChange(new Date(e.target.value))} className="bg-white flex-1 min-w-0" />
                                    {formData.mode === 'hourly' ? <TimeSelects field="checkInTime" time={formData.checkInTime} onTimeChange={handleTime} /> : <span className="text-sm text-gray-600 font-medium shrink-0">{formData.checkInTime}</span>}
                                </div>
                                <div className="w-[300px] shrink-0 flex gap-1.5 items-center">
                                    <Input type="date" value={formatDateInput(formData.checkOutDate)} onChange={e => handleDate('checkOutDate', new Date(e.target.value))} className="bg-white flex-1 min-w-0" />
                                    {formData.mode === 'hourly' ? <TimeSelects field="checkOutTime" time={formData.checkOutTime} onTimeChange={handleTime} /> : <span className="text-sm text-gray-600 font-medium shrink-0">{formData.checkOutTime}</span>}
                                </div>
                                <div className="w-[52px] shrink-0 text-center text-xs text-gray-600 font-medium whitespace-nowrap">{displayDuration()}</div>
                                <div className="w-[90px] shrink-0 text-right text-sm font-semibold text-primary whitespace-nowrap">{formatPrice(price)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile */}
                    <div className="lg:hidden space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-700">Hạng phòng & Phòng</label>
                            <div className="flex gap-2">
                                <div className="flex-1 px-3 py-2 bg-gray-50 rounded-md flex items-center"><RoomTypeBadge type={formData.roomType} size="sm" /></div>
                                <div className="flex-1">
                                    <Select value={formData.roomId} onValueChange={handleRoomChange}>
                                        <SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger>
                                        <SelectContent position="popper" align="start">
                                            {getRooms(formData.roomType).map(r => (
                                                <SelectItem key={r.id} value={r.id}>
                                                    <span className="inline-flex items-center gap-2">
                                                        <span>{r.name}</span>
                                                        <RoomTypeBadge type={r.type} size="sm" />
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-700">Thời gian nhận</label>
                            <div className="flex gap-2 items-center">
                                <Input type="date" value={formatDateInput(formData.checkInDate)} onChange={e => handleCheckInDateChange(new Date(e.target.value))} className="bg-white flex-1" />
                                {formData.mode === 'hourly' && <TimeSelects field="checkInTime" time={formData.checkInTime} onTimeChange={handleTime} />}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-700">Thời gian trả</label>
                            <div className="flex gap-2 items-center">
                                <Input type="date" value={formatDateInput(formData.checkOutDate)} onChange={e => handleDate('checkOutDate', new Date(e.target.value))} className="bg-white flex-1" />
                                {formData.mode === 'hourly' && <TimeSelects field="checkOutTime" time={formData.checkOutTime} onTimeChange={handleTime} />}
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-sm font-medium text-gray-700">Dự kiến: {displayDuration()}</span>
                            <span className="text-base font-bold text-primary">{formatPrice(price)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Room Amenities */}
            {(() => {
                const selectedRoom = rooms.find(r => r.id === formData.roomId);
                const amenities = selectedRoom?.amenities;
                if (!amenities || amenities.length === 0) return null;
                return (
                    <div className="bg-white border rounded-lg shadow-sm px-3 sm:px-4 py-4 sm:py-5">
                        <h4 className="font-semibold text-gray-800 text-sm sm:text-base mb-3">Tiện nghi phòng {selectedRoom.name}</h4>
                        <div className="flex flex-wrap gap-2">
                            {amenities.map((amenity, i) => {
                                const warn = isSharedWC(amenity);
                                return (
                                    <span
                                        key={i}
                                        className={cn(
                                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs sm:text-sm",
                                            warn
                                                ? "bg-red-100 text-red-700 border border-red-200 font-semibold"
                                                : "bg-muted text-foreground",
                                        )}
                                    >
                                        <span aria-hidden="true">{getAmenityIcon(amenity)}</span>
                                        <span>{amenity}</span>
                                    </span>
                                );
                            })}
                        </div>
                        {hasSharedWC(amenities) && (
                            <p className="mt-2 text-xs font-medium text-red-600">
                                ⚠️ {SHARED_WC_WARNING}
                            </p>
                        )}
                    </div>
                );
            })()}

            {/* Food */}
            <div className="bg-white border rounded-lg shadow-sm px-3 sm:px-4 py-4 sm:py-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
                    <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 text-base sm:text-lg mb-2">Dịch vụ thêm</h4>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Phòng không có sẵn dịch vụ thêm.</p>
                        <p className="text-xs sm:text-sm text-gray-600">Tình iu vui lòng đặt trước để tụi mình chuẩn bị nghen 🍹 🍰</p>
                    </div>
                    <button type="button" onClick={() => onOpenFoodModal?.()}
                        className="flex font-semibold text-white cursor-pointer items-center justify-center gap-2 bg-status-warning px-3 sm:px-4 py-2 rounded-md shadow hover:bg-status-warning/90 transition-colors whitespace-nowrap text-sm w-full sm:w-auto">
                        <ShoppingCart className="w-4 h-4" /> Thêm dịch vụ
                    </button>
                </div>

            </div>
        </div>
    );
};
