import React from "react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
    BookingFormData,
    BookingMode,
    Room,
    RoomType,
} from "@/types/schedule";
import {
    COMBO_ITEMS,
} from "@/types/schedule";
import {
    Check,
    ShoppingCart,
} from "lucide-react";
import {
    calculateDuration,
    formatDateInput,
    formatPrice,
} from "@/utils/helpers";
import {
    BOOKING_MODES,
    ROOM_TYPE_LABELS,
    HOURS,
    MINUTES,
} from "./constants";

interface Step1Props {
    formData: BookingFormData;
    setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
    rooms: Room[];
    bookings?: any[];
    selectedDate?: Date;
    price: number;
    onOpenFoodModal?: () => void;
}

/**
 * Bước 1 — Chọn phòng, hình thức đặt (giờ/ngày/qua đêm), thời gian nhận trả, và dịch vụ ăn uống
 */
export const Step1: React.FC<Step1Props> = ({
    formData,
    setFormData,
    rooms,
    price,
    onOpenFoodModal,
}) => {
    // Lưu riêng thời gian nhận/trả cho mỗi chế độ để chuyển mode không bị mất dữ liệu
    const [modeData, setModeData] = React.useState<Record<BookingMode, { checkInDate: Date; checkInTime: string; checkOutDate: Date; checkOutTime: string }>>(() => ({
        hourly: {
            checkInDate: formData.checkInDate,
            checkInTime: formData.checkInTime,
            checkOutDate: formData.checkOutDate,
            checkOutTime: formData.checkOutTime,
        },
        daily: {
            checkInDate: formData.checkInDate,
            checkInTime: '14:00',
            checkOutDate: new Date(formData.checkInDate.getTime() + 24 * 60 * 60 * 1000),
            checkOutTime: '12:00',
        },
        overnight: {
            checkInDate: formData.checkInDate,
            checkInTime: '22:00',
            checkOutDate: new Date(formData.checkInDate.getTime() + 24 * 60 * 60 * 1000),
            checkOutTime: '09:00',
        },
    }));

    const updateFormData = (updates: Partial<BookingFormData>) => {
        setFormData((prev) => ({ ...prev, ...updates }));
    };

    const getRoomsForType = (type: RoomType) =>
        rooms.filter((r) => r.type === type);

    const handleRoomChange = (roomId: string) => {
        const room = rooms.find((r) => r.id === roomId);
        if (room) {
            updateFormData({
                roomId: room.id,
                roomName: room.name,
                roomType: room.type,
            });
        }
    };

    const handleModeChange = (mode: BookingMode) => {
        setModeData(prev => ({
            ...prev,
            [formData.mode]: {
                checkInDate: formData.checkInDate,
                checkInTime: formData.checkInTime,
                checkOutDate: formData.checkOutDate,
                checkOutTime: formData.checkOutTime,
            },
        }));

        const savedData = modeData[mode];

        updateFormData({
            mode,
            checkInDate: savedData.checkInDate,
            checkInTime: savedData.checkInTime,
            checkOutDate: savedData.checkOutDate,
            checkOutTime: savedData.checkOutTime,
        });
    };

    const handleCheckInDateChange = (date: Date) => {
        const updates: Partial<BookingFormData> = { checkInDate: date };

        if (formData.mode === 'daily' || formData.mode === 'overnight') {
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            updates.checkOutDate = nextDay;
        }

        updateFormData(updates);

        setModeData(prev => ({
            ...prev,
            [formData.mode]: {
                ...prev[formData.mode],
                checkInDate: date,
                checkOutDate: updates.checkOutDate || formData.checkOutDate,
            },
        }));
    };

    const handleTimeChange = (field: 'checkInTime' | 'checkOutTime', value: string) => {
        updateFormData({ [field]: value });
        setModeData(prev => ({
            ...prev,
            [formData.mode]: {
                ...prev[formData.mode],
                [field]: value,
            },
        }));
    };

    const handleDateChange = (field: 'checkInDate' | 'checkOutDate', value: Date) => {
        updateFormData({ [field]: value });
        setModeData(prev => ({
            ...prev,
            [formData.mode]: {
                ...prev[formData.mode],
                [field]: value,
            },
        }));
    };

    const selectedFoodItems = formData.foodItems.filter((f) => (f.qty || 0) > 0);
    const foodItemsTotal = selectedFoodItems.reduce(
        (sum, item) => sum + item.price * (item.qty || 0),
        0,
    );
    const selectedCombos = COMBO_ITEMS.filter((c) => formData.selectedComboIds?.includes(c.id));
    const comboTotal = selectedCombos.reduce((sum, combo) => sum + combo.price, 0);
    const foodTotal = foodItemsTotal + comboTotal;

    // Hiển thị thời lượng theo đơn vị phù hợp: ngày/đêm/giờ tuỳ chế độ đặt
    const displayDuration = () => {
        const duration = calculateDuration(
            formData.checkInDate,
            formData.checkInTime,
            formData.checkOutDate,
            formData.checkOutTime,
        );

        if (formData.mode === 'daily') {
            const days = Math.max(1, Math.floor(duration / 24) || 1);
            const extra = Math.max(0, Math.ceil(duration - days * 24));
            return `${days} ngày${extra > 0 ? ` + ${extra}h` : ''}`;
        } else if (formData.mode === 'overnight') {
            const OVERNIGHT_BASE_HOURS = 11;
            if (duration <= OVERNIGHT_BASE_HOURS) return '1 đêm';
            const extra = Math.ceil(duration - OVERNIGHT_BASE_HOURS);
            return `1 đêm + ${extra}h`;
        } else {
            return `${duration} giờ`;
        }
    };

    return (
        <div className="space-y-4 sm:space-y-5">
            <div>
                <h3 className="font-bold text-base sm:text-lg">Bước 1: Chọn phòng và thời gian</h3>
                <p className="text-sm sm:text-md my-1">
                    Vui lòng chọn phòng và thời gian đặt phòng
                </p>
            </div>

            <div className="bg-white border rounded-lg shadow-sm">
                <div className="p-3 sm:p-4 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">
                            Hình thức đặt phòng:
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {BOOKING_MODES.map((mode) => (
                                <button
                                    key={mode.value}
                                    type="button"
                                    onClick={() => handleModeChange(mode.value)}
                                    className={cn(
                                        "px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all shadow-sm",
                                        formData.mode === mode.value
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-card text-muted-foreground border border-border hover:bg-accent",
                                    )}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-3 sm:p-4">
                    <div className="hidden lg:grid grid-cols-15 gap-3 items-center text-xs xl:text-sm text-gray-700 mb-3">
                        <div className="col-span-2 font-medium">Hạng phòng</div>
                        <div className="col-span-2 font-medium">Phòng</div>
                        <div className="col-span-4 font-medium">Thời gian nhận</div>
                        <div className="col-span-4 font-medium">Thời gian trả</div>
                        <div className="col-span-1 font-medium text-center">Dự kiến</div>
                        <div className="col-span-2 font-medium text-right">Thành tiền</div>
                    </div>

                    <div className="lg:hidden space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-700">Hạng phòng & Phòng</label>
                            <div className="flex gap-2">
                                <div className="flex-1 px-3 py-2 bg-gray-50 rounded-md text-sm">
                                    {ROOM_TYPE_LABELS[formData.roomType]}
                                </div>
                                <div className="flex-1">
                                    <Select value={formData.roomId} onValueChange={handleRoomChange}>
                                        <SelectTrigger className="w-full bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent position="popper" align="start">
                                            {getRoomsForType(formData.roomType).map((r) => (
                                                <SelectItem key={r.id} value={r.id}>
                                                    {r.name}
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
                                <Input
                                    type="date"
                                    value={formatDateInput(formData.checkInDate)}
                                    onChange={(e) => handleCheckInDateChange(new Date(e.target.value))}
                                    className="bg-white flex-1"
                                />
                                {formData.mode === 'hourly' ? (
                                    <>
                                        <Select
                                            value={formData.checkInTime.split(":")[0] + "h"}
                                            onValueChange={(value) => {
                                                const hour = value.replace("h", "");
                                                const minutes = formData.checkInTime.split(":")[1] || "00";
                                                handleTimeChange('checkInTime', `${hour}:${minutes}`);
                                            }}
                                        >
                                            <SelectTrigger className="w-16 bg-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent position="popper" align="start">
                                                {HOURS.map((h) => (
                                                    <SelectItem key={h.value} value={h.value}>
                                                        {h.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select
                                            value={formData.checkInTime.split(":")[1] || "00"}
                                            onValueChange={(value) => {
                                                const hour = formData.checkInTime.split(":")[0];
                                                handleTimeChange('checkInTime', `${hour}:${value}`);
                                            }}
                                        >
                                            <SelectTrigger className="w-14 bg-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent position="popper" align="start">
                                                {MINUTES.map((m) => (
                                                    <SelectItem key={m.value} value={m.value}>
                                                        {m.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </>
                                ) : (
                                    <div className="text-sm text-gray-600 font-medium px-2">
                                        {formData.checkInTime}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-700">Thời gian trả</label>
                            <div className="flex gap-2 items-center">
                                <Input
                                    type="date"
                                    value={formatDateInput(formData.checkOutDate)}
                                    onChange={(e) => handleDateChange('checkOutDate', new Date(e.target.value))}
                                    className="bg-white flex-1"
                                />
                                {formData.mode === 'hourly' ? (
                                    <>
                                        <Select
                                            value={formData.checkOutTime.split(":")[0] + "h"}
                                            onValueChange={(value) => {
                                                const hour = value.replace("h", "");
                                                const minutes = formData.checkOutTime.split(":")[1] || "00";
                                                handleTimeChange('checkOutTime', `${hour}:${minutes}`);
                                            }}
                                        >
                                            <SelectTrigger className="w-16 bg-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent position="popper" align="start">
                                                {HOURS.map((h) => (
                                                    <SelectItem key={h.value} value={h.value}>
                                                        {h.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select
                                            value={formData.checkOutTime.split(":")[1] || "00"}
                                            onValueChange={(value) => {
                                                const hour = formData.checkOutTime.split(":")[0];
                                                handleTimeChange('checkOutTime', `${hour}:${value}`);
                                            }}
                                        >
                                            <SelectTrigger className="w-14 bg-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent position="popper" align="start">
                                                {MINUTES.map((m) => (
                                                    <SelectItem key={m.value} value={m.value}>
                                                        {m.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </>
                                ) : (
                                    <div className="text-sm text-gray-600 font-medium px-2">
                                        {formData.checkOutTime}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-sm font-medium text-gray-700">Dự kiến: {displayDuration()}</span>
                            <span className="text-base font-bold text-primary">{formatPrice(price)}</span>
                        </div>
                    </div>

                    <div className="hidden lg:grid grid-cols-15 gap-3 items-center">
                        <div className="col-span-2">
                            {ROOM_TYPE_LABELS[formData.roomType]}
                        </div>
                        <div className="col-span-2">
                            <Select value={formData.roomId} onValueChange={handleRoomChange}>
                                <SelectTrigger className="w-full shrink-0 bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper" align="start">
                                    {getRoomsForType(formData.roomType).map((r) => (
                                        <SelectItem key={r.id} value={r.id}>
                                            {r.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="col-span-4 flex gap-2 items-center min-w-0">
                            <Input
                                type="date"
                                value={formatDateInput(formData.checkInDate)}
                                onChange={(e) => handleCheckInDateChange(new Date(e.target.value))}
                                className="bg-white w-44 min-w-0"
                            />
                            {formData.mode === 'hourly' ? (
                                <>
                                    <Select
                                        value={formData.checkInTime.split(":")[0] + "h"}
                                        onValueChange={(value) => {
                                            const hour = value.replace("h", "");
                                            const minutes = formData.checkInTime.split(":")[1] || "00";
                                            handleTimeChange('checkInTime', `${hour}:${minutes}`);
                                        }}
                                    >
                                        <SelectTrigger className="w-18 shrink-0 bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent position="popper" align="start">
                                            {HOURS.map((h) => (
                                                <SelectItem key={h.value} value={h.value}>
                                                    {h.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={formData.checkInTime.split(":")[1] || "00"}
                                        onValueChange={(value) => {
                                            const hour = formData.checkInTime.split(":")[0];
                                            handleTimeChange('checkInTime', `${hour}:${value}`);
                                        }}
                                    >
                                        <SelectTrigger className="w-16 shrink-0 bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent position="popper" align="start">
                                            {MINUTES.map((m) => (
                                                <SelectItem key={m.value} value={m.value}>
                                                    {m.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </>
                            ) : (
                                <div className="text-sm text-gray-600 font-medium px-2">
                                    {formData.checkInTime}
                                </div>
                            )}
                        </div>

                        <div className="col-span-4 flex gap-2 items-center min-w-0">
                            <Input
                                type="date"
                                value={formatDateInput(formData.checkOutDate)}
                                onChange={(e) => handleDateChange('checkOutDate', new Date(e.target.value))}
                                className="bg-white w-44 min-w-0"
                            />
                            {formData.mode === 'hourly' ? (
                                <>
                                    <Select
                                        value={formData.checkOutTime.split(":")[0] + "h"}
                                        onValueChange={(value) => {
                                            const hour = value.replace("h", "");
                                            const minutes = formData.checkOutTime.split(":")[1] || "00";
                                            handleTimeChange('checkOutTime', `${hour}:${minutes}`);
                                        }}
                                    >
                                        <SelectTrigger className="w-18 shrink-0 bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent position="popper" align="start">
                                            {HOURS.map((h) => (
                                                <SelectItem key={h.value} value={h.value}>
                                                    {h.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={formData.checkOutTime.split(":")[1] || "00"}
                                        onValueChange={(value) => {
                                            const hour = formData.checkOutTime.split(":")[0];
                                            handleTimeChange('checkOutTime', `${hour}:${value}`);
                                        }}
                                    >
                                        <SelectTrigger className="w-16 shrink-0 bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent position="popper" align="start">
                                            {MINUTES.map((m) => (
                                                <SelectItem key={m.value} value={m.value}>
                                                    {m.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </>
                            ) : (
                                <div className="text-sm text-gray-600 font-medium px-2">
                                    {formData.checkOutTime}
                                </div>
                            )}
                        </div>

                        <div className="col-span-1 text-center font-semibold">
                            <div className="text-xs xl:text-sm text-gray-600">
                                {displayDuration()}
                            </div>
                        </div>
                        <div className="col-span-2 text-right">
                            <div className="text-sm xl:text-base font-bold text-primary">
                                {formatPrice(price)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border rounded-lg shadow-sm px-3 sm:px-4 py-4 sm:py-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
                    <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 text-base sm:text-lg mb-2">
                            Đồ ăn & Uống
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">
                            Phòng không có sẵn đồ ăn & nước uống.
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                            Tình iu vui lòng đặt trước để tụi mình chuẩn bị nghen, hoặc ghé quầy mua thêm trước khi lên phòng nha. 🍹 🍰
                        </p>
                    </div>
                    <button
                        type="button"
                        className="flex items-center justify-center sm:justify-start gap-2 bg-status-warning text-status-warning-foreground px-3 sm:px-4 py-2 rounded-md shadow hover:bg-status-warning/90 transition-colors whitespace-nowrap text-sm sm:text-base w-full sm:w-auto"
                        onClick={() => onOpenFoodModal && onOpenFoodModal()}
                    >
                        <ShoppingCart className="w-4 h-4" />
                        Thêm món
                    </button>
                </div>

                <div className="space-y-3">
                    <p className="text-xs sm:text-sm font-semibold text-gray-700">Combo đặc biệt:</p>
                    <div className="space-y-2">
                        {COMBO_ITEMS.map((combo) => {
                            const isSelected = formData.selectedComboIds?.includes(combo.id) || false;
                            return (
                                <button
                                    key={combo.id}
                                    type="button"
                                    onClick={() => {
                                        const currentIds = formData.selectedComboIds || [];
                                        const newIds = isSelected
                                            ? currentIds.filter(id => id !== combo.id)
                                            : [...currentIds, combo.id];
                                        updateFormData({ selectedComboIds: newIds });
                                    }}
                                    className={cn(
                                        "w-full text-left flex items-center justify-between py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg border-2 cursor-pointer transition-all duration-200",
                                        isSelected ? "border-primary bg-primary/5" : "border-border/50 hover:border-border bg-card",
                                    )}
                                >
                                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                        <div className={cn(
                                            "w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0",
                                            isSelected ? "border-primary bg-primary" : "border-border"
                                        )}>
                                            {isSelected && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" strokeWidth={3} />}
                                        </div>
                                        <span className={cn(
                                            "text-xs sm:text-sm font-medium transition-colors truncate",
                                            isSelected ? "text-primary" : "text-gray-700"
                                        )}>{combo.name}</span>
                                    </div>
                                    <span className={cn(
                                        "text-xs sm:text-sm font-semibold ml-2 flex-shrink-0",
                                        isSelected ? "text-primary" : "text-gray-500"
                                    )}>{formatPrice(combo.price)} VNĐ</span>
                                </button>
                            );
                        })}
                    </div>

                    {selectedFoodItems.length > 0 && (
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t space-y-2">
                            {selectedFoodItems.map((item) => (
                                <div key={item.id} className="flex items-center justify-between gap-2">
                                    <span className="text-xs sm:text-sm text-gray-700 flex-1 min-w-0 truncate">
                                        {item.name} <span className="text-gray-500">x{item.qty}</span>
                                    </span>
                                    <span className="text-xs sm:text-sm font-semibold text-gray-700 flex-shrink-0">
                                        {formatPrice((item.qty || 0) * item.price)} VND
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {((formData.selectedComboIds?.length || 0) > 0 || selectedFoodItems.length > 0) && (
                        <div className="flex justify-end pt-2 sm:pt-3 mt-2 sm:mt-3 border-t">
                            <span className="text-xs sm:text-sm">
                                Tổng:{" "}
                                <span className="font-bold text-primary">
                                    {formatPrice(foodTotal)} VND
                                </span>
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
