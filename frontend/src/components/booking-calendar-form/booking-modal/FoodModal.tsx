import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { FoodItem } from "@/types/schedule";
import { formatPrice } from "@/utils/helpers";
import { cn } from "@/lib/utils";

interface FoodModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: FoodItem[];
    onConfirm: (items: FoodItem[]) => void;
}

export const FoodModal: React.FC<FoodModalProps> = ({ open, onOpenChange, items, onConfirm }) => {
    const [localItems, setLocalItems] = React.useState<FoodItem[]>([]);

    React.useEffect(() => {
        setLocalItems(items.map((i) => ({ ...i })));
    }, [items, open]);

    const changeQty = (id: string, delta: number) => {
        setLocalItems((prev) =>
            prev.map((it) =>
                it.id === id ? { ...it, qty: Math.max(0, (it.qty || 0) + delta), selected: (Math.max(0, (it.qty || 0) + delta) > 0) } : it,
            ),
        );
    };

    const totalCount = localItems.reduce((s, it) => s + (it.qty || 0), 0);
    const totalPrice = localItems.reduce((s, it) => s + (it.qty || 0) * it.price, 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl w-[90vw] sm:w-[86vw] max-h-[80vh] flex flex-col p-0 overflow-hidden" style={{ maxWidth: 980 }}>
                {/* Header */}
                <div className="bg-rose-400 text-white p-3 sm:p-4 rounded-t-md flex items-center justify-between">
                    <h3 className="font-semibold text-base sm:text-lg">Đồ ăn & uống</h3>
                </div>

                {/* Grid */}
                <div className="p-2 sm:p-3 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {localItems.map((item) => (
                            <div
                                key={item.id}
                                className={cn(
                                    "relative bg-white rounded-lg p-3 border flex flex-col h-full",
                                    (item.qty || 0) > 0 ? "border-rose-400" : "border-gray-100",
                                )}
                            >
                                <div className="absolute top-3 right-3"><span className="bg-blue-100 text-xs text-blue-600 px-2 py-1 rounded-full">Sản phẩm</span></div>

                                <div className="h-48 flex items-center justify-center bg-gray-50 rounded-md overflow-hidden mb-3">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="object-contain max-h-full max-w-full" />
                                    ) : (
                                        <div className="text-xs text-gray-400">Hình ảnh</div>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <p className="font-medium text-sm text-gray-800">{item.name}</p>
                                    <p className="text-rose-600 font-semibold mt-2 text-sm">{formatPrice(item.price)}đ</p>
                                </div>

                                <div className="flex items-center gap-2 mt-3">
                                    <button
                                        type="button"
                                        className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-md flex items-center justify-center font-bold text-gray-700"
                                        onClick={() => changeQty(item.id, -1)}
                                        disabled={(item.qty || 0) === 0}
                                    >
                                        −
                                    </button>
                                    <div className="flex-1 text-center font-semibold text-sm">{item.qty || 0}</div>
                                    <button
                                        type="button"
                                        className="w-8 h-8 bg-rose-400 hover:bg-rose-500 text-white rounded-md flex items-center justify-center font-bold"
                                        onClick={() => changeQty(item.id, 1)}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer — sticky */}
                <div className="sticky bottom-0 bg-white p-3 sm:p-4 border-t">
                    <div style={{ maxWidth: 980 }} className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
                        <div className="text-xs sm:text-sm text-gray-700">{totalCount} sản phẩm</div>

                        <div className="flex-1 hidden sm:block" />

                        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                            <div className="text-right flex-1 sm:flex-none">
                                <div className="text-xs sm:text-sm text-gray-500">Tổng cộng</div>
                                <div className="text-rose-600 font-bold text-base sm:text-lg">{formatPrice(totalPrice)}đ</div>
                            </div>

                            <button type="button" className="px-3 sm:px-6 py-2 bg-white border rounded-md text-sm sm:text-base" onClick={() => onOpenChange(false)}>Hủy</button>

                            <button type="button" className="px-3 sm:px-6 py-2 bg-rose-600 text-white rounded-md flex items-center gap-2 text-sm sm:text-base" onClick={() => { onConfirm(localItems); onOpenChange(false); }}>
                                Xác nhận ({totalCount})
                            </button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
