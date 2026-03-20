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
import { AnimatePresence, motion } from "framer-motion";
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
    open: boolean;                 // Trạng thái đóng/mở modal
    onOpenChange: (open: boolean) => void; // Hàm xử lý khi thay đổi trạng thái mở
    room: Room | null;             // Phòng đang được chọn để đặt
    rooms: Room[];                 // Danh sách tất cả các phòng
    selectedDate: Date;            // Ngày được chọn trên lịch
    selectedTime: string;          // Giờ được chọn trên lịch
    bookings: Booking[];           // Danh sách các đơn đặt phòng hiện có (để kiểm tra trùng lịch)
    onBookingCreate?: (booking: Omit<Booking, "id">) => void; // Callback khi đặt phòng thành công
}

/**
 * Thành phần chính: Modal Đặt Phòng (BookingModal)
 * Quản lý quy trình đặt phòng đa bước:
 * Bước 1: Chọn phòng & Thời gian & Dịch vụ
 * Bước 2: Thông tin khách hàng & Giấy tờ
 * Bước 3: Xác nhận & Điều khoản
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
    // Quản lý bước hiện tại
    const [currentStep, setCurrentStep] = useState(1);
    // Quản lý lỗi hiển thị
    const [errors, setErrors] = useState<Record<string, string>>({});
    // Trạng thái hiển thị modal thanh toán sau khi hoàn tất
    const [showPayment, setShowPayment] = useState(false);
    // Lưu trữ dữ liệu form đã submit thành công
    const [submittedFormData, setSubmittedFormData] =
        useState<BookingFormData | null>(null);
    // Trạng thái đóng/mở modal chọn món ăn/dịch vụ
    const [showFoodModal, setShowFoodModal] = useState(false);

    // Khởi tạo dữ liệu form ban đầu dựa trên phòng và giờ được chọn từ lịch
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

    // Trạng thái dữ liệu form hiện tại
    const [formData, setFormData] = useState<BookingFormData>(initialFormData);

    // Reset lại form mỗi khi mở modal
    React.useEffect(() => {
        if (open) {
            setFormData(initialFormData);
            setCurrentStep(1);
            setErrors({});
        }
    }, [open, initialFormData]);

    // Cập nhật lại form nếu người dùng đổi ô chọn trên lịch trong khi modal vẫn mở
    React.useEffect(() => {
        if (open) {
            setFormData(initialFormData);
        }
    }, [open, selectedDate, selectedTime, room, initialFormData]);

    // Tính toán thời lượng lưu trú
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

    // Tính toán tiền phòng tạm tính
    const price = useMemo(() => {
        const priceConfig = ROOM_PRICES[formData.roomType];
        if (formData.mode === "daily") {
            const days = Math.ceil(duration / 24);
            return priceConfig.dailyRate * days;
        }
        if (formData.mode === "overnight") {
            const nights = Math.ceil(duration / 24);
            return priceConfig.overnightRate * nights;
        }
        return Math.ceil(duration) * priceConfig.hourlyRate;
    }, [formData.roomType, formData.mode, duration]);

    // Tính tiền dịch vụ đi kèm
    const selectedFoodItems = formData.foodItems.filter((f) => (f.qty || 0) > 0);
    const foodTotal = selectedFoodItems.reduce(
        (sum, item) => sum + item.price * (item.qty || 0),
        0,
    );
    // Tổng cộng cuối cùng
    const totalPrice = price + foodTotal;

    /**
     * Kiểm tra dữ liệu Bước 1: Thời gian & Phòng
     */
    const validateStep1 = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};

        if (duration < 0.5) {
            newErrors.duration = "Thời gian đặt phòng tối thiểu 30 phút";
        }

        // Kiểm tra xem thời gian chọn có bị trùng với lịch đặt hiện có không
        const roomBookings = bookings.filter((b) => b.roomId === formData.roomId);
        const checkInMinutes = timeToMinutes(formData.checkInTime);
        const checkOutMinutes = timeToMinutes(formData.checkOutTime);

        for (const booking of roomBookings) {
            const bookingStart = timeToMinutes(booking.startTime);
            const bookingEnd = timeToMinutes(booking.endTime);

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

    /**
     * Kiểm tra dữ liệu Bước 2: Thông tin khách hàng
     */
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

    /**
     * Kiểm tra dữ liệu Bước 3: Điều khoản
     */
    const validateStep3 = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.acceptTerms) {
            newErrors.acceptTerms = "Vui lòng đồng ý với điều khoản";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    /**
     * Xử lý khi nhấn nút "Tiếp tục" hoặc "Đặt phòng"
     */
    const handleNext = () => {
        if (currentStep === 1 && validateStep1()) {
            setCurrentStep(2);
        } else if (currentStep === 2 && validateStep2()) {
            setCurrentStep(3);
        } else if (currentStep === 3 && validateStep3()) {
            // Chuẩn bị dữ liệu để gửi lên
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
                date: formData.checkInDate.toISOString().split('T')[0],
                category: 'guest' as const,
            };
            // Gọi callback thông báo tạo thành công
            onBookingCreate?.(newBooking);
            // Lưu dữ liệu để hiển thị ở modal thanh toán
            setSubmittedFormData({ ...formData });
            // Đóng modal chính và mở modal thanh toán
            onOpenChange(false);
            setShowPayment(true);
        }
    };

    /**
     * Quay lại bước trước đó
     */
    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setErrors({});
        }
    };

    /**
     * Đóng modal
     */
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
                    {/* Hiệu ứng tuyết rơi bên trong modal */}
                    {open && <Snowfall />}
                    
                    {/* Tiêu đề Modal và Chỉ báo bước (Desktop) */}
                    <div className="relative flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b">
                        <DialogTitle className="text-lg sm:text-2xl font-bold text-gray-800">
                            Đặt phòng
                        </DialogTitle>

                        <div className="hidden sm:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <StepIndicator currentStep={currentStep} totalSteps={3} />
                        </div>
                    </div>

                    {/* Chỉ báo bước cho Mobile */}
                    <div className="sm:hidden px-3 py-2 border-b bg-gray-50 flex justify-center">
                        <StepIndicator currentStep={currentStep} totalSteps={3} />
                    </div>

                    {/* Nội dung chính - AnimatePresence tạo hiệu ứng chuyển bước mượt */}
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

                        {/* Hiển thị thông báo lỗi (nếu có) */}
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

                    {/* Chân Modal: Nút điều khiển - touch area ≥ 44px */}
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
                            {/* Nút CTA chính - rose-400 nhacam primary */}
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

            {/* Modal phụ chọn đồ ăn */}
            <FoodModal
                open={showFoodModal}
                onOpenChange={setShowFoodModal}
                items={formData.foodItems}
                onConfirm={(items) => setFormData((prev) => ({ ...prev, foodItems: items }))}
            />

            {/* Modal hiển thị thông tin thanh toán (QR code, chuyển khoản) */}
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
