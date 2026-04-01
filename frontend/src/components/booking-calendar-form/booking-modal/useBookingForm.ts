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
 * Hook quản lý state và logic form đặt phòng — chuyển bước, tính giá, validate dữ liệu
 * @param initialFormData - Dữ liệu form ban đầu (phòng, thời gian, chế độ đặt)
 * @param bookings - Danh sách booking hiện tại để kiểm tra trùng lịch
 * @param selectedDate - Ngày được chọn trên calendar
 */
export const useBookingForm = ({ initialFormData, bookings, selectedDate }: UseBookingFormProps) => {
    const [formData, setFormData] = useState<BookingFormData>(initialFormData);
    const [currentStep, setCurrentStep] = useState(1);
    const [errors, setErrors] = useState<Record<string, string>>({});

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

    // Tính giá phòng: theo giờ nhân hourlyRate, theo ngày cộng phụ thu giờ lẻ, qua đêm cộng phụ thu nếu vượt 11h
    const price = useMemo(() => {
        const priceConfig = ROOM_PRICES[formData.roomType];

        if (formData.mode === "hourly") {
            return Math.max(1, Math.ceil(duration)) * priceConfig.hourlyRate;
        }

        if (formData.mode === "daily") {
            const fullDays = Math.max(1, Math.floor(duration / 24) || 1);
            const remainingHours = duration - fullDays * 24;
            const extraHours = Math.max(0, Math.ceil(remainingHours));
            return fullDays * priceConfig.dailyRate + extraHours * priceConfig.extraHourRate;
        }

        if (formData.mode === "overnight") {
            const OVERNIGHT_BASE_HOURS = 11;
            if (duration <= OVERNIGHT_BASE_HOURS) {
                return priceConfig.overnightRate;
            }
            const extraHours = Math.ceil(duration - OVERNIGHT_BASE_HOURS);
            return priceConfig.overnightRate + extraHours * priceConfig.extraHourRate;
        }

        return Math.ceil(duration) * priceConfig.hourlyRate;
    }, [formData.roomType, formData.mode, duration]);

    const selectedFoodItems = formData.foodItems.filter((f) => (f.qty || 0) > 0);
    const foodTotal = selectedFoodItems.reduce(
        (sum, item) => sum + item.price * (item.qty || 0),
        0,
    );
    const totalPrice = price + foodTotal;

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
        return Object.keys(newErrors).length === 0;
    }, [currentStep, formData, bookings, duration, selectedDate]);

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
