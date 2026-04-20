import { useState, useMemo } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/utils/helpers'
import type { PromoCode } from '@/types/promo'
import type { RoomType } from '@/types/schedule'

interface PromoModalProps {
  open: boolean
  onClose: () => void
  promo?: PromoCode
  onSave: (data: Omit<PromoCode, 'id' | 'usedCount' | 'createdAt'>) => Promise<void> | void
}

const ROOM_TYPE_OPTIONS: { value: RoomType; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'vip', label: 'VIP' },
  { value: 'supervip', label: 'SuperVIP' },
]

function formatShortDate(dateStr: string): string {
  if (!dateStr) return '...'
  const parts = dateStr.split('-')
  if (parts.length < 3) return dateStr
  return `${parts[2]}/${parts[1]}`
}

/**
 * Modal tạo/chỉnh sửa mã khuyến mãi — validate với Zod, preview trực tiếp
 */
export function PromoModal({ open, onClose, promo, onSave }: PromoModalProps) {
  const isEdit = !!promo

  const [code, setCode] = useState(promo?.code || '')
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>(
    promo?.discountType || 'percent',
  )
  const [discountValue, setDiscountValue] = useState<number | ''>(
    promo?.discountValue ?? '',
  )
  const [maxUses, setMaxUses] = useState<number | ''>(promo?.maxUses ?? '')
  const [startDate, setStartDate] = useState(promo?.startDate || '')
  const [endDate, setEndDate] = useState(promo?.endDate || '')
  const [applicableRoomTypes, setApplicableRoomTypes] = useState<RoomType[]>(
    promo ? [...promo.applicableRoomTypes] : [],
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const promoSchema = useMemo(() => {
    return z.object({
      code: z
        .string()
        .min(3, 'Mã phải có ít nhất 3 ký tự')
        .max(20, 'Mã tối đa 20 ký tự')
        .regex(/^[A-Z0-9]{3,20}$/, 'Chỉ chấp nhận chữ in hoa (A-Z) và số (0-9)'),
      discountType: z.enum(['percent', 'fixed']),
      discountValue: z.number(),
      maxUses: z.number().int().min(1, 'Tối thiểu 1').max(99999, 'Tối đa 99,999'),
      startDate: z.string().min(1, 'Bắt buộc'),
      endDate: z.string().min(1, 'Bắt buộc'),
      applicableRoomTypes: z.array(z.enum(['standard', 'vip', 'supervip'])),
      status: z.enum(['active', 'expired', 'disabled']),
    })
  }, [])

  function toggleRoomType(rt: RoomType) {
    setApplicableRoomTypes((prev) => {
      if (prev.includes(rt)) {
        return prev.filter((t) => t !== rt)
      }
      return [...prev, rt]
    })
  }

  function selectAll() {
    setApplicableRoomTypes([])
  }

  const isAllSelected = applicableRoomTypes.length === 0

  const remaining = useMemo(() => {
    const max = typeof maxUses === 'number' ? maxUses : 0
    const used = promo?.usedCount ?? 0
    return Math.max(0, max - used)
  }, [maxUses, promo])

  const roomLabel = useMemo(() => {
    if (applicableRoomTypes.length === 0) return 'tất cả phòng'
    return applicableRoomTypes
      .map((rt) => ROOM_TYPE_OPTIONS.find((o) => o.value === rt)?.label ?? rt)
      .join(', ')
  }, [applicableRoomTypes])

  const discountLabel = useMemo(() => {
    if (discountValue === '' || discountValue === 0) return '...'
    if (discountType === 'percent') return `${discountValue}%`
    return `${formatPrice(discountValue)}đ`
  }, [discountType, discountValue])

  async function handleSubmit() {
    const rawData = {
      code: code.toUpperCase(),
      discountType,
      discountValue: typeof discountValue === 'number' ? discountValue : 0,
      maxUses: typeof maxUses === 'number' ? maxUses : 0,
      startDate,
      endDate,
      applicableRoomTypes,
      status: 'active' as const,
    }

    const newErrors: Record<string, string> = {}

    const result = promoSchema.safeParse(rawData)
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string
        if (!newErrors[key]) {
          newErrors[key] = issue.message
        }
      }
    }

    if (discountType === 'percent') {
      const val = typeof discountValue === 'number' ? discountValue : 0
      if (val < 1 || val > 100) {
        newErrors.discountValue = 'Phần trăm phải từ 1 đến 100'
      }
    } else {
      const val = typeof discountValue === 'number' ? discountValue : 0
      if (val < 1000 || val > 10000000) {
        newErrors.discountValue = 'Số tiền phải từ 1,000 đến 10,000,000'
      }
    }

    if (startDate && endDate && endDate <= startDate) {
      newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    try {
      await onSave(rawData)
      toast.success(isEdit ? 'Đã cập nhật mã khuyến mãi' : 'Đã tạo mã khuyến mãi mới')
      onClose()
    } catch {
      // Toast đã được show trong promo-manager, không đóng modal để user sửa lại
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Chỉnh sửa mã khuyến mãi' : 'Tạo mã khuyến mãi mới'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Mã khuyến mãi
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="VD: SUMMER20"
              className={cn(
                'w-full rounded-md border px-3 py-2 text-sm font-mono uppercase tracking-wider',
                errors.code ? 'border-destructive ring-1 ring-destructive' : 'border-border'
              )}
            />
            {errors.code && (
              <p className="text-xs text-destructive mt-1">{errors.code}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Loại giảm giá
            </label>
            <div className="flex rounded-md border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setDiscountType('percent')}
                className={cn(
                  'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                  discountType === 'percent'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                %
              </button>
              <button
                type="button"
                onClick={() => setDiscountType('fixed')}
                className={cn(
                  'flex-1 px-4 py-2 text-sm font-medium transition-colors border-l border-border',
                  discountType === 'fixed'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                VND
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {discountType === 'percent' ? 'Giá trị (%)' : 'Giá trị (VND)'}
            </label>
            <input
              type="number"
              value={discountValue}
              onChange={(e) =>
                setDiscountValue(e.target.value === '' ? '' : Number(e.target.value))
              }
              placeholder={discountType === 'percent' ? '1 - 100' : '1,000 - 10,000,000'}
              min={discountType === 'percent' ? 1 : 1000}
              max={discountType === 'percent' ? 100 : 10000000}
              className={cn(
                'w-full rounded-md border px-3 py-2 text-sm',
                errors.discountValue
                  ? 'border-destructive ring-1 ring-destructive'
                  : 'border-border'
              )}
            />
            {errors.discountValue && (
              <p className="text-xs text-destructive mt-1">{errors.discountValue}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Số lần sử dụng tối đa
            </label>
            <input
              type="number"
              value={maxUses}
              onChange={(e) =>
                setMaxUses(e.target.value === '' ? '' : Number(e.target.value))
              }
              placeholder="1 - 99,999"
              min={1}
              max={99999}
              className={cn(
                'w-full rounded-md border px-3 py-2 text-sm',
                errors.maxUses ? 'border-destructive ring-1 ring-destructive' : 'border-border'
              )}
            />
            {errors.maxUses && (
              <p className="text-xs text-destructive mt-1">{errors.maxUses}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={cn(
                  'w-full rounded-md border px-3 py-2 text-sm',
                  errors.startDate
                    ? 'border-destructive ring-1 ring-destructive'
                    : 'border-border'
                )}
              />
              {errors.startDate && (
                <p className="text-xs text-destructive mt-1">{errors.startDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Ngày kết thúc
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={cn(
                  'w-full rounded-md border px-3 py-2 text-sm',
                  errors.endDate
                    ? 'border-destructive ring-1 ring-destructive'
                    : 'border-border'
                )}
              />
              {errors.endDate && (
                <p className="text-xs text-destructive mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Loại phòng áp dụng
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectAll}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                  isAllSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground'
                )}
              >
                Tất cả
              </button>
              {ROOM_TYPE_OPTIONS.map((opt) => {
                const isSelected =
                  !isAllSelected && applicableRoomTypes.includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleRoomType(opt.value)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-lg bg-status-success-muted border border-status-success/20 p-3">
            <p className="text-sm text-status-success-foreground">
              <span className="font-semibold">
                Ma {code || '...'}{' '}
              </span>
              giam {discountLabel} cho {roomLabel}.
              {' '}Hieu luc {formatShortDate(startDate)} &ndash;{' '}
              {formatShortDate(endDate)}. Con{' '}
              {remaining}/{typeof maxUses === 'number' ? maxUses : '...'} lan.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            variant="primary"
          >
            {isEdit ? 'Lưu thay đổi' : 'Tạo mã'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
