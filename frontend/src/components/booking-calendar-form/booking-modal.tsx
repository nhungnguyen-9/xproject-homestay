import React, { useState, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    type Room,
    type BookingFormData,
    type Booking,
    FOOD_ITEMS,
    getRoomPriceConfig,
} from "@/types/schedule";
import {
    Check,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
    calculateDuration,
    calculateBookingPrice,
    formatDateInput,
} from "@/utils/helpers";
import * as customerService from "@/services/customerService";
import {
    StepIndicator,
    PaymentModal,
    Step1,
    Step2,
    Step3,
    FoodModal,
    validateStep1 as sharedValidateStep1,
} from "./booking-modal/index";

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

/**
 * Modal đặt phòng đa bước — quản lý quy trình chọn phòng, nhập thông tin khách, xác nhận thanh toán
 */
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

    React.useEffect(() => {
        if (open) {
            setFormData(initialFormData);
            setCurrentStep(1);
            setErrors({});
        }
    }, [open, initialFormData]);

    React.useEffect(() => {
        if (open) {
            setFormData(initialFormData);
        }
    }, [open, selectedDate, selectedTime, room, initialFormData]);

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

    const selectedRoom = useMemo(() => rooms.find(r => r.id === formData.roomId) ?? room, [rooms, formData.roomId, room]);

    const price = useMemo(() => {
        const priceConfig = selectedRoom ? getRoomPriceConfig(selectedRoom) : getRoomPriceConfig({ type: formData.roomType });
        return calculateBookingPrice(
            formData.mode,
            duration,
            priceConfig,
            formData.combo6h1hOption,
        );
    }, [selectedRoom, formData.roomType, formData.mode, duration, formData.combo6h1hOption]);

    const selectedFoodItems = formData.foodItems.filter((f) => (f.qty || 0) > 0);
    const foodTotal = selectedFoodItems.reduce(
        (sum, item) => sum + item.price * (item.qty || 0),
        0,
    );
    const totalPrice = price + foodTotal;

    const validateStep1 = useCallback((): boolean => {
        const newErrors = sharedValidateStep1(formData, bookings, duration, selectedDate);
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

        // Chỉ yêu cầu upload nếu khách chưa có ảnh CCCD trong hệ thống
        const hasExistingImages = formData.customerLookup?.hasIdImages === true;
        if (!hasExistingImages && formData.idImages.length === 0) {
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

    const handleNext = async () => {
        if (currentStep === 1 && validateStep1()) {
            setCurrentStep(2);
        } else if (currentStep === 2 && validateStep2()) {
            setCurrentStep(3);
        } else if (currentStep === 3 && validateStep3()) {
            // Upload ảnh CCCD nếu có ảnh mới và biết customerId
            if (formData.idImages.length > 0 && formData.customerLookup?.id) {
                try {
                    await customerService.uploadIdImages(formData.customerLookup.id, formData.idImages);
                } catch {
                    // Non-blocking: booking vẫn được tạo dù upload ảnh fail
                }
            }

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
                date: formatDateInput(formData.checkInDate),
                category: 'guest' as const,
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
                    className="relative max-w-6xl w-[95vw] max-h-[90vh] sm:max-h-[85vh] flex flex-col p-0 gap-0 bg-white"
                    style={{ maxWidth: "1150px", width: "95vw" }}
                >
                    {/* {open && <Snowfall />} */}

                    <div className="relative flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b">
                        <DialogTitle className="text-lg sm:text-2xl font-bold text-gray-800">
                            Đặt phòng
                        </DialogTitle>

                        <div className="hidden sm:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <StepIndicator currentStep={currentStep} totalSteps={3} />
                        </div>
                    </div>

                    <div className="sm:hidden px-3 py-2 border-b bg-muted/50 flex justify-center">
                        <StepIndicator currentStep={currentStep} totalSteps={3} />
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-3 sm:py-4">
                        <AnimatePresence mode="wait">
                            {currentStep === 1 && (
                                <motion.div
                                    key="step-1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                >
                                    <Step1
                                        formData={formData}
                                        setFormData={setFormData}
                                        rooms={rooms}
                                        bookings={bookings}
                                        selectedDate={selectedDate}
                                        price={price}
                                        onOpenFoodModal={() => setShowFoodModal(true)}
                                    />
                                </motion.div>
                            )}
                            {currentStep === 2 && (
                                <motion.div
                                    key="step-2"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                >
                                    <Step2
                                        formData={formData}
                                        setFormData={setFormData}
                                        price={price}
                                        duration={duration}
                                        errors={errors}
                                    />
                                </motion.div>
                            )}
                            {currentStep === 3 && (
                                <motion.div
                                    key="step-3"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                >
                                    <Step3
                                        formData={formData}
                                        price={price}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {(errors.duration || errors.time) && (
                            <div className="mt-3 p-3 bg-status-error-muted rounded-lg">
                                {errors.duration && (
                                    <p className="text-sm text-red-600">{errors.duration}</p>
                                )}
                                {errors.time && (
                                    <p className="text-sm text-red-600">{errors.time}</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end px-3 sm:px-5 py-3 sm:py-4 border-t gap-2">
                        <Button
                            variant="ghost"
                            onClick={handleCancel}
                            className="min-h-[44px] text-gray-500 hover:text-gray-700 text-sm sm:text-base px-3 sm:px-4"
                        >
                            Huỷ
                        </Button>
                        <div className="flex gap-2">
                            {currentStep > 1 && (
                                <Button
                                    variant="outline"
                                    onClick={handleBack}
                                    className="min-h-[44px] gap-1 text-sm sm:text-base px-3 sm:px-4"
                                >
                                    <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">Quay lại</span>
                                    <span className="sm:hidden">Quay</span>
                                </Button>
                            )}
                            <Button
                                variant="primary"
                                onClick={handleNext}
                                className="min-h-[44px] gap-1 min-w-24 sm:min-w-30 text-sm sm:text-base px-3 sm:px-4"
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
