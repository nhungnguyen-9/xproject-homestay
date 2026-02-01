import React from "react";
import type { BookingFormData } from "@/types/schedule";
import { COMBO_ITEMS } from "@/types/schedule";
import {
    formatDate,
    formatPrice,
} from "@/utils/helpers";

interface Step3Props {
    formData: BookingFormData;
    price: number;
}

export const Step3: React.FC<Step3Props> = ({ formData, price }) => {

    const selectedFoodItems = formData.foodItems.filter((f) => (f.qty || 0) > 0);
    const foodItemsTotal = selectedFoodItems.reduce(
        (sum, item) => sum + item.price * (item.qty || 0),
        0,
    );
    const selectedCombos = COMBO_ITEMS.filter((c) => formData.selectedComboIds?.includes(c.id));
    const comboTotal = selectedCombos.reduce((sum, combo) => sum + combo.price, 0);
    const foodTotal = foodItemsTotal + comboTotal;
    const totalPrice = price + foodTotal;

    const transferContent = `DP ${formData.roomName} ${formatDate(formData.checkInDate)}`;
    const qrUrl = `https://img.vietqr.io/image/MB-0123456789-compact2.png?amount=${totalPrice}&addInfo=${encodeURIComponent(transferContent)}&accountName=CHON%20CINEHOME`;

    return (
        <div className="space-y-4 sm:space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h4 className="text-xl sm:text-2xl font-bold">Thanh Toán</h4>
                <div className="text-xs sm:text-sm text-gray-600">Hình thức: <span className="font-medium">Chuyển khoản</span></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <div className="md:col-span-2 bg-white rounded-lg p-4 shadow-sm">
                    <h5 className="font-semibold mb-2">Nội Dung Chuyển Khoản</h5>
                    <p className="text-sm text-gray-700 mb-3">Bước 1: Mở app ngân hàng/ ví, chọn Quét mã QR hoặc chuyển khoản thủ công.</p>
                    <p className="text-sm text-gray-700 mb-3">Bước 2: Ghi nội dung chuyển khoản: <strong>{transferContent}</strong></p>
                    <div className="text-sm text-gray-600 bg-amber-50 rounded-lg p-3">
                        <p className="mb-1">Số tiền cần thanh toán:</p>
                        <p className="text-lg font-bold text-rose-600">{formatPrice(totalPrice)} VNĐ</p>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-gray-600">Hoặc quét mã QR bên cạnh để thanh toán nhanh.</p>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-4 flex flex-col items-center justify-center shadow-sm">
                    <div className="w-48 h-48 bg-white shadow-inner rounded-md flex items-center justify-center">
                        <img src={qrUrl} alt="QR code" className="max-w-full max-h-full" />
                    </div>
                    <a href={qrUrl} download={`qr-${formData.roomName}.png`} className="mt-3 inline-block px-4 py-2 text-sm bg-blue-600 text-white rounded-md">Tải ảnh QR</a>
                    <p className="text-xs text-gray-500 mt-2">Quét để thanh toán nhanh</p>
                </div>
            </div>

            <div className="text-md text-gray-500 bg-amber-50 rounded-lg p-3 flex items-start gap-2">
                <span className="text-amber-500">⏱️</span>
                <span>
                    Vui lòng thanh toán trong vòng <strong>5 phút</strong> sau khi đặt
                    phòng để giữ chỗ
                </span>
            </div>
        </div>
    );
};
