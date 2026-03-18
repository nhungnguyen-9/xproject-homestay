import React from "react"
import { NavLink } from "react-router"
import {
  LayoutDashboard,
  CalendarDays,
  BedDouble,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

// === Cấu hình menu điều hướng ===
const NAV_ITEMS = [
  { label: "Tổng quan", icon: LayoutDashboard, to: "/admin" },
  { label: "Lịch phòng", icon: CalendarDays, to: "/admin/bookings" },
  { label: "Danh sách khách", icon: BedDouble, to: "/admin/rooms" },
  { label: "Cài đặt", icon: Settings, to: "/admin/settings" },
] as const

interface SidebarProps {
  isOpen: boolean
  mobileOpen?: boolean
  onToggle: () => void
  onCloseMobile?: () => void
}

/**
 * Sidebar - Điều hướng admin dọc
 * - Collapsed: chỉ hiển thị icons (64px)
 * - Expanded: icons + labels (220px)
 * - Active state: màu rose-400 nhacam primary
 */
export function Sidebar({ isOpen, mobileOpen = false, onToggle, onCloseMobile }: SidebarProps) {
  return (
    <>
      {/* Overlay cho mobile khi mở sidebar */}
      {mobileOpen && (
        <button
          aria-label="Đóng menu điều hướng"
          className="fixed inset-0 z-30 bg-slate-900/20 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          // Layout và transition
          "fixed inset-y-0 left-0 z-40 flex h-full flex-col border-r border-[#E2E8F0] bg-[#F8FAFC]",
          "transition-[width,transform] duration-300 ease-in-out lg:static lg:z-auto",
          // Chiều rộng theo trạng thái ở desktop
          isOpen ? "w-[220px]" : "w-16",
          // Trạng thái trượt vào/ra ở mobile
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
      {/* Logo khu vực trên */}
      <div className={cn(
        "flex h-14 items-center border-b border-[#E2E8F0] px-3",
        isOpen ? "gap-3" : "justify-center"
      )}>
        {/* Logo icon nhà cam */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F87171]">
          <span className="text-white font-bold text-sm">NC</span>
        </div>
        {/* Tên thương hiệu - ẩn khi collapse */}
        {isOpen && (
          <span className="font-semibold text-[#334155] text-sm truncate">
            Nhà Cam Admin
          </span>
        )}
      </div>

      {/* Danh sách menu */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {NAV_ITEMS.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            end
            onClick={onCloseMobile}
            className={({ isActive }) => cn(
              "flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium",
              "transition-colors duration-150",
              isActive
                // Active: nền rose nhạt, text rose-400
                ? "bg-[#F87171]/10 text-[#F87171]"
                // Mặc định: slate-600, hover nền slate-50
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-800",
              !isOpen && "justify-center"
            )}
            title={!isOpen ? label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {/* Label ẩn khi sidebar thu nhỏ */}
            {isOpen && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Nút toggle expand/collapse ở cuối */}
      <div className="border-t border-[#E2E8F0] p-2">
        <button
          onClick={onToggle}
          aria-label={isOpen ? "Thu nhỏ sidebar" : "Mở rộng sidebar"}
          className={cn(
            "flex w-full items-center rounded-lg px-2.5 py-2.5 text-slate-500",
            "hover:bg-slate-50 hover:text-slate-700 transition-colors",
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
