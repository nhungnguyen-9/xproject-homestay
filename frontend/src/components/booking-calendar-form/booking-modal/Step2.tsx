import React, { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { BookingFormData } from "@/types/schedule";
import { COMBO_ITEMS } from "@/types/schedule";
import { formatDate, formatPrice } from "@/utils/helpers";
import { ImageUpload, ROOM_TYPE_LABELS } from "./index";
import * as customerService from "@/services/customerService";
import type { CustomerLookup } from "@/types/customer";

interface Step2Props {
    formData: BookingFormData;
    setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
    price: number;
    duration: number;
    errors: Record<string, string>;
}

export const Step2: React.FC<Step2Props> = ({ formData, setFormData, price, duration, errors }) => {
    const upd = React.useCallback((u: Partial<BookingFormData>) => setFormData(p => ({ ...p, ...u })), [setFormData]);
    const [lookupResult, setLookupResult] = React.useState<CustomerLookup | null | 'loading'>(null);
    const [showTerms, setShowTerms] = React.useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(() => {
        const phone = formData.guestPhone.replace(/\s/g, '');
        if (!/^[0-9]{10,11}$/.test(phone)) { setLookupResult(null); upd({ customerLookup: null }); return; }
        setLookupResult('loading');
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            const r = await customerService.getByPhone(phone);
            setLookupResult(r);
            if (r) upd({ guestName: r.name, customerLookup: r });
            else upd({ customerLookup: null });
        }, 600);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [formData.guestPhone, upd]);

    const selFood = formData.foodItems.filter(f => (f.qty || 0) > 0);
    const foodTotal = selFood.reduce((s, i) => s + i.price * (i.qty || 0), 0)
        + COMBO_ITEMS.filter(c => formData.selectedComboIds?.includes(c.id)).reduce((s, c) => s + c.price, 0);
    const totalPrice = price + foodTotal;
    const hasIdImages = lookupResult && lookupResult !== 'loading' && lookupResult.hasIdImages;

    const modeLabel = (
        formData.mode === 'hourly' ? 'Giờ'
        : formData.mode === 'daily' ? 'Ngày'
        : formData.mode === 'overnight' ? 'Qua đêm'
        : formData.mode === 'combo3h' ? 'Combo 3H'
        : formData.mode === 'combo6h1h'
            ? `Combo 6H+1H (${formData.combo6h1hOption === 'discount' ? 'giảm giá' : '+1H bonus'})`
            : 'Giờ'
    );

    return (
        <div className="flex flex-col lg:flex-row lg:items-stretch gap-5">
            {/* LEFT — form */}
            <div className="flex-1 space-y-4">
                <div>
                    <h4 className="font-bold text-base sm:text-lg text-gray-800">Bước 2: Thông tin khách hàng</h4>
                    <p className="text-sm text-gray-500 mt-0.5">Vui lòng nhập thông tin khách hàng và xác nhận đặt phòng</p>
                </div>

                {/* Họ tên + SĐT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Họ và tên <span className="text-red-500">*</span></label>
                        <Input placeholder="Nguyễn Văn A" value={formData.guestName} onChange={e => upd({ guestName: e.target.value })}
                            className={cn("bg-white", errors.guestName && "border-destructive")} />
                        {errors.guestName && <p className="text-xs text-red-500">{errors.guestName}</p>}
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Số điện thoại <span className="text-red-500">*</span></label>
                        <Input placeholder="0912 345 678" value={formData.guestPhone} onChange={e => upd({ guestPhone: e.target.value })}
                            className={cn("bg-white", errors.guestPhone && "border-destructive")} />
                        {errors.guestPhone && <p className="text-xs text-red-500">{errors.guestPhone}</p>}
                        {lookupResult === 'loading' && <p className="text-xs text-muted-foreground">Đang tra cứu...</p>}
                        {lookupResult && lookupResult !== 'loading' && lookupResult.hasIdImages && <p className="text-xs text-green-600 font-medium">✓ Khách quen — đã có giấy tờ</p>}
                        {lookupResult && lookupResult !== 'loading' && !lookupResult.hasIdImages && <p className="text-xs text-amber-600 font-medium">Khách quen — vui lòng bổ sung giấy tờ</p>}
                    </div>
                </div>

                {/* Ảnh CCCD */}
                {!hasIdImages && (
                    <div className="space-y-2 border rounded-lg p-3 bg-white">
                        <div>
                            <label className="text-sm font-medium text-gray-700">📷 Ảnh chứng minh <span className="text-red-500">*</span></label>
                            <p className="text-xs text-gray-500 mt-0.5">Vui lòng chụp ảnh CMND/CCCD mặt trước và mặt sau</p>
                        </div>
                        <ImageUpload images={formData.idImages} onImagesChange={imgs => upd({ idImages: imgs })} />
                        {errors.idImages && <p className="text-xs text-red-500">{errors.idImages}</p>}
                    </div>
                )}

                {/* Ghi chú */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Ghi chú</label>
                    <Textarea placeholder="Nhập ghi chú (không bắt buộc)..." value={formData.note}
                        onChange={e => upd({ note: e.target.value })} className="bg-white resize-none" rows={3} />
                </div>

                {/* Voucher */}
                <div className="flex items-center gap-2 border rounded-lg px-3 py-1 bg-white">
                    <span className="text-base">🎫</span>
                    <Input placeholder="Nhập mã voucher" value={formData.voucher}
                        onChange={e => upd({ voucher: e.target.value })} className="border-0 shadow-none px-1 h-auto focus-visible:ring-0 bg-transparent" />
                </div>

                {/* Checkbox điều khoản */}
                <div className="flex items-start gap-2">
                    <Checkbox checked={formData.acceptTerms} onCheckedChange={v => upd({ acceptTerms: v === true })} className="mt-0.5" />
                    <div>
                        <label className="text-sm text-gray-700">
                            Tôi đồng ý với{' '}
                            <button type="button" onClick={() => setShowTerms(true)} className="text-primary underline">điều khoản sử dụng và chính sách</button>
                            {' '}của Nhà Cam
                        </label>
                        {errors.acceptTerms && <p className="text-xs text-red-500 mt-0.5">{errors.acceptTerms}</p>}
                    </div>
                </div>
            </div>

            {/* RIGHT — tóm tắt */}
            <div className="lg:w-[320px] shrink-0 flex flex-col">
                <div className="border bg-[#F3F4F6] rounded-xl p-5 flex-1 space-y-3">
                    <h4 className="font-bold text-md text-gray-800">Tóm tắt đặt phòng</h4>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#f87171f2]">Phòng {formData.roomName}</span>
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[#DBEAFE] text-[#1E40AF]">Hình thức: {modeLabel}</span>
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[#D1FAE5] text-[#065F46]">{duration} giờ</span>
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#92400E]">Hạng {ROOM_TYPE_LABELS[formData.roomType]}</span>
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[#F1F5F9] text-[#475569]">{formData.adults} người lớn</span>
                    </div>

                    {/* Check-in / out */}
                    <div className="space-y-1.5 text-sm border-t pt-3 my-2">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Check-in</span>
                            <span className="font-sm text-gray-800">{formatDate(formData.checkInDate)} — {formData.checkInTime}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Check-out</span>
                            <span className="font-sm text-gray-800">{formatDate(formData.checkOutDate)} — {formData.checkOutTime}</span>
                        </div>
                    </div>

                    {/* Giá */}
                    <div className="space-y-1.5 text-sm border-t pt-3 my-2">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Giá phòng</span>
                            <span className="font-medium">{formatPrice(price)} VND</span>
                        </div>
                        {foodTotal > 0 && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Đồ ăn & uống</span>
                                <span className="font-medium">{formatPrice(foodTotal)} VND</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center border-t pt-2 mt-4">
                            <span className="font-bold text-sm text-gray-800">TỔNG THANH TOÁN</span>
                            <span className="font-bold text-base text-primary">{formatPrice(totalPrice)} VND</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Terms dialog */}
            <Dialog open={showTerms} onOpenChange={setShowTerms}>
                <DialogContent className="max-w-3xl bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-center text-lg font-bold">Nội quy Homestay</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 max-h-80 overflow-y-auto text-sm leading-7 pr-2">
                        <ol className="list-decimal list-inside space-y-2">
                            <li>Xuất trình CCCD/hộ chiếu khi nhận phòng.</li>
                            <li>Không mang vũ khí, chất cấm, hoặc gây nguy hiểm.</li>
                            <li>Không tổ chức hoạt động trái pháp luật tại chỗ ở.</li>
                            <li>Không tự ý thay đổi phòng hoặc ở quá số người đăng ký; không nấu ăn tại phòng.</li>
                            <li>Giữ gìn tài sản và vệ sinh; mất mát tài sản bên Chốn không chịu trách nhiệm.</li>
                            <li>Trả phòng đúng giờ; vi phạm nội quy có thể bị từ chối phục vụ.</li>
                            <li>Quý khách vui lòng trả phòng đúng giờ đã đặt, nếu muộn hơn sẽ phụ thu thêm.</li>
                        </ol>
                    </div>
                    <div className="mt-4 text-center">
                        <button type="button" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
                            onClick={() => { upd({ acceptTerms: true }); setShowTerms(false); }}>
                            Đã hiểu
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
