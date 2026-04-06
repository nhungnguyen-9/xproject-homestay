import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { BookingFormData } from "@/types/schedule";
import { formatPrice } from "@/utils/helpers";
import { CreditCard } from "lucide-react";
import { BANK_CONFIG } from "@/config/bank";

interface PaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    formData: BookingFormData;
    totalPrice: number;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ open, onOpenChange, formData, totalPrice }) => {
    const { bankId, bankAccount, accountName } = BANK_CONFIG;
    const phoneSuffix = formData.guestPhone.slice(-4);
    const day = String(formData.checkInDate.getDate()).padStart(2, '0');
    const month = String(formData.checkInDate.getMonth() + 1).padStart(2, '0');
    const year = formData.checkInDate.getFullYear();
    const transferContent = `DP ${formData.roomName} ${phoneSuffix} ${day}/${month}/${year}`;
    const qrUrl = `https://img.vietqr.io/image/${bankId}-${bankAccount}-compact2.png?amount=${totalPrice}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;

    const rows = [
        { label: "Ngân hàng", value: `${bankId} Bank`, green: false },
        { label: "Số tài khoản", value: bankAccount, green: false },
        { label: "Chủ tài khoản", value: accountName, green: false },
        { label: "Số tiền", value: `${formatPrice(totalPrice)} VNĐ`, green: true },
        { label: "Nội dung CK", value: transferContent, green: true },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm w-[92vw] bg-white rounded-2xl p-6 flex flex-col items-center gap-4">
                {/* Icon */}
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                    <CreditCard className="w-7 h-7 text-green-600" />
                </div>

                {/* Title */}
                <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-900">Đặt phòng thành công!</h3>
                    <p className="text-sm text-gray-500 mt-1">Vui lòng thanh toán để hoàn tất đặt phòng</p>
                </div>

                {/* QR */}
                <div className="border border-gray-200 rounded-2xl p-4 w-full flex items-center justify-center bg-white">
                    <img src={qrUrl} alt="QR Code" className="w-44 h-44 object-contain" />
                </div>

                {/* Bank info */}
                <div className="w-full bg-gray-50 rounded-xl px-4 py-3 space-y-2.5">
                    {rows.map(r => (
                        <div key={r.label} className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">{r.label}</span>
                            <span className={r.green ? "font-semibold text-green-600" : "font-semibold text-gray-800"}>
                                {r.value}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 w-full">
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 py-3 rounded-xl border border-gray-300 text-sm font-bold text-gray-800 hover:bg-gray-50 transition-colors"
                    >
                        Đóng
                    </button>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 py-3 rounded-xl bg-green-600 text-sm font-bold text-white hover:bg-green-700 transition-colors"
                    >
                        Đã chuyển khoản
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
