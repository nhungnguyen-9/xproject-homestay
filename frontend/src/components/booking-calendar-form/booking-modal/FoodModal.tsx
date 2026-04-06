import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { FoodItem } from "@/types/schedule";
import { formatPrice } from "@/utils/helpers";
import { cn } from "@/lib/utils";

interface FoodModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: FoodItem[];
    onConfirm: (items: FoodItem[]) => void;
}

/**
 * Modal chọn đồ ăn & nước uống — hiển thị danh sách sản phẩm dạng grid, cho phép tăng giảm số lượng
 */
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
                <DialogHeader className="bg-primary text-primary-foreground p-3 sm:p-4 rounded-t-md">
                    <DialogTitle className="font-semibold text-base sm:text-lg">Đồ ăn & uống</DialogTitle>
                </DialogHeader>

                <div className="p-2 sm:p-3 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {localItems.map((item) => (
                            <div
                                key={item.id}
                                className={cn(
                                    "relative bg-card rounded-lg p-3 border flex flex-col h-full",
                                    (item.qty || 0) > 0 ? "border-primary" : "border-border/50",
                                )}
                            >
                                {/* <div className="absolute top-3 right-3"><span className="bg-status-info-muted text-xs text-status-info-foreground px-2 py-1 rounded-full">Sản phẩm</span></div> */}

                                <div className="h-48 flex items-center justify-center bg-muted/50 rounded-md overflow-hidden mb-3">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="object-contain max-h-full max-w-full" />
                                    ) : (
                                        <div className="text-xs text-gray-400">Hình ảnh</div>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <p className="font-medium text-sm text-gray-800">{item.name}</p>
                                    <p className="text-primary font-semibold mt-2 text-sm">{formatPrice(item.price)}đ</p>
                                </div>

                                <div className="flex items-center gap-2 mt-3">
                                    <button
                                        type="button"
                                        className="w-8 h-8 bg-muted hover:bg-muted/80 rounded-md flex items-center justify-center font-bold text-muted-foreground"
                                        onClick={() => changeQty(item.id, -1)}
                                        disabled={(item.qty || 0) === 0}
                                    >
                                        −
                                    </button>
                                    <div className="flex-1 text-center font-semibold text-sm">{item.qty || 0}</div>
                                    <button
                                        type="button"
                                        className="w-8 h-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md flex items-center justify-center font-bold"
                                        onClick={() => changeQty(item.id, 1)}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />
                <div className="sticky bottom-0 bg-card p-3 sm:p-4">
                    <div style={{ maxWidth: 980 }} className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
                        <div className="text-xs sm:text-sm text-gray-700">{totalCount} sản phẩm</div>

                        <div className="flex-1 hidden sm:block" />

                        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                            <div className="text-right flex-1 sm:flex-none">
                                <div className="text-xs sm:text-sm text-gray-500">Tổng cộng</div>
                                <div className="text-primary font-bold text-base sm:text-lg">{formatPrice(totalPrice)}đ</div>
                            </div>

                            <button type="button" className="px-3 sm:px-6 py-2 bg-white border rounded-md text-sm sm:text-base" onClick={() => onOpenChange(false)}>Hủy</button>

                            <button type="button" className="px-3 sm:px-6 py-2 bg-primary text-primary-foreground rounded-md flex items-center gap-2 text-sm sm:text-base" onClick={() => { onConfirm(localItems); onOpenChange(false); }}>
                                Xác nhận ({totalCount})
                            </button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
