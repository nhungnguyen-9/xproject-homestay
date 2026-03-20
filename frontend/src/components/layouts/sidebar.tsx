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

// === Cau hinh menu dieu huong voi role-based visibility ===
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
 * Sidebar - Dieu huong admin doc
 * - Collapsed: chi hien thi icons (64px)
 * - Expanded: icons + labels (220px)
 * - Active state: mau rose-400 nhacam primary
 * - Role-based filtering: staff chi thay "Lich phong"
 */
export function Sidebar({ isOpen, mobileOpen = false, onToggle, onCloseMobile }: SidebarProps) {
  const currentRole = authService.getRole()
  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(currentRole))

  return (
    <>
      {/* Overlay cho mobile khi mo sidebar */}
      {mobileOpen && (
        <button
          aria-label="Dong menu dieu huong"
          className="fixed inset-0 z-30 bg-slate-900/20 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          // Layout va transition
          "fixed inset-y-0 left-0 z-40 flex h-full flex-col border-r border-[#E2E8F0] bg-[#F8FAFC]",
          "transition-[width,transform] duration-300 ease-in-out lg:static lg:z-auto",
          // Chieu rong theo trang thai o desktop
          isOpen ? "w-[220px]" : "w-16",
          // Trang thai truot vao/ra o mobile
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
      {/* Logo khu vuc tren */}
      <div className={cn(
        "flex h-14 items-center border-b border-[#E2E8F0] px-3",
        isOpen ? "gap-3" : "justify-center"
      )}>
        {/* Logo icon nha cam */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F87171]">
          <span className="text-white font-bold text-sm">NC</span>
        </div>
        {/* Ten thuong hieu - an khi collapse */}
        {isOpen && (
          <span className="font-semibold text-[#334155] text-sm truncate">
            Nha Cam Admin
          </span>
        )}
      </div>

      {/* Danh sach menu - filtered by role */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
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
                // Active: nen rose nhat, text rose-400
                ? "bg-[#F87171]/10 text-[#F87171]"
                // Mac dinh: slate-600, hover nen slate-50
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-800",
              !isOpen && "justify-center"
            )}
            title={!isOpen ? label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {/* Label an khi sidebar thu nho */}
            {isOpen && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Nut toggle expand/collapse o cuoi */}
      <div className="border-t border-[#E2E8F0] p-2">
        <button
          onClick={onToggle}
          aria-label={isOpen ? "Thu nho sidebar" : "Mo rong sidebar"}
          className={cn(
            "flex w-full items-center rounded-lg px-2.5 py-2.5 text-slate-500",
            "hover:bg-slate-50 hover:text-slate-700 transition-colors",
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
