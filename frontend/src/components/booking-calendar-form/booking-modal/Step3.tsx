import React from "react";
import type { BookingFormData } from "@/types/schedule";
import {
    formatPrice,
} from "@/utils/helpers";
import { BANK_CONFIG } from "@/config/bank";

interface Step3Props {
    formData: BookingFormData;
    price: number;
}

/**
 * Bước 3 — Hiển thị mã QR thanh toán chuyển khoản và tóm tắt số tiền cần trả
 */
export const Step3: React.FC<Step3Props> = ({ formData, price }) => {

    const selectedFoodItems = formData.foodItems.filter((f) => (f.qty || 0) > 0);
    const foodTotal = selectedFoodItems.reduce(
        (sum, item) => sum + item.price * (item.qty || 0),
        0,
    );
    const totalPrice = price + foodTotal;

    const { bankId, bankAccount, accountName } = BANK_CONFIG;
    const phoneSuffix = formData.guestPhone.slice(-4);

    // Định dạng ngày DDMM để nội dung CK ngắn gọn (VD: 2003 cho ngày 20/03)
    const day = String(formData.checkInDate.getDate()).padStart(2, '0');
    const month = String(formData.checkInDate.getMonth() + 1).padStart(2, '0');
    const dateCompact = `${day}${month}`;

    // Nội dung CK: "DP [tên phòng] [4 số cuối SĐT] [DDMM]" để đối soát tự động dễ dàng
    const transferContent = `DP ${formData.roomName} ${phoneSuffix} ${dateCompact}`;
    const qrUrl = `https://img.vietqr.io/image/${bankId}-${bankAccount}-compact2.png?amount=${totalPrice}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;

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
                    <div className="text-sm text-muted-foreground bg-status-warning-muted rounded-lg p-3 space-y-1.5">
                        <div className="flex justify-between">
                            <span>Giá phòng</span>
                            <span className="font-medium text-gray-800">{formatPrice(price)} VNĐ</span>
                        </div>
                        {selectedFoodItems.length > 0 && (
                            <>
                                <div className="text-xs font-medium text-gray-500 mt-1">Dịch vụ thêm:</div>
                                {selectedFoodItems.map(item => (
                                    <div key={item.id} className="flex justify-between pl-2">
                                        <span className="text-gray-600">{item.name} <span className="text-gray-400">x{item.qty}</span></span>
                                        <span className="font-medium text-gray-800">{formatPrice(item.price * (item.qty || 0))} VNĐ</span>
                                    </div>
                                ))}
                            </>
                        )}
                        <div className="flex justify-between border-t pt-2 mt-2">
                            <span className="font-bold">Tổng thanh toán</span>
                            <span className="text-lg font-bold text-primary">{formatPrice(totalPrice)} VNĐ</span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-gray-600">Hoặc quét mã QR bên cạnh để thanh toán nhanh.</p>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-gray-600">
                            Bước 3: Gửi ảnh chuyển khoản thành công cho page nhé.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-4 flex flex-col items-center justify-center shadow-sm">
                    <div className="w-48 h-48 bg-white shadow-inner rounded-md flex items-center justify-center">
                        <img src={qrUrl} alt="QR code" className="max-w-full max-h-full" />
                    </div>
                    <a href={qrUrl} download={`qr-${formData.roomName}.png`} className="mt-3 inline-block px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md">Tải ảnh QR</a>
                    <p className="text-xs text-gray-500 mt-2">Quét để thanh toán nhanh</p>
                </div>
            </div>

            <div className="text-md text-muted-foreground bg-status-warning-muted rounded-lg p-3 flex items-start gap-2">
                <span className="text-amber-500">⏱️</span>
                <span>
                    Vui lòng thanh toán trong vòng <strong>5 phút</strong> sau khi đặt
                    phòng để giữ chỗ
                </span>
            </div>
        </div>
    );
};
