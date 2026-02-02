export const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN').format(price);
};

export const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

export const formatDateInput = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
};

export const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

export const calculateDuration = (
    checkInDate: Date,
    checkInTime: string,
    checkOutDate: Date,
    checkOutTime: string
): number => {
    const checkInMinutes = timeToMinutes(checkInTime);
    const checkOutMinutes = timeToMinutes(checkOutTime);

    // Same day
    if (checkInDate.toDateString() === checkOutDate.toDateString()) {
        return Math.max(0, (checkOutMinutes - checkInMinutes) / 60);
    }

    // Different days - calculate total minutes
    const dayDiff = Math.floor((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalMinutes = (dayDiff * 24 * 60) + checkOutMinutes - checkInMinutes;
    return Math.max(0, totalMinutes / 60);
};