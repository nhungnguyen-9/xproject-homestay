import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Power, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import * as userService from '@/services/userService'
import type { StaffUser } from '@/services/userService'

const VALID_PERMISSIONS = [
  { value: 'bookings', label: 'Lịch phòng' },
  { value: 'customers', label: 'Khách hàng' },
  { value: 'revenue', label: 'Tổng quan' },
  { value: 'promos', label: 'Khuyến mãi' },
  { value: 'rooms', label: 'Quản lý phòng' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'settings', label: 'Cài đặt' },
] as const

interface StaffFormData {
  username: string
  password: string
  displayName: string
  email: string
  permissions: string[]
}

const EMPTY_FORM: StaffFormData = {
  username: '',
  password: '',
  displayName: '',
  email: '',
  permissions: [],
}

/**
 * Trang quản lý nhân viên — CRUD tài khoản staff, phân quyền, bật/tắt tài khoản
 * Chỉ hiển thị tài khoản staff (không hiển thị admin)
 */
export function StaffManagement() {
  const [staffList, setStaffList] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null)
  const [formData, setFormData] = useState<StaffFormData>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null)

  const fetchStaff = useCallback(async () => {
    try {
      const all = await userService.getAll()
      setStaffList(all.filter((u) => u.role === 'staff'))
    } catch {
      toast.error('Không thể tải danh sách nhân viên')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  const openCreateForm = () => {
    setEditingUser(null)
    setFormData(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEditForm = (user: StaffUser) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      password: '',
      displayName: user.displayName ?? '',
      email: user.email ?? '',
      permissions: [...user.permissions],
    })
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingUser(null)
    setFormData(EMPTY_FORM)
  }

  const togglePermission = (perm: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingUser) {
        await userService.update(editingUser.id, {
          displayName: formData.displayName,
          email: formData.email || null,
          permissions: formData.permissions,
        })
        toast.success('Đã cập nhật nhân viên')
      } else {
        await userService.create({
          username: formData.username,
          password: formData.password,
          displayName: formData.displayName,
          email: formData.email || undefined,
          permissions: formData.permissions,
        })
        toast.success('Đã tạo nhân viên mới')
      }
      closeForm()
      await fetchStaff()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (user: StaffUser) => {
    try {
      await userService.toggleActive(user.id)
      toast.success(user.isActive ? 'Đã vô hiệu hoá tài khoản' : 'Đã kích hoạt tài khoản')
      await fetchStaff()
    } catch {
      toast.error('Không thể thay đổi trạng thái')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await userService.remove(deleteTarget.id)
      toast.success('Đã xoá nhân viên')
      setDeleteTarget(null)
      await fetchStaff()
    } catch {
      toast.error('Không thể xoá nhân viên')
    }
  }

  const getPermissionLabel = (perm: string): string =>
    VALID_PERMISSIONS.find((p) => p.value === perm)?.label ?? perm

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">
          Quản lý nhân viên
          <span className="ml-2 text-sm font-normal text-slate-400">
            ({staffList.length})
          </span>
        </h2>
        <Button variant="primary" onClick={openCreateForm}>
          <Plus size={16} />
          Thêm nhân viên
        </Button>
      </div>

      {staffList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <p className="text-sm text-muted-foreground">
            Chưa có nhân viên nào.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  Tên đăng nhập
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  Tên hiển thị
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  Quyền
                </th>
                <th className="px-4 py-3 text-center font-medium text-slate-500">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-500">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-4 py-3 font-medium text-slate-700 font-mono text-xs">
                    {user.username}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {user.displayName ?? '--'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {user.email ?? '--'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.length === 0 ? (
                        <span className="text-xs text-slate-300">--</span>
                      ) : (
                        user.permissions.map((perm) => (
                          <span
                            key={perm}
                            className="inline-flex items-center rounded-full bg-status-info-muted px-2 py-0.5 text-[10px] font-medium text-status-info-foreground"
                          >
                            {getPermissionLabel(perm)}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {user.isActive ? (
                      <span className="inline-flex items-center rounded-full bg-status-success-muted px-2.5 py-0.5 text-xs font-medium text-status-success-foreground">
                        Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-status-error-muted px-2.5 py-0.5 text-xs font-medium text-status-error-foreground">
                        Vô hiệu
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditForm(user)}
                        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        title="Sửa"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={cn(
                          'flex size-8 items-center justify-center rounded-lg transition-colors',
                          user.isActive
                            ? 'text-status-warning-foreground hover:bg-status-warning-muted'
                            : 'text-status-success-foreground hover:bg-status-success-muted',
                        )}
                        title={user.isActive ? 'Vô hiệu hoá' : 'Kích hoạt'}
                      >
                        <Power size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(user)}
                        className="flex size-8 items-center justify-center rounded-lg text-status-error hover:bg-status-error-muted transition-colors"
                        title="Xoá"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form tạo/sửa nhân viên */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            className="absolute inset-0 bg-foreground/20"
            onClick={closeForm}
            aria-label="Đóng"
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-foreground">
                {editingUser ? 'Sửa nhân viên' : 'Thêm nhân viên'}
              </h3>
              <button
                onClick={closeForm}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="staff-username">Tên đăng nhập</Label>
                <Input
                  id="staff-username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, username: e.target.value }))
                  }
                  disabled={!!editingUser}
                  placeholder="vd: nhanvien01"
                  className={editingUser ? 'opacity-60' : ''}
                />
              </div>

              {!editingUser && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="staff-password">Mật khẩu</Label>
                  <Input
                    id="staff-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="Nhập mật khẩu"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="staff-displayname">Tên hiển thị</Label>
                <Input
                  id="staff-displayname"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, displayName: e.target.value }))
                  }
                  placeholder="vd: Nguyễn Văn A"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="staff-email">Email (tuỳ chọn)</Label>
                <Input
                  id="staff-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="vd: email@example.com"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Quyền truy cập</Label>
                <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
                  {VALID_PERMISSIONS.map((perm) => (
                    <div key={perm.value} className="flex items-center justify-between px-3 py-2.5">
                      <Label htmlFor={`perm-${perm.value}`} className="text-sm font-normal cursor-pointer">
                        {perm.label}
                      </Label>
                      <Switch
                        id={`perm-${perm.value}`}
                        checked={formData.permissions.includes(perm.value)}
                        onCheckedChange={() => togglePermission(perm.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={
                    submitting ||
                    !formData.username.trim() ||
                    !formData.displayName.trim() ||
                    (!editingUser && !formData.password.trim())
                  }
                >
                  {submitting
                    ? 'Đang lưu...'
                    : editingUser
                      ? 'Cập nhật'
                      : 'Tạo nhân viên'}
                </Button>
                <Button type="button" variant="outline" onClick={closeForm}>
                  Huỷ
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm xoá */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá nhân viên</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xoá tài khoản{' '}
              <strong>{deleteTarget?.displayName ?? deleteTarget?.username}</strong>?
              Thao tác này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-status-error text-white hover:bg-status-error/90"
            >
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
