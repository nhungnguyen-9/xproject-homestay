import { useState } from 'react'
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
import type { ApiFoodItem, CreateFoodItemPayload, FoodItemCategory } from '@/services/foodItemService'
import { BACKEND_ORIGIN } from '@/services/branchService'

interface ServiceFormModalProps {
  open: boolean
  onClose: () => void
  item?: ApiFoodItem
  onSave: (data: CreateFoodItemPayload, imageFile?: File) => Promise<void>
}

const CATEGORY_OPTIONS: { value: FoodItemCategory; label: string }[] = [
  { value: 'item', label: 'Đồ ăn' },
  { value: 'drink', label: 'Đồ uống' },
  { value: 'combo', label: 'Combo' },
  { value: 'service', label: 'Dịch vụ' },
]

export function ServiceFormModal({ open, onClose, item, onSave }: ServiceFormModalProps) {
  const isEdit = !!item

  const [name, setName] = useState(item?.name ?? '')
  const [price, setPrice] = useState<number | ''>(item?.price ?? '')
  const [category, setCategory] = useState<FoodItemCategory>(item?.category ?? 'item')
  const [isActive, setIsActive] = useState(item?.isActive ?? true)
  const [sortOrder, setSortOrder] = useState<number | ''>(item?.sortOrder ?? 0)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(
    item?.image ? (item.image.startsWith('http') ? item.image : `${BACKEND_ORIGIN}${item.image}`) : null,
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit() {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Tên không được để trống'
    if (price === '' || price < 0) newErrors.price = 'Giá không hợp lệ'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})

    const data: CreateFoodItemPayload = {
      name: name.trim(),
      price: typeof price === 'number' ? price : 0,
      category,
      isActive,
      sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      image: item?.image ?? null,
    }

    setSaving(true)
    try {
      await onSave(data, imageFile ?? undefined)
      toast.success(isEdit ? 'Đã cập nhật dịch vụ' : 'Đã tạo dịch vụ mới')
      onClose()
    } catch {
      // error toast handled by parent
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Tên</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Pepsi, My Ly, ..."
              className={cn(
                'w-full rounded-md border px-3 py-2 text-sm',
                errors.name ? 'border-destructive ring-1 ring-destructive' : 'border-border',
              )}
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Giá (VND)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="VD: 15000"
              min={0}
              className={cn(
                'w-full rounded-md border px-3 py-2 text-sm',
                errors.price ? 'border-destructive ring-1 ring-destructive' : 'border-border',
              )}
            />
            {errors.price && <p className="text-xs text-destructive mt-1">{errors.price}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Phân loại</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCategory(opt.value)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                    category === opt.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Hình ảnh</label>
            <div className="flex items-center gap-3">
              {imagePreview && (
                <div className="size-16 rounded-md overflow-hidden border border-border bg-muted/50 flex items-center justify-center">
                  <img src={imagePreview} alt="preview" className="object-contain max-h-full max-w-full" />
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="block text-sm font-medium text-foreground">Thứ tự hiển thị</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value === '' ? '' : Number(e.target.value))}
              min={0}
              className="w-20 rounded-md border border-border px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                isActive ? 'bg-primary' : 'bg-muted',
              )}
            >
              <span
                className={cn(
                  'inline-block size-4 rounded-full bg-white transition-transform',
                  isActive ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </button>
            <span className="text-sm text-foreground">{isActive ? 'Đang hoạt động' : 'Đã ẩn'}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo mới'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
