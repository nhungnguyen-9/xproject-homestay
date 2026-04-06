import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Phone, Calendar, Clock, Tag } from "lucide-react";
import * as bookingService from "@/services/bookingService";
import type { Booking } from "@/types/schedule";
import { formatPrice } from "@/utils/helpers";
import { cn } from "@/lib/utils";

interface BookingLookupModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const STATUS_LABELS: Record<string, string> = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    "checked-in": "Đã nhận phòng",
    "checked-out": "Đã trả phòng",
    cancelled: "Đã hủy",
};

const STATUS_CLASSES: Record<string, string> = {
    pending: "bg-booking-pending-bg text-booking-pending-text border-booking-pending",
    confirmed: "bg-booking-confirmed-bg text-booking-confirmed-text border-booking-confirmed",
    "checked-in": "bg-booking-checked-in-bg text-booking-checked-in-text border-booking-checked-in",
    "checked-out": "bg-booking-checked-out-bg text-booking-checked-out-text border-booking-checked-out",
    cancelled: "bg-booking-cancelled-bg text-booking-cancelled-text border-booking-cancelled",
};

/**
 * Modal tra cứu đơn đặt phòng qua số điện thoại
 * Cho phép khách hàng kiểm tra trạng thái và thông tin đơn của mình
 */
export const BookingLookupModal: React.FC<BookingLookupModalProps> = ({
    open,
    onOpenChange,
}) => {
    const [phone, setPhone] = useState("");
    const [results, setResults] = useState<Booking[] | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone.trim()) return;

        const allBookings = bookingService.getAll();
        const found = allBookings.filter(
            (b) => b.guestPhone === phone.trim() || b.guestPhone === `0${phone.trim()}` || b.guestPhone?.replace(/\s/g, "") === phone.trim().replace(/\s/g, "")
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setResults(found);
        setHasSearched(true);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md w-[95vw] max-h-[85vh] flex flex-col p-0">
                <DialogHeader className="p-4 sm:p-6 pb-2">
                    <DialogTitle className="text-xl font-bold">Tra cứu đặt phòng</DialogTitle>
                    <DialogDescription>
                        Nhập số điện thoại bạn đã dùng để đặt phòng
                    </DialogDescription>
                </DialogHeader>

                <div className="p-4 sm:p-6 pt-2 space-y-4 overflow-y-auto">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Số điện thoại..."
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="pl-9"
                                type="tel"
                            />
                        </div>
                        <Button type="submit" className="bg-primary hover:bg-primary/90">
                            <Search className="size-4 mr-2" />
                            Tìm
                        </Button>
                    </form>

                    <div className="space-y-3">
                        {hasSearched && results && results.length > 0 ? (
                            results.map((booking) => (
                                <div
                                    key={booking.id}
                                    className="border rounded-xl p-3 sm:p-4 space-y-2 bg-card hover:border-primary/50 transition-colors"
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
                                            <p className="font-bold text-md text-gray-800">
                                                Phòng {booking.roomId}
                                            </p>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                                <Calendar className="size-3" />
                                                {booking.date}
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "px-2 py-1 rounded-full text-[10px] font-bold border uppercase",
                                            STATUS_CLASSES[booking.status]
                                        )}>
                                            {STATUS_LABELS[booking.status]}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                            <Clock className="size-3" />
                                            {booking.startTime} - {booking.endTime}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-600 justify-end font-medium">
                                            <Tag className="size-3" />
                                            {formatPrice(booking.totalPrice)} VNĐ
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : hasSearched ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <p>Không tìm thấy đơn đặt phòng nào cho số điện thoại này.</p>
                            </div>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground/60 italic">
                                <p className="text-sm">Nhập số điện thoại để xem lịch sử đặt phòng của bạn</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
