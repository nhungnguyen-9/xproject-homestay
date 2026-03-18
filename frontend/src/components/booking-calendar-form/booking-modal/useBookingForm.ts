import { useState, useMemo, useCallback } from "react";
import { type BookingFormData, type Booking, ROOM_PRICES } from "@/types/schedule";
import { calculateDuration } from "@/utils/helpers";
import { validateStep1, validateStep2, validateStep3 } from "./validation";

interface UseBookingFormProps {
    initialFormData: BookingFormData;
    bookings: Booking[];
    selectedDate: Date;
}

/**
 * Custom hook để quản lý trạng thái và logic của form đặt phòng
 * Xử lý: chuyển bước, tính toán thời gian, tính giá tiền và validate dữ liệu
 */
export const useBookingForm = ({ initialFormData, bookings, selectedDate }: UseBookingFormProps) => {
    // Trạng thái dữ liệu của form
    const [formData, setFormData] = useState<BookingFormData>(initialFormData);
    // Bước hiện tại trong quy trình đặt phòng (1-3)
    const [currentStep, setCurrentStep] = useState(1);
    // Danh sách lỗi khi validate form
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Tính toán thời lượng lưu trú (số giờ) dựa trên ngày/giờ nhận và trả phòng
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

    // Tính toán tiền phòng dựa trên chế độ đặt (theo giờ, ngày, qua đêm) và thời lượng
    const price = useMemo(() => {
        const priceConfig = ROOM_PRICES[formData.roomType];
        if (formData.mode === "daily") {
            const days = Math.ceil(duration / 24);
            return priceConfig.dailyRate * (days || 1); // Đảm bảo ít nhất 1 ngày
        }
        if (formData.mode === "overnight") {
            const nights = Math.ceil(duration / 24);
            return priceConfig.overnightRate * (nights || 1);
        }
        // Mặc định là đặt theo giờ
        return Math.ceil(duration) * priceConfig.hourlyRate;
    }, [formData.roomType, formData.mode, duration]);

    // Lấy danh sách các món ăn khách đã chọn (có số lượng > 0)
    const selectedFoodItems = formData.foodItems.filter((f) => (f.qty || 0) > 0);
    
    // Tính tổng tiền dịch vụ ăn uống
    const foodTotal = selectedFoodItems.reduce(
        (sum, item) => sum + item.price * (item.qty || 0),
        0,
    );
    
    // Tổng giá trị đơn hàng (Tiền phòng + Tiền ăn uống)
    const totalPrice = price + foodTotal;

    // Hàm thực hiện kiểm tra dữ liệu cho bước hiện tại
    const validateCurrentStep = useCallback((): boolean => {
        let newErrors: Record<string, string> = {};

        if (currentStep === 1) {
            newErrors = validateStep1(formData, bookings, duration, selectedDate);
        } else if (currentStep === 2) {
            newErrors = validateStep2(formData);
        } else if (currentStep === 3) {
            newErrors = validateStep3(formData);
        }

        setErrors(newErrors);
        // Trả về true nếu không có lỗi nào
        return Object.keys(newErrors).length === 0;
    }, [currentStep, formData, bookings, duration, selectedDate]);

    // Hàm đặt lại form về trạng thái ban đầu
    const resetForm = useCallback(() => {
        setFormData(initialFormData);
        setCurrentStep(1);
        setErrors({});
    }, [initialFormData]);

    return {
        formData,
        setFormData,
        currentStep,
        setCurrentStep,
        errors,
        setErrors,
        duration,
        price,
        totalPrice,
        selectedFoodItems,
        validateCurrentStep,
        resetForm,
    };
};
