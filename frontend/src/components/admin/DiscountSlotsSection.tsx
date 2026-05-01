import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DiscountSlot } from '@/types/room'

interface DiscountSlotsSectionProps {
    value: DiscountSlot[]
    onChange: (next: DiscountSlot[]) => void
    disabled?: boolean
}

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/
const MAX_SLOTS = 10

function isValidSlot(s: DiscountSlot): boolean {
    return (
        TIME_PATTERN.test(s.startTime) &&
        TIME_PATTERN.test(s.endTime) &&
        s.endTime > s.startTime &&
        Number.isInteger(s.discountPercent) &&
        s.discountPercent >= 1 &&
        s.discountPercent <= 100
    )
}

export function DiscountSlotsSection({ value, onChange, disabled }: DiscountSlotsSectionProps) {
    const [open, setOpen] = useState(value.length > 0)

    const update = (idx: number, patch: Partial<DiscountSlot>) => {
        const next = value.map((s, i) => (i === idx ? { ...s, ...patch } : s))
        onChange(next)
    }
    const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx))
    const add = () => {
        if (value.length >= MAX_SLOTS) return
        onChange([...value, { startTime: '', endTime: '', discountPercent: 10 }])
    }

    const addDisabled = disabled || value.length >= MAX_SLOTS

    return (
        <div className="flex flex-col gap-3">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm font-medium hover:bg-muted/50"
                aria-expanded={open}
            >
                <span className="flex items-center gap-2">
                    {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    🎁 Khung giờ giảm giá
                    {value.length > 0 && (
                        <span className="text-xs text-muted-foreground">({value.length})</span>
                    )}
                </span>
            </button>

            {open && (
                <div className="flex flex-col gap-3 pl-6">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                            Tối đa {MAX_SLOTS} khung. Giảm giá tính theo phút, khung giảm cao hơn thắng khi chồng lấn.
                        </p>
                        <Button type="button" variant="outline" size="sm" onClick={add} disabled={addDisabled}>
                            + Thêm khung giờ
                        </Button>
                    </div>

                    {value.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Chưa có khung giờ giảm giá nào</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {value.map((slot, idx) => {
                                const valid = isValidSlot(slot)
                                return (
                                    <div
                                        key={idx}
                                        className={cn(
                                            'flex items-center gap-2 rounded-md border px-2 py-1.5',
                                            valid ? 'border-border' : 'border-destructive',
                                        )}
                                    >
                                        <Input
                                            type="time"
                                            value={slot.startTime}
                                            onChange={(e) => update(idx, { startTime: e.target.value })}
                                            className="w-28"
                                            disabled={disabled}
                                            aria-label="Giờ bắt đầu"
                                        />
                                        <span className="text-muted-foreground">–</span>
                                        <Input
                                            type="time"
                                            value={slot.endTime}
                                            onChange={(e) => update(idx, { endTime: e.target.value })}
                                            className="w-28"
                                            disabled={disabled}
                                            aria-label="Giờ kết thúc"
                                        />
                                        <Input
                                            type="number"
                                            min={1}
                                            max={100}
                                            step={1}
                                            value={slot.discountPercent}
                                            onChange={(e) => update(idx, { discountPercent: Number(e.target.value) })}
                                            className="w-20"
                                            disabled={disabled}
                                            aria-label="Phần trăm giảm"
                                        />
                                        <span className="text-sm text-muted-foreground">%</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => remove(idx)}
                                            disabled={disabled}
                                            aria-label="Xóa khung"
                                            className="ml-auto"
                                        >
                                            <X className="size-4" />
                                        </Button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
