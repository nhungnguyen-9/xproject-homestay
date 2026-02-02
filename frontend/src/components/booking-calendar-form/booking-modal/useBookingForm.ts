import { useState, useMemo, useCallback } from "react";
import { type BookingFormData, type Booking, ROOM_PRICES } from "@/types/schedule";
import { calculateDuration } from "@/utils/helpers";
import { validateStep1, validateStep2, validateStep3 } from "./validation";

interface UseBookingFormProps {
    initialFormData: BookingFormData;
    bookings: Booking[];
    selectedDate: Date;
}

export const useBookingForm = ({ initialFormData, bookings, selectedDate }: UseBookingFormProps) => {
    const [formData, setFormData] = useState<BookingFormData>(initialFormData);
    const [currentStep, setCurrentStep] = useState(1);
    const [errors, setErrors] = useState<Record<string, string>>({});

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
            const days = Math.ceil(duration / 24);
            return priceConfig.dailyRate * days;
        }
        if (formData.mode === "overnight") {
            const nights = Math.ceil(duration / 24);
            return priceConfig.overnightRate * nights;
        }
        return Math.ceil(duration) * priceConfig.hourlyRate;
    }, [formData.roomType, formData.mode, duration]);

    const selectedFoodItems = formData.foodItems.filter((f) => (f.qty || 0) > 0);
    const foodTotal = selectedFoodItems.reduce(
        (sum, item) => sum + item.price * (item.qty || 0),
        0,
    );
    const totalPrice = price + foodTotal;

    // Validation functions
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

    // Reset form
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
