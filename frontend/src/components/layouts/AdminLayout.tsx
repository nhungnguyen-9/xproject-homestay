import React, { useState } from "react"
import { Outlet } from "react-router"
import { Sidebar } from "./sidebar"
import * as authService from "@/services/authService"
import type { UserRole } from "@/types/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

interface AdminLayoutProps {
  /** Noi dung trang admin hien thi ben phai sidebar */
  children?: React.ReactNode
}

/**
 * AdminLayout - Khung bo cuc cho trang quan ly
 * Cau truc: Sidebar (trai, co dinh) + Main content (phai, cuon)
 * Includes role toggle dropdown in the header
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [role, setRole] = useState<UserRole>(authService.getRole())

  const handleRoleChange = (newRole: UserRole) => {
    authService.setRole(newRole)
    setRole(newRole)
    window.location.reload()
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar dieu huong */}
      <Sidebar
        isOpen={sidebarOpen || mobileSidebarOpen}
        mobileOpen={mobileSidebarOpen}
        onToggle={() => setSidebarOpen(v => !v)}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Vung noi dung chinh */}
      <main className="flex-1 overflow-y-auto">
        {/* Header bar cua admin */}
        <div className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-white px-6 shadow-sm">
          {/* Nut toggle sidebar tren mobile */}
          <button
            aria-label="Toggle sidebar"
            onClick={() => setMobileSidebarOpen(v => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* Tieu de trang (slot cho children header) */}
          <div className="flex-1" />

          {/* Role toggle dropdown + Avatar */}
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-2.5 py-1.5 text-sm transition-colors hover:bg-slate-50">
                  <span
                    className={
                      role === 'admin'
                        ? "inline-flex items-center rounded-full bg-[#F87171]/10 px-2 py-0.5 text-xs font-semibold text-[#F87171]"
                        : "inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700"
                    }
                  >
                    {role === 'admin' ? 'Admin' : 'Staff'}
                  </span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleRoleChange('admin')}
                  className={role === 'admin' ? 'bg-slate-50' : ''}
                >
                  <span className="inline-flex items-center rounded-full bg-[#F87171]/10 px-2 py-0.5 text-xs font-semibold text-[#F87171]">
                    Admin
                  </span>
                  <span className="ml-2 text-sm text-slate-600">Quan tri vien</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleRoleChange('staff')}
                  className={role === 'staff' ? 'bg-slate-50' : ''}
                >
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    Staff
                  </span>
                  <span className="ml-2 text-sm text-slate-600">Nhan vien</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Avatar */}
            <span className="text-sm text-slate-600">{role === 'admin' ? 'Admin' : 'Staff'}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F87171] text-white text-sm font-semibold">
              {role === 'admin' ? 'A' : 'S'}
            </div>
          </div>
        </div>

        {/* Noi dung trang con */}
        <div className="p-6">
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  )
}
