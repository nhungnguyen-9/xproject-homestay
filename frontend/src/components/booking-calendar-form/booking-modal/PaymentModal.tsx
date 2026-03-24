import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { BookingFormData } from "@/types/schedule";
import { formatDate, formatPrice } from "@/utils/helpers";
import { CreditCard } from "lucide-react";

interface PaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    formData: BookingFormData;
    totalPrice: number;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
    open,
    onOpenChange,
    formData,
    totalPrice,
}) => {
    const transferContent = `DP ${formData.roomName} ${formatDate(formData.checkInDate)}`;
    const qrUrl = `https://img.vietqr.io/image/MB-0123456789-compact2.png?amount=${totalPrice}&addInfo=${encodeURIComponent(transferContent)}&accountName=CHON%20CINEHOME`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm w-[90vw]">
                <DialogHeader className="text-center space-y-3 sm:space-y-4 py-2">
                    <div className="size-12 bg-status-success-muted rounded-full flex items-center justify-center mx-auto">
                        <CreditCard className="size-6 text-status-success" />
                    </div>
                    <div>
                        <DialogTitle className="font-bold text-lg">Đặt phòng thành công!</DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Vui lòng thanh toán để hoàn tất đặt phòng
                        </p>
                    </div>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    {/* QR Code */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <img src={qrUrl} alt="QR Code" className="size-48 border rounded-lg" />
                        </div>
                    </div>

                    {/* Transfer Info */}
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Ngân hàng</span>
                            <span className="font-medium">MB Bank</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Số tài khoản</span>
                            <span className="font-medium">0123456789</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Chủ tài khoản</span>
                            <span className="font-medium">CHON CINEHOME</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Số tiền</span>
                            <span className="font-bold text-status-success">
                                {formatPrice(totalPrice)} VNĐ
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Nội dung CK</span>
                            <span className="font-medium text-status-success">
                                {transferContent}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                        >
                            Đóng
                        </Button>
                        <Button
                            className="flex-1 bg-status-success hover:bg-status-success/90"
                            onClick={() => {
                                // Handle payment confirmation
                                onOpenChange(false);
                            }}
                        >
                            Đã chuyển khoản
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
