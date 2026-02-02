import React, { useState, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    type Room,
    type BookingFormData,
    type Booking,
    ROOM_PRICES,
    FOOD_ITEMS,
} from "@/types/schedule";
import {
    Check,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import {
    calculateDuration,
    timeToMinutes,
} from "@/utils/helpers";
import {
    StepIndicator,
    PaymentModal,
    Snowfall,
    Step1,
    Step2,
    Step3,
    FoodModal,
} from "./booking-modal/index";

// ==================== PROPS ====================
interface BookingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    room: Room | null;
    rooms: Room[];
    selectedDate: Date;
    selectedTime: string;
    bookings: Booking[];
    onBookingCreate?: (booking: Omit<Booking, "id">) => void;
}

// ==================== SUB COMPONENTS ====================
// Step components are now in separate files: Step1.tsx, Step2.tsx, Step3.tsx

// ==================== MAIN COMPONENT ====================
export const BookingModal: React.FC<BookingModalProps> = ({
    open,
    onOpenChange,
    room,
    rooms,
    selectedDate,
    selectedTime,
    bookings,
    onBookingCreate,
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPayment, setShowPayment] = useState(false);
    const [submittedFormData, setSubmittedFormData] =
        useState<BookingFormData | null>(null);
    const [showFoodModal, setShowFoodModal] = useState(false);

    // Initialize form data
    const initialFormData = useMemo((): BookingFormData => {
        const checkInHour = selectedTime.split(":")[0] || "06";
        const checkOutHour = String(
            Math.min(parseInt(checkInHour) + 1, 23),
        ).padStart(2, "0");

        return {
            roomId: room?.id || rooms[0]?.id || "",
            roomType: room?.type || "standard",
            roomName: room?.name || rooms[0]?.name || "",
            mode: "hourly",
            checkInDate: selectedDate,
            checkInTime: `${checkInHour}:00`,
            checkOutDate: selectedDate,
            checkOutTime: `${checkOutHour}:00`,
            adults: 2,
            guestName: "",
            guestPhone: "",
            idImages: [],
            foodItems: FOOD_ITEMS.map((item) => ({ ...item, selected: false, qty: 0 })),
            selectedComboIds: [],
            note: "",
            voucher: "",
            acceptTerms: false,
        };
    }, [room, rooms, selectedDate, selectedTime]);

    const [formData, setFormData] = useState<BookingFormData>(initialFormData);

    // Reset form when modal opens
    React.useEffect(() => {
        if (open) {
            setFormData(initialFormData);
            setCurrentStep(1);
            setErrors({});
        }
    }, [open, initialFormData]);

    // Update form when selected slot changes while modal is open
    React.useEffect(() => {
        if (open) {
            setFormData(initialFormData);
        }
    }, [open, selectedDate, selectedTime, room, initialFormData]);

    // Calculate duration and price
    const duration = useMemo(() => {
        return calculateDuration(
            formData.checkInDate,
            formData.checkInTime,
            formData.checkOutDate,
            formData.checkOutTime,
        );
    }, [
        formData.checkInDate,
        formData.checkInTime,
        formData.checkOutDate,
        formData.checkOutTime,
    ]);

    const price = useMemo(() => {
        const priceConfig = ROOM_PRICES[formData.roomType];
        if (formData.mode === "daily") {
            // Calculate number of days
            const days = Math.ceil(duration / 24);
            return priceConfig.dailyRate * days;
        }
        if (formData.mode === "overnight") {
            // Calculate number of nights
            const nights = Math.ceil(duration / 24);
            return priceConfig.overnightRate * nights;
        }
        // Hourly rate
        return Math.ceil(duration) * priceConfig.hourlyRate;
    }, [formData.roomType, formData.mode, duration]);

    const selectedFoodItems = formData.foodItems.filter((f) => (f.qty || 0) > 0);
    const foodTotal = selectedFoodItems.reduce(
        (sum, item) => sum + item.price * (item.qty || 0),
        0,
    );
    const totalPrice = price + foodTotal;

    // Validation
    const validateStep1 = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};

        if (duration < 0.5) {
            newErrors.duration = "Thời gian đặt phòng tối thiểu 30 phút";
        }

        // Check for overlapping bookings
        const roomBookings = bookings.filter((b) => b.roomId === formData.roomId);
        const checkInMinutes = timeToMinutes(formData.checkInTime);
        const checkOutMinutes = timeToMinutes(formData.checkOutTime);

        for (const booking of roomBookings) {
            const bookingStart = timeToMinutes(booking.startTime);
            const bookingEnd = timeToMinutes(booking.endTime);

            // Check overlap (same day only for now)
            if (formData.checkInDate.toDateString() === selectedDate.toDateString()) {
                if (
                    (checkInMinutes >= bookingStart && checkInMinutes < bookingEnd) ||
                    (checkOutMinutes > bookingStart && checkOutMinutes <= bookingEnd) ||
                    (checkInMinutes <= bookingStart && checkOutMinutes >= bookingEnd)
                ) {
                    newErrors.time = "Khung giờ này đã có người đặt";
                    break;
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, bookings, duration, selectedDate]);

    const validateStep2 = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.guestName.trim()) {
            newErrors.guestName = "Vui lòng nhập họ và tên";
        }

        if (!formData.guestPhone.trim()) {
            newErrors.guestPhone = "Vui lòng nhập số điện thoại";
        } else if (!/^[0-9]{10,11}$/.test(formData.guestPhone.replace(/\s/g, ""))) {
            newErrors.guestPhone = "Số điện thoại không hợp lệ";
        }

        if (formData.idImages.length === 0) {
            newErrors.idImages = "Vui lòng upload ảnh CMND/CCCD";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const validateStep3 = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.acceptTerms) {
            newErrors.acceptTerms = "Vui lòng đồng ý với điều khoản";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    // Handlers
    const handleNext = () => {
        if (currentStep === 1 && validateStep1()) {
            setCurrentStep(2);
        } else if (currentStep === 2 && validateStep2()) {
            setCurrentStep(3);
        } else if (currentStep === 3 && validateStep3()) {
            // Create booking
            const newBooking: Omit<Booking, "id"> = {
                roomId: formData.roomId,
                startTime: formData.checkInTime,
                endTime: formData.checkOutTime,
                guestName: formData.guestName,
                guestPhone: formData.guestPhone,
                status: "pending",
                note: formData.note,
                adults: formData.adults,
                foodItems: selectedFoodItems,
                totalPrice,
            };
            onBookingCreate?.(newBooking);
            setSubmittedFormData({ ...formData });
            onOpenChange(false);
            setShowPayment(true);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setErrors({});
        }
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="relative max-w-6xl w-[95vw] max-h-[90vh] sm:max-h-[85vh] flex flex-col p-0 gap-0"
                    style={{ maxWidth: "1150px", width: "95vw" }}
                >
                    {open && <Snowfall />}
                    {/* Header */}
                    <div className="relative flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b">
                        <DialogTitle className="text-lg sm:text-2xl font-bold text-gray-800">
                            Đặt phòng
                        </DialogTitle>

                        {/* centered indicator - hidden on mobile */}
                        <div className="hidden sm:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <StepIndicator currentStep={currentStep} totalSteps={3} />
                        </div>
                    </div>

                    {/* Mobile step indicator */}
                    <div className="sm:hidden px-3 py-2 border-b bg-gray-50 flex justify-center">
                        <StepIndicator currentStep={currentStep} totalSteps={3} />
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-3 sm:py-4">
                        {currentStep === 1 && (
                            <Step1
                                formData={formData}
                                setFormData={setFormData}
                                rooms={rooms}
                                bookings={bookings}
                                selectedDate={selectedDate}
                                price={price}
                                onOpenFoodModal={() => setShowFoodModal(true)}
                            />
                        )}
                        {currentStep === 2 && (
                            <Step2
                                formData={formData}
                                setFormData={setFormData}
                                price={price}
                                duration={duration}
                                errors={errors}
                            />
                        )}
                        {currentStep === 3 && (
                            <Step3
                                formData={formData}
                                price={price}
                            />
                        )}

                        {/* Error messages */}
                        {(errors.duration || errors.time) && (
                            <div className="mt-3 p-3 bg-red-50 rounded-lg">
                                {errors.duration && (
                                    <p className="text-sm text-red-600">{errors.duration}</p>
                                )}
                                {errors.time && (
                                    <p className="text-sm text-red-600">{errors.time}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between sm:justify-end px-3 sm:px-5 py-3 sm:py-4 border-t gap-2">
                        <Button
                            variant="ghost"
                            onClick={handleCancel}
                            className="text-gray-500 hover:text-gray-700 text-sm sm:text-base px-3 sm:px-4"
                        >
                            Huỷ
                        </Button>
                        <div className="flex gap-2">
                            {currentStep > 1 && (
                                <Button
                                    variant="outline"
                                    onClick={handleBack}
                                    className="gap-1 text-sm sm:text-base px-3 sm:px-4"
                                >
                                    <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">Quay lại</span>
                                    <span className="sm:hidden">Quay</span>
                                </Button>
                            )}
                            <Button
                                onClick={handleNext}
                                className="bg-rose-400 hover:bg-rose-500 text-white gap-1 min-w-24 sm:min-w-30 text-sm sm:text-base px-3 sm:px-4"
                            >
                                {currentStep === 3 ? (
                                    <>
                                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                                        Đặt phòng
                                    </>
                                ) : (
                                    <>
                                        Tiếp tục
                                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <FoodModal
                open={showFoodModal}
                onOpenChange={setShowFoodModal}
                items={formData.foodItems}
                onConfirm={(items) => setFormData((prev) => ({ ...prev, foodItems: items }))}
            />
            {submittedFormData && (
                <PaymentModal
                    open={showPayment}
                    onOpenChange={setShowPayment}
                    formData={submittedFormData}
                    totalPrice={totalPrice}
                />
            )}
        </>
    );
};

export default BookingModal;
