import { NavLink } from "react-router"
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Tag,
  Send,
  Settings,
  UserCog,
  ChevronLeft,
  ChevronRight,
  BedDouble,
  Building2,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import * as authService from "@/services/authService"

const NAV_ITEMS: { label: string; icon: LucideIcon; to: string; permission?: string }[] = [
  { label: "Tổng quan", icon: LayoutDashboard, to: "/admin", permission: 'revenue' },
  { label: "Lịch phòng", icon: CalendarDays, to: "/admin/bookings", permission: 'bookings' },
  { label: "Quản lý phòng", icon: BedDouble, to: "/admin/management", permission: 'rooms' },
  { label: "Chi nhánh", icon: Building2, to: "/admin/branches", permission: 'rooms' },
  { label: "Khách hàng", icon: Users, to: "/admin/customers", permission: 'customers' },
  { label: "Khuyến mãi", icon: Tag, to: "/admin/promos", permission: 'promos' },
  { label: "Telegram", icon: Send, to: "/admin/telegram", permission: 'telegram' },
  { label: "Cài đặt", icon: Settings, to: "/admin/settings" },
  { label: "Nhân viên", icon: UserCog, to: "/admin/staff" },
]

interface SidebarProps {
  isOpen: boolean
  mobileOpen?: boolean
  onToggle: () => void
  onCloseMobile?: () => void
}

/**
 * Thanh điều hướng dọc — thu gọn/mở rộng, lọc menu theo vai trò người dùng
 * Staff chỉ thấy "Lịch phòng", admin thấy toàn bộ menu
 */
export function Sidebar({ isOpen, mobileOpen = false, onToggle, onCloseMobile }: SidebarProps) {
  const currentRole = authService.getRole()
  const visibleItems = NAV_ITEMS.filter(item => {
    if (!item.permission) return currentRole === 'admin'
    return authService.canPerform(item.permission)
  })

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Đóng menu điều hướng"
          className="fixed inset-0 bg-foreground/20 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-full flex-col border-r border-sidebar-border bg-sidebar",
          "transition-[width,transform] duration-300 ease-in-out lg:static lg:z-auto",
          isOpen ? "w-[220px]" : "w-16",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className={cn(
          "flex h-14 items-center border-b border-sidebar-border px-3",
          isOpen ? "gap-3" : "justify-center"
        )}>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary">
            <span className="text-primary-foreground font-bold text-sm">NC</span>
          </div>
          {isOpen && (
            <span className="font-semibold text-sidebar-foreground text-sm truncate">
              Nhà Cam Admin
            </span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-1">
          {visibleItems.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={onCloseMobile}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium",
                "transition-colors duration-150",
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                !isOpen && "justify-center"
              )}
              title={!isOpen ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {isOpen && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={onToggle}
            aria-label={isOpen ? "Thu nhỏ sidebar" : "Mở rộng sidebar"}
            className={cn(
              "flex w-full items-center rounded-lg px-2.5 py-2.5 text-muted-foreground",
              "hover:bg-accent hover:text-accent-foreground transition-colors",
              !isOpen && "justify-center"
            )}
          >
            {isOpen ? (
              <>
                <ChevronLeft size={16} className="shrink-0" />
                <span className="ml-2 text-xs">Thu nhỏ</span>
              </>
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
