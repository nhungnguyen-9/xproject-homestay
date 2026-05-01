import { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/utils/helpers'
import * as foodItemService from '@/services/foodItemService'
import type { ApiFoodItem, CreateFoodItemPayload, FoodItemCategory } from '@/services/foodItemService'
import { ServiceFormModal } from './service-form-modal'
import { BACKEND_ORIGIN } from '@/services/branchService'

type FilterCategory = 'all' | FoodItemCategory

const CATEGORY_LABELS: Record<FoodItemCategory, string> = {
  item: 'Đồ ăn',
  drink: 'Đồ uống',
  combo: 'Combo',
  service: 'Dịch vụ',
}

const CATEGORY_BADGE: Record<FoodItemCategory, string> = {
  item: 'bg-amber-100 text-amber-700',
  drink: 'bg-sky-100 text-sky-700',
  combo: 'bg-violet-100 text-violet-700',
  service: 'bg-emerald-100 text-emerald-700',
}

export function ServiceManagement() {
  const [items, setItems] = useState<ApiFoodItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterCategory>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ApiFoodItem | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<ApiFoodItem | null>(null)

  const loadItems = useCallback(async () => {
    try {
      const data = await foodItemService.getAll()
      setItems(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tải được danh sách dịch vụ')
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    foodItemService.getAll()
      .then(data => { if (!cancelled) setItems(data) })
      .catch(err => { if (!cancelled) toast.error(err instanceof Error ? err.message : 'Không tải được danh sách dịch vụ') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'all') return items
    return items.filter((i) => i.category === filter)
  }, [items, filter])

  function handleCreate() {
    setEditingItem(undefined)
    setModalOpen(true)
  }

  function handleEdit(item: ApiFoodItem) {
    setEditingItem(item)
    setModalOpen(true)
  }

  async function handleSave(data: CreateFoodItemPayload, imageFile?: File) {
    try {
      let saved: ApiFoodItem
      if (editingItem) {
        saved = await foodItemService.update(editingItem.id, data)
      } else {
        saved = await foodItemService.create(data)
      }
      if (imageFile) {
        await foodItemService.uploadImage(saved.id, imageFile)
      }
      await loadItems()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lưu dịch vụ thất bại')
      throw err
    }
  }

  async function handleToggleActive(item: ApiFoodItem) {
    try {
      await foodItemService.update(item.id, { isActive: !item.isActive })
      await loadItems()
      toast.success(item.isActive ? `Đã ẩn ${item.name}` : `Đã hiện ${item.name}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Cập nhật thất bại')
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await foodItemService.remove(deleteTarget.id)
      toast.success(`Đã xóa ${deleteTarget.name}`)
      setDeleteTarget(null)
      await loadItems()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Dịch vụ</h2>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterCategory)}
            className="rounded-md border border-border px-3 py-1.5 text-sm bg-card"
          >
            <option value="all">Tất cả</option>
            <option value="item">Đồ ăn</option>
            <option value="drink">Đồ uống</option>
            <option value="combo">Combo</option>
            <option value="service">Dịch vụ</option>
          </select>
          <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="size-4" />
            Thêm dịch vụ
          </Button>
        </div>
      </div>

      <p className="text-sm text-slate-500 mb-4">
        Tổng: <span className="font-medium">{items.length}</span> dịch vụ
        {' '}&middot;{' '}
        Đang hoạt động: <span className="font-medium text-status-success-foreground">{items.filter(i => i.isActive).length}</span>
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400 text-sm">
            {items.length === 0
              ? "Chưa có dịch vụ nào. Nhấn '+ Thêm dịch vụ' để bắt đầu."
              : 'Không có dịch vụ nào phù hợp bộ lọc.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={cn(
                'relative bg-card rounded-lg border p-3 flex flex-col',
                !item.isActive && 'opacity-50',
              )}
            >
              <div className="h-36 flex items-center justify-center bg-muted/50 rounded-md overflow-hidden mb-3">
                {item.image ? (
                  <img
                    src={item.image.startsWith('http') ? item.image : `${BACKEND_ORIGIN}${item.image}`}
                    alt={item.name}
                    className="object-contain max-h-full max-w-full"
                  />
                ) : (
                  <div className="text-xs text-gray-400">Chưa có ảnh</div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', CATEGORY_BADGE[item.category])}>
                    {CATEGORY_LABELS[item.category]}
                  </span>
                  {!item.isActive && (
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">Ẩn</span>
                  )}
                </div>
                <p className="font-medium text-sm text-foreground">{item.name}</p>
                <p className="text-primary font-semibold mt-1 text-sm">{formatPrice(item.price)}đ</p>
              </div>

              <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleToggleActive(item)}
                  title={item.isActive ? 'Ẩn' : 'Hiện'}
                  className="text-muted-foreground"
                >
                  <span className="text-xs">{item.isActive ? 'Ẩn' : 'Hiện'}</span>
                </Button>
                <Button variant="ghost" size="icon-xs" onClick={() => handleEdit(item)} title="Chỉnh sửa">
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setDeleteTarget(item)}
                  title="Xóa"
                  className="text-destructive hover:text-destructive hover:bg-destructive/5"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ServiceFormModal
        key={editingItem?.id || (modalOpen ? 'new' : 'idle')}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingItem(undefined)
        }}
        item={editingItem}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa dịch vụ</AlertDialogTitle>
            <AlertDialogDescription>
              Xóa dịch vụ <span className="font-semibold">{deleteTarget?.name}</span>? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
