import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { BookingFormData } from "@/types/schedule";
import { COMBO_ITEMS } from "@/types/schedule";
import {
    formatDate,
    formatPrice,
} from "@/utils/helpers";
import { ImageUpload, ROOM_TYPE_LABELS } from "./index";

interface Step2Props {
    formData: BookingFormData;
    setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
    price: number;
    duration: number;
    errors: Record<string, string>;
}

/**
 * Bước 2 — Nhập thông tin khách hàng, upload giấy tờ tuỳ thân, xem tóm tắt đơn đặt phòng
 */
export const Step2: React.FC<Step2Props> = ({
    formData,
    setFormData,
    price,
    duration,
    errors,
}) => {
    const updateFormData = (updates: Partial<BookingFormData>) => {
        setFormData((prev) => ({ ...prev, ...updates }));
    };

    const [showTerms, setShowTerms] = React.useState(false);
    const selectedFoodItems = formData.foodItems.filter((f) => (f.qty || 0) > 0);
    const foodItemsTotal = selectedFoodItems.reduce(
        (sum, item) => sum + item.price * (item.qty || 0),
        0,
    );
    const selectedCombos = COMBO_ITEMS.filter((c) => formData.selectedComboIds?.includes(c.id));
    const comboTotal = selectedCombos.reduce((sum, combo) => sum + combo.price, 0);
    const foodTotal = foodItemsTotal + comboTotal;
    const totalPrice = price + foodTotal;

    return (
        <div className="space-y-4 sm:space-y-5">
            <div className="space-y-3 sm:space-y-4">
                <div>
                    <h4 className="font-bold text-base sm:text-lg text-gray-800 flex items-center gap-2">
                        Bước 2: Thông tin khách hàng
                    </h4>
                    <p className="text-sm sm:text-md my-1">Vui lòng nhập thông tin khách hàng và xác nhận đặt phòng</p>
                </div>

                <div className="px-3 py-4 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 bg-white border rounded-lg shadow-sm">
                    <div className="space-y-1.5">
                        <label className="text-mdfont-medium text-gray-700">
                            Họ và tên <span className="text-red-500">*</span>
                        </label>
                        <Input
                            placeholder="Nhập họ và tên"
                            value={formData.guestName}
                            onChange={(e) => updateFormData({ guestName: e.target.value })}
                            className={cn(
                                errors.guestName && "border-destructive focus:ring-destructive",
                            )}
                        />
                        {errors.guestName && (
                            <p className="text-xs text-red-500">{errors.guestName}</p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">
                            Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <Input
                            placeholder="Nhập số điện thoại"
                            value={formData.guestPhone}
                            onChange={(e) => updateFormData({ guestPhone: e.target.value })}
                            className={cn(
                                errors.guestPhone && "border-destructive focus:ring-destructive",
                            )}
                        />
                        {errors.guestPhone && (
                            <p className="text-xs text-red-500">{errors.guestPhone}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-3 bg-white border rounded-lg shadow-sm px-3 py-4">
                <div>
                    <label className="text-sm font-medium text-gray-700">
                        📷 Ảnh chứng minh <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Upload ảnh CMND/CCCD hoặc VNeID, Passport (tối đa 3 ảnh)
                    </p>
                </div>
                <ImageUpload
                    images={formData.idImages}
                    onImagesChange={(images) => updateFormData({ idImages: images })}
                />
                {errors.idImages && (
                    <p className="text-xs text-red-500">{errors.idImages}</p>
                )}
            </div>

            <div className="bg-muted rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4">
                <h4 className="font-semibold text-black text-base sm:text-lg">Thông tin đặt phòng</h4>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div className="bg-white rounded-lg p-2.5">
                        <p className="text-gray-500 text-xs">Phòng</p>
                        <p className="font-semibold text-gray-800">{formData.roomName}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2.5">
                        <p className="text-gray-500 text-xs">Hình thức</p>
                        <p className="font-semibold text-gray-800">
                            {formData.mode === "hourly"
                                ? "Giờ"
                                : formData.mode === "daily"
                                    ? "Ngày"
                                    : "Qua đêm"}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg p-2.5">
                        <p className="text-gray-500 text-xs">Thời gian</p>
                        <p className="font-semibold text-gray-800">{duration} giờ</p>
                    </div>
                    <div className="bg-white rounded-lg p-2.5">
                        <p className="text-gray-500 text-xs">Hạng phòng</p>
                        <p className="font-semibold text-gray-800">
                            {ROOM_TYPE_LABELS[formData.roomType]}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg p-2.5">
                        <p className="text-gray-500 text-xs">Người lớn</p>
                        <p className="font-semibold text-gray-800">{formData.adults} người</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded-lg p-2.5">
                        <p className="text-gray-500 text-xs">Nhận phòng</p>
                        <p className="font-semibold text-gray-800">
                            {formatDate(formData.checkInDate)} - {formData.checkInTime}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg p-2.5">
                        <p className="text-gray-500 text-xs">Trả phòng</p>
                        <p className="font-semibold text-gray-800">
                            {formatDate(formData.checkOutDate)} - {formData.checkOutTime}
                        </p>
                    </div>
                </div>

                <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Giá phòng</span>
                        <span className="font-medium">{formatPrice(price)} VNĐ</span>
                    </div>
                    {foodTotal > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Đồ ăn & uống</span>
                            <span className="font-medium">{formatPrice(foodTotal)} VNĐ</span>
                        </div>
                    )}
                    <div className="flex justify-between text-lg pt-2 border-t">
                        <span className="font-semibold">Tổng thanh toán</span>
                        <span className="font-bold text-primary text-xl">
                            {formatPrice(totalPrice)} VNĐ
                        </span>
                    </div>
                    <p className="text-gray-600 text-md">
                        • Hình thức: Chuyển khoản
                    </p>
                    <p className="text-gray-600 text-md">
                        • Quý khách vui lòng thanh toán trong vòng 5 phút sau khi đặt phòng
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="text-sm font-bold text-black">Ghi chú</label>
                    <Textarea
                        placeholder="Nhập ghi chú..."
                        value={formData.note}
                        onChange={(e) => updateFormData({ note: e.target.value })}
                        className={cn(errors.note && "border-destructive focus:ring-destructive")}
                    />
                </div>

                <div className="mt-4">
                    <label className="text-sm font-bold text-black">🎫 Voucher giảm giá</label>
                    <Input
                        placeholder="Nhập mã voucher..."
                        value={formData.voucher}
                        onChange={(e) => updateFormData({ voucher: e.target.value })}
                        className="mt-1"
                    />
                </div>

                <div className="flex items-start gap-3">
                    <Checkbox
                        checked={formData.acceptTerms}
                        onCheckedChange={(checked) => updateFormData({ acceptTerms: checked === true })}
                        className="mt-1"
                    />
                    <div>
                        <label className="text-sm">
                            <button type="button" onClick={() => setShowTerms(true)} className="text-primary underline cursor-pointer">
                                Chấp nhận điều khoản
                            </button>{' '}đặt phòng &amp; chính sách bảo mật thông tin của Chốn Cinehome <span className="text-red-500">*</span>
                        </label>
                        {errors.acceptTerms && (
                            <p className="text-xs text-red-500">{errors.acceptTerms}</p>
                        )}
                    </div>
                </div>
                <Dialog open={showTerms} onOpenChange={setShowTerms}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle className="text-center text-lg font-bold">Nội quy Homestay</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4 max-h-86 overflow-y-auto text-md leading-7 pr-2">
                            <ol className="list-decimal list-inside space-y-2">
                                <li>Xuất trình CCCD/hộ chiếu khi nhận phòng.</li>
                                <li>Không mang vũ khí, chất cấm, hoặc gây nguy hiểm.</li>
                                <li>Không tổ chức hoạt động trái pháp luật tại chỗ ở.</li>
                                <li>Không tự ý thay đổi phòng hoặc ở quá số người đăng ký; không nấu ăn tại phòng.</li>
                                <li>Giữ gìn tài sản và vệ sinh; mất mát tài sản bên Chốn không chịu trách nhiệm.</li>
                                <li>Trả phòng đúng giờ; vi phạm nội quy có thể bị từ chối phục vụ.</li>
                                <li>Vui lòng bảo quản tài sản cá nhân, bên HomeStay không chịu trách nhiệm khi mất mát tài sản.</li>
                                <li>Quý khách vui lòng trả phòng đúng giờ đã đặt, nếu muộn hơn sẽ phụ thu thêm.</li>
                                <li>HomeStay có quyền từ chối phục vụ khi quý khách vi phạm nội quy.</li>
                            </ol>
                        </div>
                        <div className="mt-4 text-center">
                            <button
                                type="button"
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                                onClick={() => {
                                    updateFormData({ acceptTerms: true });
                                    setShowTerms(false);
                                }}
                            >
                                Đã hiểu
                            </button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};
