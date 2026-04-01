import { NavLink } from "react-router"
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Tag,
  Send,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import * as authService from "@/services/authService"
import type { UserRole } from "@/types/auth"

const NAV_ITEMS: { label: string; icon: LucideIcon; to: string; roles: UserRole[] }[] = [
  { label: "Tong quan", icon: LayoutDashboard, to: "/admin", roles: ['admin'] },
  { label: "Lich phong", icon: CalendarDays, to: "/admin/bookings", roles: ['admin', 'staff'] },
  { label: "Khach hang", icon: Users, to: "/admin/customers", roles: ['admin'] },
  { label: "Khuyen mai", icon: Tag, to: "/admin/promos", roles: ['admin'] },
  { label: "Telegram", icon: Send, to: "/admin/telegram", roles: ['admin'] },
  { label: "Cai dat", icon: Settings, to: "/admin/settings", roles: ['admin'] },
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
  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(currentRole))

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Dong menu dieu huong"
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
            Nha Cam Admin
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
                ? "bg-sidebar-accent text-sidebar-primary"
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
          aria-label={isOpen ? "Thu nho sidebar" : "Mo rong sidebar"}
          className={cn(
            "flex w-full items-center rounded-lg px-2.5 py-2.5 text-muted-foreground",
            "hover:bg-accent hover:text-accent-foreground transition-colors",
            !isOpen && "justify-center"
          )}
        >
          {isOpen ? (
            <>
              <ChevronLeft size={16} className="shrink-0" />
              <span className="ml-2 text-xs">Thu nho</span>
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
