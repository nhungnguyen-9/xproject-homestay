import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { BookingFormData, BookingMode, Room, RoomType } from "@/types/schedule";
import { COMBO_ITEMS } from "@/types/schedule";
import { Check, ShoppingCart } from "lucide-react";
import { calculateDuration, formatDateInput, formatPrice } from "@/utils/helpers";
import { BOOKING_MODES, HOURS, MINUTES } from "./constants";
import { RoomTypeBadge } from "@/components/rooms/RoomTypeBadge";
import { getAmenityIcon, hasSharedWC, isSharedWC, SHARED_WC_WARNING } from "@/data/amenities";

interface Step1Props {
    formData: BookingFormData;
    setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
    rooms: Room[];
    bookings?: any[];
    selectedDate?: Date;
    price: number;
    onOpenFoodModal?: () => void;
}

export const Step1: React.FC<Step1Props> = ({ formData, setFormData, rooms, price, onOpenFoodModal }) => {
    const [modeData, setModeData] = React.useState<Record<BookingMode, { checkInDate: Date; checkInTime: string; checkOutDate: Date; checkOutTime: string }>>(() => ({
        hourly: { checkInDate: formData.checkInDate, checkInTime: formData.checkInTime, checkOutDate: formData.checkOutDate, checkOutTime: formData.checkOutTime },
        daily: { checkInDate: formData.checkInDate, checkInTime: '14:00', checkOutDate: new Date(formData.checkInDate.getTime() + 86400000), checkOutTime: '12:00' },
        overnight: { checkInDate: formData.checkInDate, checkInTime: '22:00', checkOutDate: new Date(formData.checkInDate.getTime() + 86400000), checkOutTime: '09:00' },
        combo6h: { checkInDate: formData.checkInDate, checkInTime: '22:00', checkOutDate: new Date(formData.checkInDate.getTime() + 86400000), checkOutTime: '09:00' },
    }));

    const upd = (u: Partial<BookingFormData>) => setFormData(p => ({ ...p, ...u }));
    const getRooms = (t: RoomType) => rooms.filter(r => r.type === t);

    const handleRoomChange = (id: string) => {
        const r = rooms.find(r => r.id === id);
        if (r) upd({ roomId: r.id, roomName: r.name, roomType: r.type });
    };

    const handleModeChange = (mode: BookingMode) => {
        setModeData(p => ({ ...p, [formData.mode]: { checkInDate: formData.checkInDate, checkInTime: formData.checkInTime, checkOutDate: formData.checkOutDate, checkOutTime: formData.checkOutTime } }));
        const s = modeData[mode];
        upd({ mode, checkInDate: s.checkInDate, checkInTime: s.checkInTime, checkOutDate: s.checkOutDate, checkOutTime: s.checkOutTime });
    };

    const handleCheckInDateChange = (date: Date) => {
        const u: Partial<BookingFormData> = { checkInDate: date };
        if (formData.mode === 'daily' || formData.mode === 'overnight') {
            const nd = new Date(date); nd.setDate(nd.getDate() + 1); u.checkOutDate = nd;
        }
        upd(u);
        setModeData(p => ({ ...p, [formData.mode]: { ...p[formData.mode], checkInDate: date, checkOutDate: u.checkOutDate || formData.checkOutDate } }));
    };

    const handleTime = (f: 'checkInTime' | 'checkOutTime', v: string) => {
        upd({ [f]: v });
        setModeData(p => ({ ...p, [formData.mode]: { ...p[formData.mode], [f]: v } }));
    };

    const handleDate = (f: 'checkInDate' | 'checkOutDate', v: Date) => {
        upd({ [f]: v });
        setModeData(p => ({ ...p, [formData.mode]: { ...p[formData.mode], [f]: v } }));
    };

    const selFood = formData.foodItems.filter(f => (f.qty || 0) > 0);
    const foodTotal = selFood.reduce((s, i) => s + i.price * (i.qty || 0), 0)
        + COMBO_ITEMS.filter(c => formData.selectedComboIds?.includes(c.id)).reduce((s, c) => s + c.price, 0);

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
        return `${d} giờ`;
    };

    const TimeSelects = ({ field, time }: { field: 'checkInTime' | 'checkOutTime'; time: string }) => (
        <>
            <Select value={time.split(":")[0] + "h"} onValueChange={v => handleTime(field, `${v.replace("h", "")}:${time.split(":")[1] || "00"}`)}>
                <SelectTrigger className="w-20 shrink-0 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent position="popper" align="start">{HOURS.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={time.split(":")[1] || "00"} onValueChange={v => handleTime(field, `${time.split(":")[0]}:${v}`)}>
                <SelectTrigger className="w-18 shrink-0 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent position="popper" align="start">{MINUTES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
        </>
    );

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
                                    {formData.mode === 'hourly' ? <TimeSelects field="checkInTime" time={formData.checkInTime} /> : <span className="text-sm text-gray-600 font-medium shrink-0">{formData.checkInTime}</span>}
                                </div>
                                <div className="w-[300px] shrink-0 flex gap-1.5 items-center">
                                    <Input type="date" value={formatDateInput(formData.checkOutDate)} onChange={e => handleDate('checkOutDate', new Date(e.target.value))} className="bg-white flex-1 min-w-0" />
                                    {formData.mode === 'hourly' ? <TimeSelects field="checkOutTime" time={formData.checkOutTime} /> : <span className="text-sm text-gray-600 font-medium shrink-0">{formData.checkOutTime}</span>}
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
                                {formData.mode === 'hourly' && <TimeSelects field="checkInTime" time={formData.checkInTime} />}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-700">Thời gian trả</label>
                            <div className="flex gap-2 items-center">
                                <Input type="date" value={formatDateInput(formData.checkOutDate)} onChange={e => handleDate('checkOutDate', new Date(e.target.value))} className="bg-white flex-1" />
                                {formData.mode === 'hourly' && <TimeSelects field="checkOutTime" time={formData.checkOutTime} />}
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
                        <h4 className="font-semibold text-gray-800 text-base sm:text-lg mb-2">Đồ ăn & Uống</h4>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Phòng không có sẵn đồ ăn & nước uống.</p>
                        <p className="text-xs sm:text-sm text-gray-600">Tình iu vui lòng đặt trước để tụi mình chuẩn bị nghen 🍹 🍰</p>
                    </div>
                    <button type="button" onClick={() => onOpenFoodModal?.()}
                        className="flex font-semibold text-white cursor-pointer items-center justify-center gap-2 bg-status-warning px-3 sm:px-4 py-2 rounded-md shadow hover:bg-status-warning/90 transition-colors whitespace-nowrap text-sm w-full sm:w-auto">
                        <ShoppingCart className="w-4 h-4" /> Thêm món
                    </button>
                </div>

                {/* <div className="space-y-3">
                    <p className="text-xs sm:text-sm font-semibold text-gray-700">Combo đặc biệt:</p>
                    <div className="space-y-2">
                        {COMBO_ITEMS.map(combo => {
                            const sel = formData.selectedComboIds?.includes(combo.id) || false;
                            return (
                                <button key={combo.id} type="button"
                                    onClick={() => upd({ selectedComboIds: sel ? (formData.selectedComboIds || []).filter(id => id !== combo.id) : [...(formData.selectedComboIds || []), combo.id] })}
                                    className={cn("w-full text-left flex items-center justify-between py-2.5 px-3 sm:px-4 rounded-lg border-2 cursor-pointer transition-all",
                                        sel ? "border-primary bg-primary/5" : "border-border/50 hover:border-border bg-card")}>
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className={cn("w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0", sel ? "border-primary bg-primary" : "border-border")}>
                                            {sel && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                                        </div>
                                        <span className={cn("text-xs sm:text-sm font-medium truncate", sel ? "text-primary" : "text-gray-700")}>{combo.name}</span>
                                    </div>
                                    <span className={cn("text-xs sm:text-sm font-semibold ml-2 flex-shrink-0", sel ? "text-primary" : "text-gray-500")}>{formatPrice(combo.price)} VNĐ</span>
                                </button>
                            );
                        })}
                    </div>

                    {selFood.length > 0 && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                            {selFood.map(item => (
                                <div key={item.id} className="flex items-center justify-between gap-2">
                                    <span className="text-xs sm:text-sm text-gray-700 flex-1 min-w-0 truncate">{item.name} <span className="text-gray-500">x{item.qty}</span></span>
                                    <span className="text-xs sm:text-sm font-semibold text-gray-700 flex-shrink-0">{formatPrice((item.qty || 0) * item.price)} VND</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {((formData.selectedComboIds?.length || 0) > 0 || selFood.length > 0) && (
                        <div className="flex justify-end pt-2 mt-2 border-t">
                            <span className="text-xs sm:text-sm">Tổng: <span className="font-bold text-primary">{formatPrice(foodTotal)} VND</span></span>
                        </div>
                    )}
                </div> */}
            </div>
        </div>
    );
};
