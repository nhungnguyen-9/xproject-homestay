import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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
import * as promoService from '@/services/promoService'
import { PromoModal } from '@/components/admin/promo-modal'
import type { PromoCode } from '@/types/promo'
import type { RoomType } from '@/types/schedule'

type FilterStatus = 'all' | 'active' | 'expired' | 'disabled'

const ROOM_LABEL: Record<RoomType, string> = {
  standard: 'Standard',
  vip: 'VIP',
  supervip: 'SVIP',
}

const STATUS_BADGE: Record<
  PromoCode['status'],
  { label: string; className: string }
> = {
  active: { label: 'Hoạt động', className: 'bg-status-success-muted text-status-success-foreground' },
  expired: { label: 'Hết hạn', className: 'bg-muted text-muted-foreground' },
  disabled: { label: 'Vô hiệu', className: 'bg-status-error-muted text-status-error-foreground' },
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length < 3) return dateStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

/**
 * Trang quản lý khuyến mãi — CRUD mã giảm giá
 * Hiển thị danh sách promo codes, cho phép tạo/sửa/xoá và lọc theo trạng thái
 */
export function PromoManager() {
  const [promos, setPromos] = useState<PromoCode[]>(() => {
    promoService.refreshStatuses()
    return promoService.getAll()
  })
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState<PromoCode | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<PromoCode | null>(null)

  function loadPromos() {
    setPromos(promoService.getAll())
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return promos
    return promos.filter((p) => p.status === filter)
  }, [promos, filter])

  const activeCount = useMemo(
    () => promos.filter((p) => p.status === 'active').length,
    [promos]
  )

  const expiredCount = useMemo(
    () => promos.filter((p) => p.status === 'expired').length,
    [promos]
  )

  function handleCreate() {
    setEditingPromo(undefined)
    setModalOpen(true)
  }

  function handleEdit(promo: PromoCode) {
    setEditingPromo(promo)
    setModalOpen(true)
  }

  function handleSave(data: Omit<PromoCode, 'id' | 'usedCount' | 'createdAt'>) {
    if (editingPromo) {
      promoService.update(editingPromo.id, data)
    } else {
      promoService.create(data)
    }
    loadPromos()
  }

  function confirmDelete() {
    if (!deleteTarget) return
    promoService.remove(deleteTarget.id)
    toast.success(`Đã xóa mã ${deleteTarget.code}`)
    setDeleteTarget(null)
    loadPromos()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Mã khuyến mãi</h2>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterStatus)}
            className="rounded-md border border-border px-3 py-1.5 text-sm bg-card"
          >
            <option value="all">Tất cả</option>
            <option value="active">Hoạt động</option>
            <option value="expired">Hết hạn</option>
            <option value="disabled">Vô hiệu</option>
          </select>
          <Button
            onClick={handleCreate}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="size-4" />
            Tạo mã mới
          </Button>
        </div>
      </div>

      <p className="text-sm text-slate-500 mb-4">
        Hoạt động: <span className="font-medium text-status-success-foreground">{activeCount}</span>
        {' '}&middot;{' '}
        Hết hạn: <span className="font-medium text-slate-500">{expiredCount}</span>
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400 text-sm">
            {promos.length === 0
              ? "Chưa có mã khuyến mãi. Nhấn '+ Tạo mã mới' để bắt đầu."
              : 'Không có mã nào phù hợp bộ lọc.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Mã</th>
                <th className="px-4 py-3 font-medium">Giảm giá</th>
                <th className="px-4 py-3 font-medium">Loại phòng</th>
                <th className="px-4 py-3 font-medium">Đã dùng</th>
                <th className="px-4 py-3 font-medium">Hết hạn</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((promo) => {
                const isExpired = promo.status === 'expired'
                const badge = STATUS_BADGE[promo.status]
                return (
                  <tr
                    key={promo.id}
                    className={cn(
                      'hover:bg-muted/30 transition-colors',
                      isExpired && 'opacity-50'
                    )}
                  >
                    <td className="px-4 py-3">
                      <span className="inline-block rounded bg-status-info-muted px-2 py-0.5 font-mono text-xs font-semibold text-status-info-foreground tracking-wide">
                        {promo.code}
                      </span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {promo.discountType === 'percent'
                        ? `-${promo.discountValue}%`
                        : `-${formatPrice(promo.discountValue)}đ`}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {promo.applicableRoomTypes.length === 0 ? (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            Tất cả
                          </span>
                        ) : (
                          promo.applicableRoomTypes.map((rt) => (
                            <span
                              key={rt}
                              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                            >
                              {ROOM_LABEL[rt] ?? rt}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold">{promo.usedCount}</span>
                      <span className="text-slate-400">/{promo.maxUses}</span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {formatDateShort(promo.endDate)}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                          badge.className
                        )}
                      >
                        {badge.label}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleEdit(promo)}
                          title="Chỉnh sửa"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeleteTarget(promo)}
                          title="Xóa"
                          className="text-destructive hover:text-destructive hover:bg-destructive/5"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <PromoModal
        key={editingPromo?.id || (modalOpen ? 'new' : 'idle')}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingPromo(undefined)
        }}
        promo={editingPromo}
        onSave={handleSave}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa mã khuyến mãi</AlertDialogTitle>
            <AlertDialogDescription>
              Xóa mã khuyến mãi{' '}
              <span className="font-semibold">{deleteTarget?.code}</span>? Hành
              động này không thể hoàn tác.
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
